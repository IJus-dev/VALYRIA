import {
  canOperateOnChain,
  createOffer,
  createFeeRecord,
  FEE_RATES,
  AuthorizationError,
  InsufficientFundsError,
  NotFoundError,
  ValidationError,
  type Offer,
  type OfferStatus,
  type SeriesDescriptor
} from "@valyria/domain";
import type { AccountTopology, XrplGateway, XrplNetworkStatus } from "../adapters/xrpl/xrpl-gateway";
import type { EventBus } from "../lib/event-bus";
import type { PlatformRepository } from "./platform-repository";

export interface MarketSummary {
  metrics: Array<{
    label: string;
    value: string;
    hint: string;
  }>;
  orderBook: Array<{
    id: string;
    series: string;
    quantity: number;
    unitPrice: number;
    notional: number;
    status: OfferStatus;
    executionLane: Offer["executionLane"];
    expiresAt: string;
    sellerWallet?: string;
    ledgerHash?: string;
    ledgerOfferSequence?: number;
  }>;
  lifecycle: Array<{
    step: string;
    title: string;
    description: string;
  }>;
  priceTrend: Array<{
    label: string;
    value: number;
  }>;
  accountTopology: AccountTopology;
  networkStatus: XrplNetworkStatus;
}

export class MarketService {
  constructor(
    private readonly repository: PlatformRepository,
    private readonly xrplGateway: XrplGateway,
    private readonly eventBus?: EventBus
  ) {}

  async listOffers(): Promise<Offer[]> {
    return this.repository.listOffers();
  }

  async getOfferDetails(offerId: string): Promise<{
    offer: Offer;
    producer?: {
      id: string;
      name?: string;
      email?: string;
      state: string;
      walletAddress?: string;
    };
    currentHolder?: {
      id: string;
      name?: string;
      email?: string;
      state: string;
      walletAddress?: string;
    };
    proofs: Awaited<ReturnType<PlatformRepository["listProofs"]>>;
    redeems: Awaited<ReturnType<PlatformRepository["listRedeems"]>>;
  }> {
    const offer = await this.repository.getOffer(offerId);

    if (!offer) {
      throw new NotFoundError("Offer", offerId);
    }

    const [producer, currentHolder, proofs, redeems] = await Promise.all([
      this.repository.getUser(offer.producerId),
      offer.currentHolderId ? this.repository.getUser(offer.currentHolderId) : Promise.resolve(undefined),
      this.repository.listProofs(offer.id),
      this.repository.listRedeems()
    ]);

    return {
      offer,
      ...(producer
        ? {
            producer: {
              id: producer.id,
              ...(producer.name ? { name: producer.name } : {}),
              email: producer.email,
              state: producer.state,
              ...(producer.walletAddress ? { walletAddress: producer.walletAddress } : {})
            }
          }
        : {}),
      ...(currentHolder
        ? {
            currentHolder: {
              id: currentHolder.id,
              ...(currentHolder.name ? { name: currentHolder.name } : {}),
              email: currentHolder.email,
              state: currentHolder.state,
              ...(currentHolder.walletAddress ? { walletAddress: currentHolder.walletAddress } : {})
            }
          }
        : {}),
      proofs,
      redeems: redeems.filter((redeem) => redeem.offerId === offer.id)
    };
  }

