import { createOraclePricePoint, splitOracleSymbol, deriveOracleDocumentId, type OraclePricePoint } from "@valyria/domain";
import type { OracleSetIntent } from "@valyria/xrpl";
import type {
  OracleAggregateResult,
  OracleSetSubmission,
  XrplGateway
} from "../adapters/xrpl/xrpl-gateway";
import type { PlatformRepository } from "./platform-repository";

export class OracleService {
  constructor(
    private readonly repository: PlatformRepository,
    private readonly xrplGateway: XrplGateway
  ) {}

  async listPrices(symbol?: string): Promise<OraclePricePoint[]> {
    return this.repository.listOraclePrices(symbol);
  }

  previewOracleSet(input: {
    symbol: string;
    value: number;
    scale?: number;
    source: string;
  }): OracleSetIntent {
    return this.xrplGateway.previewOracleSet(input);
  }

  async publishPrice(input: {
    symbol: string;
    source: string;
    value: number;
    scale?: number;
  }): Promise<{
    price: OraclePricePoint;
    preview: OracleSetIntent;
    ledger: OracleSetSubmission["receipt"];
  }> {
    const ledgerSubmission = await this.xrplGateway.submitOracleSet(input);
    const preview = ledgerSubmission.intent;
    const price = createOraclePricePoint({
      id: crypto.randomUUID(),
      symbol: input.symbol,
      source: input.source,
      value: input.value,
      metadata: {
        scale: input.scale ?? 2,
        publisherWallet: this.xrplGateway.getAccountTopology().oraclePublisher,
        xrplMode: ledgerSubmission.receipt.mode,
        submitted: ledgerSubmission.receipt.submitted,
        oracleDocumentId: ledgerSubmission.oracleDocumentId,
        ...(ledgerSubmission.receipt.hash ? { hash: ledgerSubmission.receipt.hash } : {}),
        ...(typeof ledgerSubmission.receipt.ledgerIndex === "number"
          ? { ledgerIndex: ledgerSubmission.receipt.ledgerIndex }
          : {})
      }
    });

    const savedPrice = await this.repository.createOraclePrice(price);

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      action: "oracle.price.published",
      entityType: "oracle_price",
      entityId: savedPrice.id,
      payload: {
        symbol: savedPrice.symbol,
        source: savedPrice.source,
        value: savedPrice.value,
        xrplMode: ledgerSubmission.receipt.mode,
        submitted: ledgerSubmission.receipt.submitted,
        ...(ledgerSubmission.receipt.hash ? { hash: ledgerSubmission.receipt.hash } : {})
      },
      createdAt: new Date().toISOString()
    });

    return {
      price: savedPrice,
      preview,
      ledger: ledgerSubmission.receipt
    };
  }

  async getAggregatePrice(input: { symbol: string; trim?: number }): Promise<OracleAggregateResult> {
    const { base, quote } = splitOracleSymbol(input.symbol);
    const topology = this.xrplGateway.getAccountTopology();
    const oracleDocumentId = deriveOracleDocumentId(input.symbol);

    return this.xrplGateway.getAggregatePrice({
      baseAsset: base,
      quoteAsset: quote,
      oracles: [{ account: topology.oraclePublisher, oracleDocumentId }],
      ...(typeof input.trim === "number" ? { trim: input.trim } : {})
    });
  }
}
