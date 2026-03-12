import {
  assertTesSuccess,
  buildAmmCreateIntent,
  buildAmmDepositIntent,
  buildAmmWithdrawIntent,
  buildBondDepositIntent,
  buildBondEscrowCreateIntent,
  buildBondEscrowFinishIntent,
  buildBondEscrowCancelIntent,
  buildCredentialCreateIntent,
  buildOracleSetIntent,
  buildProofNftIntent,
  buildRedeemEscrowCreateIntent,
  buildRedeemEscrowFinishIntent,
  buildRedeemEscrowCancelIntent,
  buildSeriesBuyIntent,
  buildSeriesOfferIntent,
  buildSeriesRedeemIntent,
  type BondDepositIntent,
  type CredentialCreateIntent,
  type OracleSetIntent,
  type ProofNftIntent,
  type SeriesBuyIntent,
  type SeriesOfferIntent,
  type SeriesRedeemIntent
} from "@valyria/xrpl";
import { AuthorizationError, NotFoundError, ValidationError, XrplSubmissionError } from "@valyria/domain";
import { classifyTransactionResult } from "./xrpl-result-classifier";
import {
  Client,
  Wallet,
  convertStringToHex,
  getNFTokenID,
  isoTimeToRippleTime,
  type AMMCreate,
  type AMMDeposit,
  AMMDepositFlags,
  type AMMWithdraw,
  AMMWithdrawFlags,
  type CredentialAccept,
  type CredentialCreate,
  type EscrowCreate,
  type EscrowFinish,
  type EscrowCancel,
  type NFTokenMint,
  type OfferCreate,
  OfferCreateFlags,
  type OracleSet,
  type Payment,
  type PriceData,
  type TrustSet,
  type TransactionMetadata
} from "xrpl";
import type {
  AccountTopology,
  AmmCreateSubmission,
  AmmDepositSubmission,
  AmmInfoResult,
  AmmWithdrawSubmission,
  BondDepositSubmission,
  BondEscrowCreateSubmission,
  BondEscrowFinishSubmission,
  BondEscrowCancelSubmission,
  CredentialAcceptSubmission,
  CredentialCreateSubmission,
  OracleAggregateResult,
  OracleSetSubmission,
  ProofNftMintSubmission,
  RedeemEscrowCreateSubmission,
  RedeemEscrowFinishSubmission,
  RedeemEscrowCancelSubmission,
  SeriesBuySubmission,
  SeriesOfferSubmission,
  SeriesRedeemSubmission,
  XrplGateway,
  XrplNetworkStatus,
  XrplSubmissionReceipt
} from "./xrpl-gateway";

export interface RealXrplGatewayOptions {
  url: string;
  networkId: number;
  topology: AccountTopology;
  kycIssuerSeed?: string;
  oraclePublisherSeed?: string;
  coldIssuerSeed?: string;
  settlementWalletSeed?: string;
  testUserWallet?: string;
  testUserWalletSeed?: string;
  testBuyerWallet?: string;
  testBuyerWalletSeed?: string;
}

type SupportedSubmissionTransaction =
  | Payment
  | CredentialCreate
  | CredentialAccept
  | OracleSet
  | OfferCreate
  | TrustSet
  | NFTokenMint
  | EscrowCreate
  | EscrowFinish
  | EscrowCancel
  | AMMCreate
  | AMMDeposit
  | AMMWithdraw;

// FinishAfter em Ripple epoch (946684800 segundos offset do Unix epoch)
const RIPPLE_EPOCH_OFFSET = 946684800;

export function toRippleEpoch(isoDate: string): number {
  const unixSeconds = Math.floor(new Date(isoDate).getTime() / 1000);
  return unixSeconds - RIPPLE_EPOCH_OFFSET;
}

interface IssuedAmountLike {
  currency?: string;
  issuer?: string;
  value?: string;
}

function encodeCredentialType(input: string): string {
  return convertStringToHex(input).toUpperCase();
}

function encodeBlob(input: string): string {
  return convertStringToHex(input).toUpperCase();
}

function deriveOracleDocumentId(symbol: string): number {
  let hash = 2166136261;

  for (const char of symbol) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) || 1;
}

function splitSymbol(symbol: string): {
  baseAsset: string;
  quoteAsset: string;
} {
  const [baseAsset, quoteAsset, ...rest] = symbol.split("/").map((item) => item.trim());

  if (!baseAsset || !quoteAsset || rest.length > 0) {
    throw new ValidationError(`Invalid oracle symbol "${symbol}". Expected format BASE/QUOTE.`);
  }

  return {
    baseAsset,
    quoteAsset
  };
}

function toOraclePriceData(input: {
  symbol: string;
  value: number;
  scale?: number;
}): PriceData {
  const scale = input.scale ?? 2;
  const { baseAsset, quoteAsset } = splitSymbol(input.symbol);

  return {
    PriceData: {
      BaseAsset: baseAsset,
      QuoteAsset: quoteAsset,
      AssetPrice: Math.round(input.value * 10 ** scale),
      Scale: scale
    }
  };
}

function formatIssuedCurrencyValue(value: number, fractionDigits = 6): string {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ValidationError("Issued currency values must be finite and greater than zero.");
  }

  return value.toFixed(fractionDigits).replace(/\.?0+$/, "");
}

function buildTrustLineLimit(targetValue: string): string {
  const numericValue = Number(targetValue);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "1000000";
  }

  return Math.max(1000000, Math.ceil(numericValue * 10)).toString();
}

function isIssuedAmountLike(value: unknown): value is IssuedAmountLike {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const amount = value as IssuedAmountLike;
  return (
    typeof amount.currency === "string" &&
    typeof amount.issuer === "string" &&
    typeof amount.value === "string"
  );
}

export class RealXrplGateway implements XrplGateway {
  private readonly client: Client;
  private circuitState: "closed" | "open" | "half_open" = "closed";
  private consecutiveFailures = 0;
  private lastFailureAt = 0;
  private static readonly FAILURE_THRESHOLD = 5;
  private static readonly RECOVERY_TIMEOUT_MS = 30_000;

  constructor(private readonly options: RealXrplGatewayOptions) {
    this.client = new Client(options.url);
  }

  getAccountTopology(): AccountTopology {
    return this.options.topology;
  }

