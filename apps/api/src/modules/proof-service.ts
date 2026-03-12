import { createHash } from "node:crypto";
import { createProofArtifact, NotFoundError, ConflictError, ValidationError, type ProofArtifact, type ProofArtifactType } from "@valyria/domain";
import type { ProofFileStore } from "../adapters/storage/proof-file-store";
import type { XrplGateway } from "../adapters/xrpl/xrpl-gateway";
import type { PlatformRepository } from "./platform-repository";

function buildProofManifest(input: {
  userId?: string;
  offerId?: string;
  artifactType: ProofArtifactType;
  commodity: string;
  uri: string;
  ipfsCid?: string;
  metadata?: Record<string, string | number | boolean>;
}): Record<string, unknown> {
  const metadata = input.metadata
    ? Object.fromEntries(
        Object.entries(input.metadata).sort(([left], [right]) => left.localeCompare(right))
      )
    : undefined;

  return {
    version: 1,
    ...(input.userId ? { userId: input.userId } : {}),
    ...(input.offerId ? { offerId: input.offerId } : {}),
    artifactType: input.artifactType,
    commodity: input.commodity,
    uri: input.uri,
    ...(input.ipfsCid ? { ipfsCid: input.ipfsCid } : {}),
    ...(metadata ? { metadata } : {})
  };
}

function computeManifestHash(manifest: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(manifest)).digest("hex");
}

function deriveProofNftTaxon(input: {
  artifactType: ProofArtifactType;
  commodity: string;
  manifestHash?: string;
}): number {
  const hash = createHash("sha256")
    .update(`${input.artifactType}:${input.commodity}:${input.manifestHash ?? ""}`)
    .digest();

  return hash.readUInt32BE(0) & 0x7fffffff;
}

function buildCanonicalProofUri(proof: ProofArtifact): string {
  if (proof.ipfsCid) {
    return `ipfs://${proof.ipfsCid}`;
  }

  if (proof.uri.startsWith("ipfs://") || proof.uri.startsWith("https://") || proof.uri.startsWith("http://")) {
    return proof.uri;
  }

  return `valyria://proof/${proof.id}/${proof.manifestHash ?? "unhashed"}`;
}

export class ProofService {
  constructor(
    private readonly repository: PlatformRepository,
    private readonly xrplGateway: XrplGateway,
    private readonly fileStore?: ProofFileStore
  ) {}

  async listProofs(offerId?: string): Promise<ProofArtifact[]> {
    return this.repository.listProofs(offerId);
  }

  async getProofDetails(proofId: string): Promise<{
    proof: ProofArtifact;
    offer?: {
      id: string;
      seriesAlias: string;
      status: string;
    };
    user?: {
      id: string;
      name?: string;
      email?: string;
    };
    relatedProofs: ProofArtifact[];
  }> {
    const proof = await this.repository.getProof(proofId);

    if (!proof) {
      throw new NotFoundError("Proof");
    }

    const [offer, user, relatedProofs] = await Promise.all([
      proof.offerId ? this.repository.getOffer(proof.offerId) : Promise.resolve(undefined),
      proof.userId ? this.repository.getUser(proof.userId) : Promise.resolve(undefined),
      proof.offerId ? this.repository.listProofs(proof.offerId) : Promise.resolve([])
    ]);

    return {
      proof,
      ...(offer
        ? {
            offer: {
              id: offer.id,
              seriesAlias: offer.series.alias,
              status: offer.status
            }
          }
        : {}),
      ...(user
        ? {
            user: {
              id: user.id,
              ...(user.name ? { name: user.name } : {}),
              email: user.email
            }
          }
        : {}),
      relatedProofs: relatedProofs.filter((item) => item.id !== proof.id)
    };
  }