  async createOffer(input: {
    producerId: string;
    quantity: number;
    unitPrice: number;
    expiresAt: string;
    descriptor: SeriesDescriptor;
    walletSeed?: string;
  }): Promise<Offer> {
    const user = await this.repository.getUser(input.producerId);

    if (!user) {
      throw new NotFoundError("Producer", input.producerId);
    }

    if (user.state !== "producer_approved") {
      throw new ValidationError("Producer must be in producer_approved state.");
    }

    const bond = await this.repository.findLockedBondByUser(input.producerId);

    if (!bond) {
      throw new ValidationError("Producer needs a locked bond before listing an offer.");
    }

    const notional = input.quantity * input.unitPrice;
    const effectiveBondAmount = bond.amount - bond.slashedAmount;
    const requiredMinimum = notional * 0.10;

    if (effectiveBondAmount < requiredMinimum) {
      throw new InsufficientFundsError(
        effectiveBondAmount,
        requiredMinimum,
        `Bond amount (${effectiveBondAmount} VEX) is below the required 10% minimum (${requiredMinimum} VEX) for this offer notional (${notional}).`
      );
    }

    if (!user.walletAddress) {
      throw new ValidationError("Producer needs a linked wallet before publishing a DEX offer.");
    }

    const offer = createOffer({
      id: crypto.randomUUID(),
      producerId: input.producerId,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      expiresAt: input.expiresAt,
      descriptor: input.descriptor,
      sellerWallet: user.walletAddress
    });
    const ledgerSubmission = await this.xrplGateway.submitSeriesOffer({
      sellerWalletAddress: user.walletAddress,
      ...(input.walletSeed ? { sellerWalletSeed: input.walletSeed } : {}),
      seriesCurrencyHex: offer.series.currencyHex,
      ...(offer.seriesIssuer ? { seriesIssuer: offer.seriesIssuer } : {}),
      quantity: offer.quantity,
      unitPrice: offer.unitPrice,
      expiresAt: offer.expiresAt
    });

    const savedOffer = await this.repository.upsertOffer({
      ...offer,
      executionLane: ledgerSubmission.receipt.submitted ? "xrpl_dex" : "local",
      seriesIssuer: ledgerSubmission.intent.sell.issuer,
      quoteCurrency: ledgerSubmission.intent.receive.currency,
      quoteIssuer: ledgerSubmission.intent.receive.issuer,
      ...(ledgerSubmission.receipt.hash ? { ledgerHash: ledgerSubmission.receipt.hash } : {}),
      ...(typeof ledgerSubmission.receipt.ledgerIndex === "number"
        ? { ledgerSequence: ledgerSubmission.receipt.ledgerIndex }
        : {}),
      ...(typeof ledgerSubmission.offerSequence === "number"
        ? { ledgerOfferSequence: ledgerSubmission.offerSequence }
        : {})
    });

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      actorUserId: user.id,
      action: "offer.created",
      entityType: "offer",
      entityId: savedOffer.id,
      payload: {
        series: savedOffer.series.alias,
        notional: savedOffer.notional,
        executionLane: savedOffer.executionLane,
        xrplMode: ledgerSubmission.receipt.mode,
        submitted: ledgerSubmission.receipt.submitted,
        sellerWallet: savedOffer.sellerWallet,
        ...(savedOffer.ledgerHash ? { hash: savedOffer.ledgerHash } : {}),
        ...(typeof savedOffer.ledgerSequence === "number"
          ? { ledgerIndex: savedOffer.ledgerSequence }
          : {}),
        ...(typeof savedOffer.ledgerOfferSequence === "number"
          ? { offerSequence: savedOffer.ledgerOfferSequence }
          : {}),
        ...(ledgerSubmission.inventoryReceipt?.hash
          ? { inventoryHash: ledgerSubmission.inventoryReceipt.hash }
          : {})
      },
      createdAt: new Date().toISOString()
    });

    await this.repository.createFeeRecord(
      createFeeRecord({
        id: crypto.randomUUID(),
        feeType: "listing",
        entityType: "offer",
        entityId: savedOffer.id,
        baseAmount: savedOffer.notional,
        feeRate: FEE_RATES.LISTING_FEE_RATE
      })
    );

    this.eventBus?.emit("offer.created", { offerId: savedOffer.id, series: savedOffer.series.alias, producerId: savedOffer.producerId });

    return savedOffer;
  }

  async buyOffer(input: {
    offerId: string;
    holderId: string;
    walletSeed?: string;
  }): Promise<{
    offer: Offer;
    ledger: Awaited<ReturnType<XrplGateway["submitSeriesBuy"]>>["receipt"];
  }> {
    const offer = await this.repository.getOffer(input.offerId);

    if (!offer) {
      throw new NotFoundError("Offer", input.offerId);
    }

    if (offer.executionLane !== "xrpl_dex") {
      throw new ValidationError("Only XRPL DEX offers can be bought through this flow.");
    }

    if (offer.status !== "listed") {
      throw new ValidationError(`Offer must be listed before buying. Current status: ${offer.status}.`);
    }

    const holder = await this.repository.getUser(input.holderId);

    if (!holder) {
      throw new NotFoundError("Holder", input.holderId);
    }

    if (!canOperateOnChain(holder.state)) {
      throw new AuthorizationError("Holder is not approved for on-chain operations.");
    }

    if (!holder.walletAddress) {
      throw new ValidationError("Holder must have a linked wallet before buying on XRPL.");
    }

    if (holder.id === offer.producerId) {
      throw new AuthorizationError("Producer cannot self-fill the same offer in this MVP flow.");
    }

    const ledgerSubmission = await this.xrplGateway.submitSeriesBuy({
      buyerWalletAddress: holder.walletAddress,
      ...(input.walletSeed ? { buyerWalletSeed: input.walletSeed } : {}),
      seriesCurrencyHex: offer.series.currencyHex,
      ...(offer.seriesIssuer ? { seriesIssuer: offer.seriesIssuer } : {}),
      quantity: offer.quantity,
      unitPrice: offer.unitPrice
    });
    const now = new Date().toISOString();
    const filledQuantity = ledgerSubmission.filledQuantity ?? offer.quantity;
    const isPartialFill = filledQuantity < offer.quantity;
    const savedOffer = await this.repository.upsertOffer({
      ...offer,
      status: isPartialFill ? "partially_filled" : "filled",
      currentHolderId: holder.id,
      filledQuantity,
      ...(ledgerSubmission.receipt.hash ? { fillLedgerHash: ledgerSubmission.receipt.hash } : {}),
      ...(typeof ledgerSubmission.receipt.ledgerIndex === "number"
        ? { fillLedgerSequence: ledgerSubmission.receipt.ledgerIndex }
        : {}),
      ...(!isPartialFill ? { filledAt: now } : {}),
      updatedAt: now
    });

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      actorUserId: holder.id,
      action: "offer.filled",
      entityType: "offer",
      entityId: savedOffer.id,
      payload: {
        executionLane: savedOffer.executionLane,
        holderId: holder.id,
        holderWallet: holder.walletAddress,
        quantity: savedOffer.quantity,
        unitPrice: savedOffer.unitPrice,
        notional: savedOffer.notional,
        xrplMode: ledgerSubmission.receipt.mode,
        submitted: ledgerSubmission.receipt.submitted,
        ...(savedOffer.fillLedgerHash ? { hash: savedOffer.fillLedgerHash } : {}),
        ...(typeof savedOffer.fillLedgerSequence === "number"
          ? { ledgerIndex: savedOffer.fillLedgerSequence }
          : {})
      },
      createdAt: now
    });

    await this.repository.createFeeRecord(
      createFeeRecord({
        id: crypto.randomUUID(),
        feeType: "transaction",
        entityType: "offer",
        entityId: savedOffer.id,
        baseAmount: savedOffer.notional,
        feeRate: FEE_RATES.TRANSACTION_FEE_RATE
      })
    );

    this.eventBus?.emit("offer.filled", { offerId: savedOffer.id, holderId: holder.id, quantity: filledQuantity });

    return {
      offer: savedOffer,
      ledger: ledgerSubmission.receipt
    };
  }

  async getSummary(): Promise<MarketSummary> {
    const [bonds, offers, redeems, credentials, proofs, oraclePrices, networkStatus] = await Promise.all([
      this.repository.listBonds(),
      this.repository.listOffers(),
      this.repository.listRedeems(),
      this.repository.listCredentials(),
      this.repository.listProofs(),
      this.repository.listOraclePrices(),
      this.xrplGateway.getNetworkStatus()
    ]);

    const activeOffers = offers.filter((offer) => offer.status === "listed" || offer.status === "partially_filled");
    const lockedBonds = bonds.filter((bond) => bond.state === "locked" || bond.state === "partially_slashed");
    const lockedNotional = lockedBonds.reduce((total, bond) => total + bond.amount, 0);
    const activeNotional = activeOffers.reduce((total, offer) => total + offer.notional, 0);
    const averagePrice =
      activeOffers.length === 0
        ? 0
        : activeOffers.reduce((total, offer) => total + offer.unitPrice, 0) / activeOffers.length;
    const referenceCommodity = activeOffers[0]?.series.alias.split(".")[0];
    const referenceSymbol = oraclePrices.some((point) => point.symbol === "MLH/BRL")
      ? "MLH/BRL"
      : referenceCommodity
        ? `${referenceCommodity}/BRL`
        : undefined;
    const trendPoints = referenceSymbol
      ? oraclePrices.filter((point) => point.symbol === referenceSymbol)
      : oraclePrices;

    return {
      metrics: [
        {
          label: "Locked bond",
          value: `${lockedNotional.toLocaleString("en-US")} VEX`,
          hint: "Garantias prontas para originacao."
        },
        {
          label: "Active offers",
          value: activeOffers.length.toString(),
          hint: "Series listadas no book principal."
        },
        {
          label: "Accepted credentials",
          value: credentials.filter((credential) => credential.status === "accepted").length.toString(),
          hint: "Credenciais aceitas e ativas no fluxo."
        },
        {
          label: "Proof artifacts",
          value: proofs.length.toString(),
          hint: "Evidencias registradas para underwriting e entrega."
        }
      ],
      orderBook: activeOffers.map((offer) => ({
        id: offer.id,
        series: offer.series.alias,
        quantity: offer.quantity,
        unitPrice: offer.unitPrice,
        notional: offer.notional,
        status: offer.status,
        executionLane: offer.executionLane,
        expiresAt: offer.expiresAt,
        ...(offer.sellerWallet ? { sellerWallet: offer.sellerWallet } : {}),
        ...(offer.ledgerHash ? { ledgerHash: offer.ledgerHash } : {}),
        ...(typeof offer.ledgerOfferSequence === "number"
          ? { ledgerOfferSequence: offer.ledgerOfferSequence }
          : {})
      })),
      lifecycle: [
        {
          step: "auth",
          title: "Auth.js + wallet proof",
          description: "Login de app separado de assinatura XRPL e credenciais on-chain."
        },
        {
          step: "bond",
          title: "Bond Vault custodial",
          description: `${lockedBonds.length} bond(s) confirmados com regras de DepositAuth.`
        },
        {
          step: "market",
          title: "DEX + AMM lane",
          description: `${activeOffers.length} oferta(s) ativas publicadas por serie, com ${activeOffers.filter((offer) => offer.executionLane === "xrpl_dex").length} no livro XRPL.`
        },
        {
          step: "redeem",
          title: "Redeem and delivery",
          description: `${redeems.length} fluxo(s) de entrega rastreavel no backlog atual.`
        }
      ],
      priceTrend:
        trendPoints.length > 0
          ? trendPoints
              .slice(0, 6)
              .reverse()
              .map((point, index) => ({
                label: `T-${trendPoints.length - index - 1}`,
                value: point.value
              }))
          : [
              { label: "T-5", value: 57.8 },
              { label: "T-4", value: 58.4 },
              { label: "T-3", value: 59.6 },
              { label: "T-2", value: 60.1 },
              { label: "T-1", value: 60.8 },
              { label: "Now", value: 61.25 }
            ],
      accountTopology: this.xrplGateway.getAccountTopology(),
      networkStatus
    };
  }
}