  async getNetworkStatus(): Promise<XrplNetworkStatus> {
    try {
      await this.ensureConnected();

      const serverInfo = await this.client.request({
        command: "server_info"
      });

      return {
        mode: "real",
        networkId: this.options.networkId,
        url: this.options.url,
        connected: true,
        ledgerVersion: serverInfo.result.info.validated_ledger?.seq
      };
    } catch {
      return {
        mode: "real",
        networkId: this.options.networkId,
        url: this.options.url,
        connected: false
      };
    }
  }

  previewBondDeposit(input: {
    amount: number;
    credentialIds: string[];
    issuer?: string;
  }): BondDepositIntent {
    return buildBondDepositIntent({
      destination: this.options.topology.bondVault,
      amount: {
        currency: "VEX",
        value: input.amount.toFixed(2),
        issuer: input.issuer ?? this.options.topology.coldIssuer
      },
      credentialIds: input.credentialIds
    });
  }

  previewCredentialCreate(input: {
    subjectWallet: string;
    credentialType: string;
    expiresAt?: string;
  }): CredentialCreateIntent {
    return buildCredentialCreateIntent({
      subjectWallet: input.subjectWallet,
      issuerWallet: this.options.topology.kycIssuer,
      credentialType: input.credentialType,
      ...(input.expiresAt ? { expiresAt: input.expiresAt } : {})
    });
  }

  previewOracleSet(input: {
    symbol: string;
    value: number;
    scale?: number;
    source: string;
  }): OracleSetIntent {
    return buildOracleSetIntent({
      publisherWallet: this.options.topology.oraclePublisher,
      symbol: input.symbol,
      value: input.value,
      source: input.source,
      ...(typeof input.scale === "number" ? { scale: input.scale } : {})
    });
  }

  async submitBondDeposit(input: {
    sourceWalletAddress: string;
    sourceWalletSeed?: string;
    amount: number;
    credentialLedgerIds: string[];
    issuer?: string;
  }): Promise<BondDepositSubmission> {
    if (input.credentialLedgerIds.length === 0) {
      throw new ValidationError("Bond deposits on XRPL require accepted credential ledger IDs.");
    }

    const wallet = this.getWalletFromSeed(input.sourceWalletSeed, "source wallet");
    const sourceWalletAddress = this.assertWalletAddress(wallet, input.sourceWalletAddress, "source wallet");
    const intent = this.previewBondDeposit({
      amount: input.amount,
      credentialIds: input.credentialLedgerIds,
      ...(input.issuer ? { issuer: input.issuer } : {})
    });

    await this.ensureConnected();

    const authorization = await this.client.request({
      command: "deposit_authorized",
      ledger_index: "validated",
      source_account: sourceWalletAddress,
      destination_account: intent.destination,
      credentials: input.credentialLedgerIds
    });

    if (!authorization.result.deposit_authorized) {
      throw new AuthorizationError("Bond deposit is not authorized on validated ledger for the provided credentials.");
    }

    const payment: Payment = {
      TransactionType: "Payment",
      Account: sourceWalletAddress,
      Destination: intent.destination,
      Amount: {
        currency: intent.amount.currency,
        issuer: intent.amount.issuer ?? this.options.topology.coldIssuer,
        value: intent.amount.value
      },
      CredentialIDs: input.credentialLedgerIds
    };

    const receipt = await this.submitWithRetry(payment, wallet);

    return {
      intent,
      receipt
    };
  }

  async submitBondEscrowCreate(input: {
    sourceWalletAddress: string;
    sourceWalletSeed?: string;
    destinationAddress: string;
    amount: string;
    finishAfter: string;
    condition?: string;
    credentialIds: string[];
  }): Promise<BondEscrowCreateSubmission> {
    const wallet = this.getWalletFromSeed(input.sourceWalletSeed, "source wallet");
    const sourceWalletAddress = this.assertWalletAddress(wallet, input.sourceWalletAddress, "source wallet");
    const intent = buildBondEscrowCreateIntent({
      source: sourceWalletAddress,
      destination: input.destinationAddress,
      amount: input.amount,
      finishAfter: input.finishAfter,
      ...(input.condition ? { condition: input.condition } : {}),
      credentialIds: input.credentialIds
    });

    await this.ensureConnected();

    // XRPL EscrowCreate — Amount em drops (XRP) ou IOU string
    const transaction: EscrowCreate = {
      TransactionType: "EscrowCreate",
      Account: sourceWalletAddress,
      Destination: input.destinationAddress,
      Amount: {
        currency: "VEX",
        issuer: this.options.topology.coldIssuer,
        value: input.amount
      },
      FinishAfter: toRippleEpoch(input.finishAfter),
      ...(input.condition ? { Condition: input.condition } : {})
    };

    const receipt = await this.submitWithRetry(transaction, wallet);

    // Recupera o escrowSequence da transação — necessário pra EscrowFinish/Cancel
    const escrowSequence = typeof receipt.ledgerIndex === "number"
      ? await this.resolveEscrowSequence(sourceWalletAddress, input.destinationAddress)
      : undefined;

    return {
      intent,
      receipt,
      ...(typeof escrowSequence === "number" ? { escrowSequence } : {})
    };
  }

  async submitBondEscrowFinish(input: {
    sourceWalletAddress: string;
    sourceWalletSeed?: string;
    owner: string;
    offerSequence: number;
    condition?: string;
    fulfillment?: string;
  }): Promise<BondEscrowFinishSubmission> {
    const wallet = this.getWalletFromSeed(input.sourceWalletSeed, "source wallet");
    const sourceWalletAddress = this.assertWalletAddress(wallet, input.sourceWalletAddress, "source wallet");
    const intent = buildBondEscrowFinishIntent({
      owner: input.owner,
      offerSequence: input.offerSequence,
      ...(input.condition ? { condition: input.condition } : {}),
      ...(input.fulfillment ? { fulfillment: input.fulfillment } : {})
    });

    await this.ensureConnected();

    const transaction: EscrowFinish = {
      TransactionType: "EscrowFinish",
      Account: sourceWalletAddress,
      Owner: input.owner,
      OfferSequence: input.offerSequence,
      ...(input.condition ? { Condition: input.condition } : {}),
      ...(input.fulfillment ? { Fulfillment: input.fulfillment } : {})
    };

    const receipt = await this.submitWithRetry(transaction, wallet);

    return {
      intent,
      receipt
    };
  }