  async createProof(input: {
    userId?: string;
    offerId?: string;
    artifactType: ProofArtifactType;
    commodity: string;
    uri: string;
    ipfsCid?: string;
    metadata?: Record<string, string | number | boolean>;
    mintOnLedger?: boolean;
    walletSeed?: string;
  }): Promise<ProofArtifact> {
    const manifest = buildProofManifest(input);
    const manifestHash = computeManifestHash(manifest);
    const proof = createProofArtifact({
      id: crypto.randomUUID(),
      ...(input.userId ? { userId: input.userId } : {}),
      ...(input.offerId ? { offerId: input.offerId } : {}),
      artifactType: input.artifactType,
      commodity: input.commodity,
      uri: input.uri,
      ...(input.ipfsCid ? { ipfsCid: input.ipfsCid } : {}),
      manifestHash,
      ...(input.metadata ? { metadata: input.metadata } : {})
    });

    const savedProof = await this.repository.upsertProof(proof);

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      ...(input.userId ? { actorUserId: input.userId } : {}),
      action: "proof.created",
      entityType: "proof",
      entityId: savedProof.id,
      payload: {
        artifactType: savedProof.artifactType,
        offerId: savedProof.offerId,
        manifestHash: savedProof.manifestHash
      },
      createdAt: new Date().toISOString()
    });

    if (!input.mintOnLedger) {
      return savedProof;
    }

    const { proof: mintedProof } = await this.mintProofNft({
      proofId: savedProof.id,
      ...(input.walletSeed ? { walletSeed: input.walletSeed } : {})
    });

    return mintedProof;
  }

  async uploadFile(input: { proofId: string; content: Buffer; filename: string }): Promise<ProofArtifact> {
    const proof = await this.repository.getProof(input.proofId);
    if (!proof) throw new NotFoundError("Proof", input.proofId);
    if (proof.ipfsCid) throw new ConflictError("Proof already has an uploaded file.");
    if (!this.fileStore) throw new ValidationError("File storage is not configured.");

    const { cid } = await this.fileStore.store(input.proofId, input.content, input.filename);
    const updatedProof = await this.repository.upsertProof({
      ...proof,
      ipfsCid: cid,
      uri: `ipfs://${cid}`,
    });

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      ...(proof.userId ? { actorUserId: proof.userId } : {}),
      action: "proof.file_uploaded",
      entityType: "proof",
      entityId: updatedProof.id,
      payload: { ipfsCid: cid, filename: input.filename },
      createdAt: new Date().toISOString(),
    });

    return updatedProof;
  }

  async mintProofNft(input: {
    proofId: string;
    walletSeed?: string;
  }): Promise<{
    proof: ProofArtifact;
    ledger: Awaited<ReturnType<XrplGateway["submitProofNftMint"]>>["receipt"];
  }> {
    const proof = await this.repository.getProof(input.proofId);

    if (!proof) {
      throw new NotFoundError("Proof");
    }

    if (proof.nftTokenId) {
      throw new ConflictError("Proof already minted on XRPL.");
    }

    const owner = await this.resolveProofOwner(proof);

    if (!owner.walletAddress) {
      throw new ValidationError("Proof owner must have a linked wallet before minting Proof NFT.");
    }

    const canonicalUri = buildCanonicalProofUri(proof);
    const taxon = deriveProofNftTaxon({
      artifactType: proof.artifactType,
      commodity: proof.commodity,
      manifestHash: proof.manifestHash
    });
    const ledgerSubmission = await this.xrplGateway.submitProofNftMint({
      ownerWalletAddress: owner.walletAddress,
      ...(input.walletSeed ? { ownerWalletSeed: input.walletSeed } : {}),
      uri: canonicalUri,
      taxon
    });
    const now = new Date().toISOString();
    const savedProof = await this.repository.upsertProof({
      ...proof,
      nftIssuerWallet: owner.walletAddress,
      nftUri: canonicalUri,
      ...(ledgerSubmission.nftTokenId ? { nftTokenId: ledgerSubmission.nftTokenId } : {}),
      ...(ledgerSubmission.receipt.hash ? { nftMintHash: ledgerSubmission.receipt.hash } : {}),
      ...(typeof ledgerSubmission.receipt.ledgerIndex === "number"
        ? { nftMintLedgerSequence: ledgerSubmission.receipt.ledgerIndex }
        : {}),
      nftMintedAt: now
    });

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      actorUserId: owner.id,
      action: "proof.nft_minted",
      entityType: "proof",
      entityId: savedProof.id,
      payload: {
        ownerWallet: owner.walletAddress,
        nftTokenId: savedProof.nftTokenId,
        nftUri: savedProof.nftUri,
        xrplMode: ledgerSubmission.receipt.mode,
        submitted: ledgerSubmission.receipt.submitted,
        ...(savedProof.nftMintHash ? { hash: savedProof.nftMintHash } : {}),
        ...(typeof savedProof.nftMintLedgerSequence === "number"
          ? { ledgerIndex: savedProof.nftMintLedgerSequence }
          : {})
      },
      createdAt: now
    });

    return {
      proof: savedProof,
      ledger: ledgerSubmission.receipt
    };
  }

  private async resolveProofOwner(proof: ProofArtifact) {
    if (proof.userId) {
      const user = await this.repository.getUser(proof.userId);

      if (!user) {
        throw new NotFoundError("Proof owner user");
      }

      return user;
    }

    if (proof.offerId) {
      const offer = await this.repository.getOffer(proof.offerId);

      if (!offer) {
        throw new NotFoundError("Offer");
      }

      const fallbackOwnerId = offer.currentHolderId ?? offer.producerId;
      const user = await this.repository.getUser(fallbackOwnerId);

      if (!user) {
        throw new NotFoundError("Resolved proof owner");
      }

      return user;
    }

    throw new ValidationError("Proof must be linked to a user or offer before minting Proof NFT.");
  }
}