  async submitBondEscrowCancel(input: {
    sourceWalletAddress: string;
    sourceWalletSeed?: string;
    owner: string;
    offerSequence: number;
  }): Promise<BondEscrowCancelSubmission> {
    const wallet = this.getWalletFromSeed(input.sourceWalletSeed, "source wallet");
    const sourceWalletAddress = this.assertWalletAddress(wallet, input.sourceWalletAddress, "source wallet");
    const intent = buildBondEscrowCancelIntent({
      owner: input.owner,
      offerSequence: input.offerSequence
    });

    await this.ensureConnected();

    const transaction: EscrowCancel = {
      TransactionType: "EscrowCancel",
      Account: sourceWalletAddress,
      Owner: input.owner,
      OfferSequence: input.offerSequence
    };

    const receipt = await this.submitWithRetry(transaction, wallet);

    return {
      intent,
      receipt
    };
  }

  // --- Redeem Escrow: trava IOU da série via EscrowCreate até FinishAfter ---

  async submitRedeemEscrowCreate(input: {
    sourceWalletAddress: string;
    sourceWalletSeed?: string;
    destinationAddress: string;
    amount: string;
    finishAfter: string;
    deliver: { currency: string; issuer: string; value: string };
  }): Promise<RedeemEscrowCreateSubmission> {
    const wallet = this.getWalletFromSeed(input.sourceWalletSeed, "source wallet");
    const sourceWalletAddress = this.assertWalletAddress(wallet, input.sourceWalletAddress, "source wallet");
    const intent = buildRedeemEscrowCreateIntent({
      source: sourceWalletAddress,
      destination: input.destinationAddress,
      amount: input.amount,
      finishAfter: input.finishAfter,
      deliver: input.deliver
    });

    await this.ensureConnected();

    // EscrowCreate para redeem — Amount é o IOU da série, FinishAfter é o deadline da janela de resposta
    const transaction: EscrowCreate = {
      TransactionType: "EscrowCreate",
      Account: sourceWalletAddress,
      Destination: input.destinationAddress,
      Amount: {
        currency: input.deliver.currency,
        issuer: input.deliver.issuer,
        value: input.amount
      },
      FinishAfter: toRippleEpoch(input.finishAfter)
    };

    const receipt = await this.submitWithRetry(transaction, wallet);

    // Recupera o escrowSequence — necessário pra EscrowFinish/Cancel posterior
    const escrowSequence = typeof receipt.ledgerIndex === "number"
      ? await this.resolveEscrowSequence(sourceWalletAddress, input.destinationAddress)
      : undefined;

    return {
      intent,
      receipt,
      ...(typeof escrowSequence === "number" ? { escrowSequence } : {})
    };
  }

  async submitRedeemEscrowFinish(input: {
    sourceWalletAddress: string;
    sourceWalletSeed?: string;
    owner: string;
    offerSequence: number;
  }): Promise<RedeemEscrowFinishSubmission> {
    const wallet = this.getWalletFromSeed(input.sourceWalletSeed, "source wallet");
    const sourceWalletAddress = this.assertWalletAddress(wallet, input.sourceWalletAddress, "source wallet");
    const intent = buildRedeemEscrowFinishIntent({
      owner: input.owner,
      offerSequence: input.offerSequence
    });

    await this.ensureConnected();

    const transaction: EscrowFinish = {
      TransactionType: "EscrowFinish",
      Account: sourceWalletAddress,
      Owner: input.owner,
      OfferSequence: input.offerSequence
    };

    const receipt = await this.submitWithRetry(transaction, wallet);

    return {
      intent,
      receipt
    };
  }

  async submitRedeemEscrowCancel(input: {
    sourceWalletAddress: string;
    sourceWalletSeed?: string;
    owner: string;
    offerSequence: number;
  }): Promise<RedeemEscrowCancelSubmission> {
    const wallet = this.getWalletFromSeed(input.sourceWalletSeed, "source wallet");
    const sourceWalletAddress = this.assertWalletAddress(wallet, input.sourceWalletAddress, "source wallet");
    const intent = buildRedeemEscrowCancelIntent({
      owner: input.owner,
      offerSequence: input.offerSequence
    });

    await this.ensureConnected();

    const transaction: EscrowCancel = {
      TransactionType: "EscrowCancel",
      Account: sourceWalletAddress,
      Owner: input.owner,
      OfferSequence: input.offerSequence
    };

    const receipt = await this.submitWithRetry(transaction, wallet);

    return {
      intent,
      receipt
    };
  }

  async submitCredentialCreate(input: {
    subjectWallet: string;
    credentialType: string;
    expiresAt?: string;
  }): Promise<CredentialCreateSubmission> {
    const wallet = this.getWalletFromSeed(this.options.kycIssuerSeed, "XRPL_KYC_ISSUER_SEED");
    const issuerWallet = this.assertWalletAddress(wallet, this.options.topology.kycIssuer, "kyc issuer");
    const intent = this.previewCredentialCreate(input);
    const credentialType = encodeCredentialType(input.credentialType);

    const transaction: CredentialCreate = {
      TransactionType: "CredentialCreate",
      Account: issuerWallet,
      Subject: input.subjectWallet,
      CredentialType: credentialType,
      ...(input.expiresAt ? { Expiration: isoTimeToRippleTime(input.expiresAt) } : {})
    };

    const receipt = await this.submitWithRetry(transaction, wallet, ["tesSUCCESS", "tecDUPLICATE"]);
    const credentialLedgerIndex = await this.resolveCredentialLedgerIndex({
      subjectWallet: input.subjectWallet,
      issuerWallet,
      credentialType
    });

    return {
      intent,
      receipt,
      ...(credentialLedgerIndex ? { credentialLedgerIndex } : {})
    };
  }

  async submitCredentialAccept(input: {
    subjectWalletAddress: string;
    subjectWalletSeed?: string;
    issuerWallet: string;
    credentialType: string;
  }): Promise<CredentialAcceptSubmission> {
    const wallet = this.getWalletFromSeed(input.subjectWalletSeed, "subject wallet");
    const subjectWalletAddress = this.assertWalletAddress(wallet, input.subjectWalletAddress, "subject wallet");
    const credentialType = encodeCredentialType(input.credentialType);

    const transaction: CredentialAccept = {
      TransactionType: "CredentialAccept",
      Account: subjectWalletAddress,
      Issuer: input.issuerWallet,
      CredentialType: credentialType
    };

    const receipt = await this.submitWithRetry(transaction, wallet, ["tesSUCCESS", "tecDUPLICATE"]);
    const credentialLedgerIndex = await this.resolveCredentialLedgerIndex({
      subjectWallet: subjectWalletAddress,
      issuerWallet: input.issuerWallet,
      credentialType
    });

    return {
      receipt,
      ...(credentialLedgerIndex ? { credentialLedgerIndex } : {})
    };
  }

  async submitOracleSet(input: {
    symbol: string;
    value: number;
    scale?: number;
    source: string;
  }): Promise<OracleSetSubmission> {
    const wallet = this.getWalletFromSeed(
      this.options.oraclePublisherSeed,
      "XRPL_ORACLE_PUBLISHER_SEED"
    );
    const publisherWallet = this.assertWalletAddress(
      wallet,
      this.options.topology.oraclePublisher,
      "oracle publisher"
    );
    const intent = this.previewOracleSet(input);
    const oracleDocumentId = deriveOracleDocumentId(input.symbol);

    const transaction: OracleSet = {
      TransactionType: "OracleSet",
      Account: publisherWallet,
      OracleDocumentID: oracleDocumentId,
      LastUpdateTime: Math.floor(Date.now() / 1000),
      Provider: encodeBlob(input.source),
      AssetClass: encodeBlob("commodity"),
      PriceDataSeries: [
        toOraclePriceData({
          symbol: input.symbol,
          value: input.value,
          ...(typeof input.scale === "number" ? { scale: input.scale } : {})
        })
      ]
    };

    const receipt = await this.submitWithRetry(transaction, wallet);

    return {
      intent,
      receipt,
      oracleDocumentId
    };
  }

  async submitSeriesOffer(input: {
    sellerWalletAddress: string;
    sellerWalletSeed?: string;
    seriesCurrencyHex: string;
    seriesIssuer?: string;
    quantity: number;
    unitPrice: number;
    expiresAt?: string;
  }): Promise<SeriesOfferSubmission> {
    const sellerWallet = this.getWalletForAddress(
      input.sellerWalletAddress,
      input.sellerWalletSeed,
      "seller wallet"
    );
    const sellerWalletAddress = this.assertWalletAddress(sellerWallet, input.sellerWalletAddress, "seller wallet");
    const coldIssuerWallet = this.getWalletFromSeed(
      this.options.coldIssuerSeed,
      "XRPL_COLD_ISSUER_SEED"
    );
    const coldIssuerAddress = this.assertWalletAddress(
      coldIssuerWallet,
      input.seriesIssuer ?? this.options.topology.coldIssuer,
      "cold issuer"
    );
    const sellValue = formatIssuedCurrencyValue(input.quantity);
    const receiveValue = formatIssuedCurrencyValue(Number((input.quantity * input.unitPrice).toFixed(2)), 2);
    const intent = this.buildSeriesOfferIntent({
        sellerWallet: sellerWalletAddress,
        seriesCurrencyHex: input.seriesCurrencyHex,
        seriesIssuer: coldIssuerAddress,
        quantityValue: sellValue,
        notionalValue: receiveValue,
        ...(input.expiresAt ? { expiresAt: input.expiresAt } : {})
    });

    await this.ensureConnected();

    await this.ensureTrustLine({
      accountWallet: sellerWallet,
      accountAddress: sellerWalletAddress,
      issuer: coldIssuerAddress,
      currency: input.seriesCurrencyHex,
      limitValue: buildTrustLineLimit(sellValue)
    });
    await this.ensureTrustLine({
      accountWallet: sellerWallet,
      accountAddress: sellerWalletAddress,
      issuer: coldIssuerAddress,
      currency: "VEX",
      limitValue: buildTrustLineLimit(receiveValue)
    });

    const inventoryReceipt = await this.submitWithRetry(
      {
        TransactionType: "Payment",
        Account: coldIssuerAddress,
        Destination: sellerWalletAddress,
        Amount: {
          currency: input.seriesCurrencyHex,
          issuer: coldIssuerAddress,
          value: sellValue
        }
      },
      coldIssuerWallet
    );
    const existingOfferSequences = new Set(await this.listAccountOfferSequences(sellerWalletAddress));
    const receipt = await this.submitWithRetry(
      {
        TransactionType: "OfferCreate",
        Account: sellerWalletAddress,
        TakerGets: {
          currency: intent.sell.currency,
          issuer: intent.sell.issuer,
          value: intent.sell.value
        },
        TakerPays: {
          currency: intent.receive.currency,
          issuer: intent.receive.issuer,
          value: intent.receive.value
        },
        ...(intent.expiresAt ? { Expiration: isoTimeToRippleTime(intent.expiresAt) } : {})
      },
      sellerWallet
    );
    const offerSequence = await this.resolveCreatedOfferSequence({
      account: sellerWalletAddress,
      existingOfferSequences,
      sell: intent.sell,
      receive: intent.receive
    });

    return {
      intent,
      inventoryReceipt,
      receipt,
      ...(typeof offerSequence === "number" ? { offerSequence } : {})
    };
  }

  async submitSeriesBuy(input: {
    buyerWalletAddress: string;
    buyerWalletSeed?: string;
    seriesCurrencyHex: string;
    seriesIssuer?: string;
    quantity: number;
    unitPrice: number;
  }): Promise<SeriesBuySubmission> {
    const buyerWallet = this.getWalletForAddress(
      input.buyerWalletAddress,
      input.buyerWalletSeed,
      "buyer wallet"
    );
    const buyerWalletAddress = this.assertWalletAddress(buyerWallet, input.buyerWalletAddress, "buyer wallet");
    const seriesIssuer = input.seriesIssuer ?? this.options.topology.coldIssuer;
    const receiveValue = formatIssuedCurrencyValue(input.quantity);
    const payValue = formatIssuedCurrencyValue(Number((input.quantity * input.unitPrice).toFixed(2)), 2);
    const intent = buildSeriesBuyIntent({
      buyerWallet: buyerWalletAddress,
      receive: {
        currency: input.seriesCurrencyHex,
        issuer: seriesIssuer,
        value: receiveValue
      },
      pay: {
        currency: "VEX",
        issuer: this.options.topology.coldIssuer,
        value: payValue
      }
    });

    await this.ensureConnected();

    await this.ensureTrustLine({
      accountWallet: buyerWallet,
      accountAddress: buyerWalletAddress,
      issuer: seriesIssuer,
      currency: input.seriesCurrencyHex,
      limitValue: buildTrustLineLimit(receiveValue)
    });
    await this.ensureTrustLine({
      accountWallet: buyerWallet,
      accountAddress: buyerWalletAddress,
      issuer: this.options.topology.coldIssuer,
      currency: "VEX",
      limitValue: buildTrustLineLimit(payValue)
    });

    const receipt = await this.submitWithRetry(
      {
        TransactionType: "OfferCreate",
        Account: buyerWalletAddress,
        TakerGets: {
          currency: intent.pay.currency,
          issuer: intent.pay.issuer,
          value: intent.pay.value
        },
        TakerPays: {
          currency: intent.receive.currency,
          issuer: intent.receive.issuer,
          value: intent.receive.value
        }
      },
      buyerWallet
    );

    let filledQuantity: number | undefined;
    const requestedQuantity = input.quantity;

    try {
      const deliveredAmount = (receipt as unknown as Record<string, unknown>).delivered_amount;

      if (typeof deliveredAmount === "string") {
        filledQuantity = Number(deliveredAmount) / 1_000_000;
      } else if (
        typeof deliveredAmount === "object" &&
        deliveredAmount !== null &&
        typeof (deliveredAmount as IssuedAmountLike).value === "string"
      ) {
        filledQuantity = Number((deliveredAmount as IssuedAmountLike).value);
      }
    } catch {
      // delivered_amount not available; filledQuantity remains undefined
    }

    return {
      intent,
      receipt,
      ...(typeof filledQuantity === "number" ? { filledQuantity } : {}),
      requestedQuantity
    };
  }

  async submitProofNftMint(input: {
    ownerWalletAddress: string;
    ownerWalletSeed?: string;
    uri: string;
    taxon: number;
  }): Promise<ProofNftMintSubmission> {
    const ownerWallet = this.getWalletForAddress(
      input.ownerWalletAddress,
      input.ownerWalletSeed,
      "proof owner wallet"
    );
    const ownerWalletAddress = this.assertWalletAddress(
      ownerWallet,
      input.ownerWalletAddress,
      "proof owner wallet"
    );
    const intent = this.buildProofNftIntent({
      ownerWallet: ownerWalletAddress,
      uri: input.uri,
      taxon: input.taxon
    });

    await this.ensureConnected();

    const response = await this.client.submitAndWait(
      {
        TransactionType: "NFTokenMint",
        Account: ownerWalletAddress,
        NFTokenTaxon: input.taxon,
        URI: convertStringToHex(input.uri).toUpperCase()
      },
      {
        wallet: ownerWallet
      }
    );
    const meta =
      typeof response.result.meta === "object" && response.result.meta !== null
        ? (response.result.meta as TransactionMetadata<NFTokenMint>)
        : undefined;
    const transactionResult = meta?.TransactionResult;

    if (transactionResult !== "tesSUCCESS") {
      throw new XrplSubmissionError(transactionResult);
    }

    const success = assertTesSuccess({
      result: {
        ...(typeof response.result.hash === "string" ? { hash: response.result.hash } : {}),
        ...(typeof response.result.ledger_index === "number"
          ? { validated_ledger_index: response.result.ledger_index }
          : {}),
        meta: { TransactionResult: transactionResult }
      }
    });
    const nftTokenId =
      (meta ? getNFTokenID(meta) : undefined) ??
      (await this.resolveLatestAccountNft({
        account: ownerWalletAddress,
        uri: input.uri,
        taxon: input.taxon
      }));

    return {
      intent,
      receipt: {
        mode: "real",
        submitted: true,
        account: ownerWalletAddress,
        transactionType: "NFTokenMint",
        ...(success.hash ? { hash: success.hash } : {}),
        ...(typeof success.ledgerIndex === "number" ? { ledgerIndex: success.ledgerIndex } : {}),
      transactionResult: success.transactionResult
      },
      ...(nftTokenId ? { nftTokenId } : {})
    };
  }

  async submitSeriesRedeem(input: {
    holderWalletAddress: string;
    holderWalletSeed?: string;
    destinationWalletAddress: string;
    destinationWalletSeed?: string;
    seriesCurrencyHex: string;
    seriesIssuer?: string;
    quantity: number;
  }): Promise<SeriesRedeemSubmission> {
    const holderWallet = this.getWalletForAddress(
      input.holderWalletAddress,
      input.holderWalletSeed,
      "redeem holder wallet"
    );
    const holderWalletAddress = this.assertWalletAddress(
      holderWallet,
      input.holderWalletAddress,
      "redeem holder wallet"
    );
    const destinationWallet = this.getWalletFromSeed(
      input.destinationWalletSeed ?? this.options.settlementWalletSeed,
      "XRPL_SETTLEMENT_WALLET_SEED"
    );
    const destinationWalletAddress = this.assertWalletAddress(
      destinationWallet,
      input.destinationWalletAddress,
      "settlement wallet"
    );
    const seriesIssuer = input.seriesIssuer ?? this.options.topology.coldIssuer;
    const deliverValue = formatIssuedCurrencyValue(input.quantity);
    const intent = buildSeriesRedeemIntent({
      holderWallet: holderWalletAddress,
      destinationWallet: destinationWalletAddress,
      deliver: {
        currency: input.seriesCurrencyHex,
        issuer: seriesIssuer,
        value: deliverValue
      }
    });

    await this.ensureConnected();
    await this.ensureTrustLine({
      accountWallet: destinationWallet,
      accountAddress: destinationWalletAddress,
      issuer: seriesIssuer,
      currency: input.seriesCurrencyHex,
      limitValue: buildTrustLineLimit(deliverValue)
    });

    const receipt = await this.submitWithRetry(
      {
        TransactionType: "Payment",
        Account: holderWalletAddress,
        Destination: destinationWalletAddress,
        Amount: {
          currency: intent.deliver.currency,
          issuer: intent.deliver.issuer,
          value: intent.deliver.value
        }
      },
      holderWallet
    );

    return {
      intent,
      receipt
    };
  }

  async submitAmmCreate(input: {
    creatorWalletAddress: string;
    creatorWalletSeed?: string;
    amount1: { currency: string; issuer: string; value: string };
    amount2: { currency: string; issuer: string; value: string };
    tradingFee: number;
  }): Promise<AmmCreateSubmission> {
    const wallet = this.getWalletForAddress(
      input.creatorWalletAddress,
      input.creatorWalletSeed,
      "amm creator wallet"
    );
    const creatorAddress = this.assertWalletAddress(wallet, input.creatorWalletAddress, "amm creator wallet");
    const intent = buildAmmCreateIntent({
      creatorWallet: creatorAddress,
      amount1: input.amount1,
      amount2: input.amount2,
      tradingFee: input.tradingFee
    });

    await this.ensureConnected();

    const transaction: AMMCreate = {
      TransactionType: "AMMCreate",
      Account: creatorAddress,
      Amount: {
        currency: input.amount1.currency,
        issuer: input.amount1.issuer,
        value: input.amount1.value
      },
      Amount2: {
        currency: input.amount2.currency,
        issuer: input.amount2.issuer,
        value: input.amount2.value
      },
      TradingFee: input.tradingFee
    };

    const receipt = await this.submitWithRetry(transaction, wallet);

    // Resolver ammAccountId via amm_info após criação
    let ammAccountId: string | undefined;
    try {
      const ammInfo = await this.getAmmInfo({
        asset1: { currency: input.amount1.currency, issuer: input.amount1.issuer },
        asset2: { currency: input.amount2.currency, issuer: input.amount2.issuer }
      });
      ammAccountId = ammInfo.ammAccountId;
    } catch {
      // amm_info pode falhar se o ledger ainda não validou
    }

    return {
      intent,
      receipt,
      ...(ammAccountId ? { ammAccountId } : {})
    };
  }

  async submitAmmDeposit(input: {
    depositorWalletAddress: string;
    depositorWalletSeed?: string;
    asset1: { currency: string; issuer: string };
    asset2: { currency: string; issuer: string };
    amount?: { currency: string; issuer: string; value: string };
    amount2?: { currency: string; issuer: string; value: string };
    lpTokenOut?: { currency: string; issuer: string; value: string };
  }): Promise<AmmDepositSubmission> {
    const wallet = this.getWalletForAddress(
      input.depositorWalletAddress,
      input.depositorWalletSeed,
      "amm depositor wallet"
    );
    const depositorAddress = this.assertWalletAddress(wallet, input.depositorWalletAddress, "amm depositor wallet");
    const intent = buildAmmDepositIntent({
      depositorWallet: depositorAddress,
      asset1: input.asset1,
      asset2: input.asset2,
      ...(input.amount ? { amount: input.amount } : {}),
      ...(input.amount2 ? { amount2: input.amount2 } : {}),
      ...(input.lpTokenOut ? { lpTokenOut: input.lpTokenOut } : {})
    });

    await this.ensureConnected();

    // Depósito proporcional com dois amounts usa TwoAsset flag
    const hasTwoAmounts = input.amount && input.amount2;
    const transaction: AMMDeposit = {
      TransactionType: "AMMDeposit",
      Account: depositorAddress,
      Asset: { currency: input.asset1.currency, issuer: input.asset1.issuer },
      Asset2: { currency: input.asset2.currency, issuer: input.asset2.issuer },
      ...(input.amount ? {
        Amount: { currency: input.amount.currency, issuer: input.amount.issuer, value: input.amount.value }
      } : {}),
      ...(input.amount2 ? {
        Amount2: { currency: input.amount2.currency, issuer: input.amount2.issuer, value: input.amount2.value }
      } : {}),
      ...(input.lpTokenOut ? {
        LPTokenOut: { currency: input.lpTokenOut.currency, issuer: input.lpTokenOut.issuer, value: input.lpTokenOut.value }
      } : {}),
      Flags: hasTwoAmounts ? AMMDepositFlags.tfTwoAsset : AMMDepositFlags.tfSingleAsset
    };

    const receipt = await this.submitWithRetry(transaction, wallet);

    return { intent, receipt };
  }

  async submitAmmWithdraw(input: {
    withdrawerWalletAddress: string;
    withdrawerWalletSeed?: string;
    asset1: { currency: string; issuer: string };
    asset2: { currency: string; issuer: string };
    lpTokenIn?: { currency: string; issuer: string; value: string };
    amount?: { currency: string; issuer: string; value: string };
  }): Promise<AmmWithdrawSubmission> {
    const wallet = this.getWalletForAddress(
      input.withdrawerWalletAddress,
      input.withdrawerWalletSeed,
      "amm withdrawer wallet"
    );
    const withdrawerAddress = this.assertWalletAddress(wallet, input.withdrawerWalletAddress, "amm withdrawer wallet");
    const intent = buildAmmWithdrawIntent({
      withdrawerWallet: withdrawerAddress,
      asset1: input.asset1,
      asset2: input.asset2,
      ...(input.lpTokenIn ? { lpTokenIn: input.lpTokenIn } : {}),
      ...(input.amount ? { amount: input.amount } : {})
    });

    await this.ensureConnected();

    const transaction: AMMWithdraw = {
      TransactionType: "AMMWithdraw",
      Account: withdrawerAddress,
      Asset: { currency: input.asset1.currency, issuer: input.asset1.issuer },
      Asset2: { currency: input.asset2.currency, issuer: input.asset2.issuer },
      ...(input.lpTokenIn ? {
        LPTokenIn: { currency: input.lpTokenIn.currency, issuer: input.lpTokenIn.issuer, value: input.lpTokenIn.value }
      } : {}),
      ...(input.amount ? {
        Amount: { currency: input.amount.currency, issuer: input.amount.issuer, value: input.amount.value }
      } : {}),
      Flags: input.lpTokenIn ? AMMWithdrawFlags.tfLPToken : AMMWithdrawFlags.tfSingleAsset
    };

    const receipt = await this.submitWithRetry(transaction, wallet);

    return { intent, receipt };
  }

  async getAmmInfo(input: {
    asset1: { currency: string; issuer: string };
    asset2: { currency: string; issuer: string };
  }): Promise<AmmInfoResult> {
    await this.ensureConnected();

    const response = await this.client.request({
      command: "amm_info",
      asset: { currency: input.asset1.currency, issuer: input.asset1.issuer },
      asset2: { currency: input.asset2.currency, issuer: input.asset2.issuer }
    } as any);

    const result = (response.result as any).amm;
    if (!result) {
      throw new NotFoundError("AMM pool for the given asset pair");
    }

    return {
      ammAccountId: result.account,
      amount1: {
        currency: result.amount?.currency ?? input.asset1.currency,
        issuer: result.amount?.issuer ?? input.asset1.issuer,
        value: typeof result.amount === "string" ? result.amount : result.amount?.value ?? "0"
      },
      amount2: {
        currency: result.amount2?.currency ?? input.asset2.currency,
        issuer: result.amount2?.issuer ?? input.asset2.issuer,
        value: typeof result.amount2 === "string" ? result.amount2 : result.amount2?.value ?? "0"
      },
      lpToken: {
        currency: result.lp_token?.currency ?? "",
        issuer: result.lp_token?.issuer ?? "",
        value: result.lp_token?.value ?? "0"
      },
      tradingFee: result.trading_fee ?? 0,
      ...(result.ledger_hash ? { ledgerHash: result.ledger_hash } : {})
    };
  }

  async getAggregatePrice(input: {
    baseAsset: string;
    quoteAsset: string;
    oracles: Array<{ account: string; oracleDocumentId: number }>;
    trim?: number;
  }): Promise<OracleAggregateResult> {
    try {
      await this.ensureConnected();

      const response = await this.client.request({
        command: "get_aggregate_price",
        base_asset: input.baseAsset,
        quote_asset: input.quoteAsset,
        oracles: input.oracles.map((o) => ({
          account: o.account,
          oracle_document_id: o.oracleDocumentId
        })),
        ...(typeof input.trim === "number" ? { trim: input.trim } : {})
      } as any);

      const result = response.result as any;

      return {
        median: Number(result.median),
        ...(result.mean !== undefined ? { mean: Number(result.mean) } : {}),
        entireSet: (result.entire_set ?? []).map((entry: any) => ({
          oracleId: entry.account ?? entry.oracle_id ?? "",
          price: Number(entry.price)
        })),
        ...(result.trimmed_set
          ? {
              trimmedSet: result.trimmed_set.map((entry: any) => ({
                oracleId: entry.account ?? entry.oracle_id ?? "",
                price: Number(entry.price)
              }))
            }
          : {}),
        time: Number(result.time)
      };
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("oracleNotFound") ||
          error.message.includes("objectNotFound") ||
          error.message.includes("entryNotFound"))
      ) {
        throw new NotFoundError("Oracle aggregate price");
      }

      throw error;
    }
  }

  private async ensureConnected(): Promise<void> {
    if (!this.client.isConnected()) {
      await this.client.connect();
    }
  }

  private buildSeriesOfferIntent(input: {
    sellerWallet: string;
    seriesCurrencyHex: string;
    seriesIssuer: string;
    quantityValue: string;
    notionalValue: string;
    expiresAt?: string;
  }): SeriesOfferIntent {
    return buildSeriesOfferIntent({
      sellerWallet: input.sellerWallet,
      sell: {
        currency: input.seriesCurrencyHex,
        issuer: input.seriesIssuer,
        value: input.quantityValue
      },
      receive: {
        currency: "VEX",
        issuer: this.options.topology.coldIssuer,
        value: input.notionalValue
      },
      ...(input.expiresAt ? { expiresAt: input.expiresAt } : {})
    });
  }

  private buildProofNftIntent(input: {
    ownerWallet: string;
    uri: string;
    taxon: number;
  }): ProofNftIntent {
    return buildProofNftIntent({
      ownerWallet: input.ownerWallet,
      uri: input.uri,
      taxon: input.taxon
    });
  }

  private getWalletFromSeed(seed: string | undefined, label: string): Wallet {
    if (!seed) {
      throw new ValidationError(`${label} seed is required when XRPL_MODE=real.`);
    }

    return Wallet.fromSeed(seed);
  }

  private getWalletForAddress(address: string, explicitSeed: string | undefined, label: string): Wallet {
    const fallbackSeed =
      this.options.testUserWallet === address
        ? this.options.testUserWalletSeed
        : this.options.testBuyerWallet === address
          ? this.options.testBuyerWalletSeed
          : undefined;
    return this.getWalletFromSeed(explicitSeed ?? fallbackSeed, label);
  }

  private assertWalletAddress(wallet: Wallet, expectedAddress: string, label: string): string {
    if (wallet.classicAddress !== expectedAddress) {
      throw new ValidationError(
        `Configured ${label} address ${expectedAddress} does not match the provided seed address ${wallet.classicAddress}.`
      );
    }

    return wallet.classicAddress;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async submitWithRetry(
    transaction: SupportedSubmissionTransaction,
    wallet: Wallet,
    acceptedResults: string[] = ["tesSUCCESS"]
  ): Promise<XrplSubmissionReceipt> {
    if (this.circuitState === "open") {
      const elapsed = Date.now() - this.lastFailureAt;

      if (elapsed < RealXrplGateway.RECOVERY_TIMEOUT_MS) {
        throw new XrplSubmissionError("XRPL circuit breaker is open — submissions are temporarily suspended.");
      }

      this.circuitState = "half_open";
    }

    const maxRetries = 3;
    let lastError: unknown;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await this.ensureConnected();
        const response = await this.client.submitAndWait(transaction, {
          wallet
        });
        const meta =
          typeof response.result.meta === "object" && response.result.meta !== null
            ? (response.result.meta as TransactionMetadata<SupportedSubmissionTransaction>)
            : undefined;
        const transactionResult = meta?.TransactionResult;

        if (!transactionResult) {
          throw new XrplSubmissionError(transactionResult);
        }

        const category = classifyTransactionResult(transactionResult);

        if (category === "retryable" && !acceptedResults.includes(transactionResult)) {
          if (attempt < maxRetries - 1) {
            await this.delay(1000 * 2 ** attempt);
            continue;
          }

          this.recordFailure();
          throw new XrplSubmissionError(transactionResult);
        }

        if (category === "terminal" && !acceptedResults.includes(transactionResult)) {
          this.recordFailure();
          throw new XrplSubmissionError(transactionResult);
        }

        this.consecutiveFailures = 0;
        this.circuitState = "closed";

        const success =
          transactionResult === "tesSUCCESS"
            ? assertTesSuccess({
                result: {
                  ...(typeof response.result.hash === "string" ? { hash: response.result.hash } : {}),
                  ...(typeof response.result.ledger_index === "number"
                    ? { validated_ledger_index: response.result.ledger_index }
                    : {}),
                  meta: { TransactionResult: transactionResult }
                }
              })
            : {
                ...(typeof response.result.hash === "string" ? { hash: response.result.hash } : {}),
                ...(typeof response.result.ledger_index === "number"
                  ? { ledgerIndex: response.result.ledger_index }
                  : {}),
                transactionResult
              };

        return {
          mode: "real",
          submitted: true,
          account: wallet.classicAddress,
          transactionType: transaction.TransactionType,
          ...(success.hash ? { hash: success.hash } : {}),
          ...(typeof success.ledgerIndex === "number" ? { ledgerIndex: success.ledgerIndex } : {}),
          transactionResult: success.transactionResult
        };
      } catch (error) {
        lastError = error;

        if (error instanceof XrplSubmissionError) {
          throw error;
        }

        if (this.client.isConnected()) {
          await this.client.disconnect();
        }

        if (attempt < maxRetries - 1) {
          await this.delay(1000 * 2 ** attempt);
          continue;
        }
      }
    }

    this.recordFailure();
    throw lastError instanceof Error
      ? lastError
      : new XrplSubmissionError("XRPL submission failed after retries.");
  }

  private recordFailure(): void {
    this.consecutiveFailures++;
    this.lastFailureAt = Date.now();

    if (this.consecutiveFailures >= RealXrplGateway.FAILURE_THRESHOLD) {
      this.circuitState = "open";
    }
  }

  private async ensureTrustLine(input: {
    accountWallet: Wallet;
    accountAddress: string;
    issuer: string;
    currency: string;
    limitValue: string;
  }): Promise<void> {
    await this.submitWithRetry(
      {
        TransactionType: "TrustSet",
        Account: input.accountAddress,
        LimitAmount: {
          currency: input.currency,
          issuer: input.issuer,
          value: input.limitValue
        },
        Flags: {
          tfClearNoRipple: true
        }
      },
      input.accountWallet
    );
  }

  private async listAccountOfferSequences(account: string): Promise<number[]> {
    await this.ensureConnected();

    const response = await this.client.request({
      command: "account_offers",
      ledger_index: "validated",
      account,
      limit: 400
    });

    return (response.result.offers ?? []).map((offer) => offer.seq);
  }

  private async resolveCreatedOfferSequence(input: {
    account: string;
    existingOfferSequences: Set<number>;
    sell: SeriesOfferIntent["sell"];
    receive: SeriesOfferIntent["receive"];
  }): Promise<number | undefined> {
    await this.ensureConnected();

    const response = await this.client.request({
      command: "account_offers",
      ledger_index: "validated",
      account: input.account,
      limit: 400
    });
    const createdOffer = (response.result.offers ?? []).find((offer) => {
      if (input.existingOfferSequences.has(offer.seq)) {
        return false;
      }

      return (
        isIssuedAmountLike(offer.taker_pays) &&
        isIssuedAmountLike(offer.taker_gets) &&
        offer.taker_gets.currency === input.sell.currency &&
        offer.taker_gets.issuer === input.sell.issuer &&
        Number(offer.taker_gets.value) === Number(input.sell.value) &&
        offer.taker_pays.currency === input.receive.currency &&
        offer.taker_pays.issuer === input.receive.issuer &&
        Number(offer.taker_pays.value) === Number(input.receive.value)
      );
    });

    return createdOffer?.seq;
  }

  private async resolveLatestAccountNft(input: {
    account: string;
    uri: string;
    taxon: number;
  }): Promise<string | undefined> {
    await this.ensureConnected();

    const response = await this.client.request({
      command: "account_nfts",
      ledger_index: "validated",
      account: input.account,
      limit: 400
    });
    const encodedUri = convertStringToHex(input.uri).toUpperCase();
    const matched = response.result.account_nfts.find((nft) => {
      return nft.URI?.toUpperCase() === encodedUri && nft.NFTokenTaxon === input.taxon;
    });

    return matched?.NFTokenID;
  }

  private async resolveCredentialLedgerIndex(input: {
    subjectWallet: string;
    issuerWallet: string;
    credentialType: string;
  }): Promise<string | undefined> {
    await this.ensureConnected();

    const response = await this.client.request({
      command: "ledger_entry",
      ledger_index: "validated",
      credential: {
        subject: input.subjectWallet,
        issuer: input.issuerWallet,
        credential_type: input.credentialType
      }
    } as unknown as Parameters<Client["request"]>[0]);
    const result = response as {
      result?: {
        index?: string;
      };
    };

    return typeof result.result?.index === "string" ? result.result.index : undefined;
  }

  // Busca o Sequence do escrow mais recente entre source e destination
  private async resolveEscrowSequence(
    source: string,
    destination: string
  ): Promise<number | undefined> {
    try {
      await this.ensureConnected();

      const response = await this.client.request({
        command: "account_objects",
        account: source,
        type: "escrow",
        ledger_index: "validated",
        limit: 100
      } as unknown as Parameters<Client["request"]>[0]);

      const objects = (response.result as any).account_objects ?? [];
      // Pega o escrow mais recente com o destination correto
      const escrow = objects
        .filter((obj: any) => obj.LedgerEntryType === "Escrow" && obj.Destination === destination)
        .sort((a: any, b: any) => (b.Sequence ?? 0) - (a.Sequence ?? 0))[0];

      return escrow?.Sequence;
    } catch {
      return undefined;
    }
  }
}
