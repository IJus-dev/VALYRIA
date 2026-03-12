import { transitionUserState, NotFoundError, ValidationError, AuthorizationError, ConflictError, type PlatformUser } from "@valyria/domain";
import { deriveAddress, verify } from "ripple-keypairs";
import type { PlatformRepository, WalletChallengeRecord } from "./platform-repository";

function utf8ToHex(input: string): string {
  return Buffer.from(input, "utf8").toString("hex").toUpperCase();
}

function buildWalletChallengeMessage(input: {
  challengeId: string;
  userId: string;
  walletAddress: string;
  nonce: string;
  expiresAt: string;
}): string {
  return [
    "VALYRIA Wallet Link Challenge",
    `challenge_id=${input.challengeId}`,
    `user_id=${input.userId}`,
    `wallet=${input.walletAddress}`,
    `nonce=${input.nonce}`,
    `expires_at=${input.expiresAt}`
  ].join("\n");
}

export class WalletChallengeService {
  constructor(private readonly repository: PlatformRepository) {}

  async createChallenge(input: { userId: string; walletAddress: string }): Promise<WalletChallengeRecord> {
    const user = await this.repository.getUser(input.userId);

    if (!user) {
      throw new NotFoundError("User");
    }

    if (user.walletAddress && user.walletAddress !== input.walletAddress) {
      throw new ConflictError("User already has a different wallet linked.");
    }

    const challengeId = crypto.randomUUID();
    const nonce = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const now = new Date().toISOString();
    const message = buildWalletChallengeMessage({
      challengeId,
      userId: user.id,
      walletAddress: input.walletAddress,
      nonce,
      expiresAt
    });

    const challenge: WalletChallengeRecord = {
      id: challengeId,
      userId: user.id,
      walletAddress: input.walletAddress,
      nonce,
      message,
      expiresAt,
      createdAt: now,
      updatedAt: now
    };

    const savedChallenge = await this.repository.createWalletChallenge(challenge);

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      actorUserId: user.id,
      action: "wallet.challenge.created",
      entityType: "wallet_challenge",
      entityId: savedChallenge.id,
      payload: {
        walletAddress: savedChallenge.walletAddress,
        expiresAt: savedChallenge.expiresAt
      },
      createdAt: now
    });

    return savedChallenge;
  }

  async verifyChallenge(input: {
    challengeId: string;
    signature: string;
    publicKey: string;
    actorUserId: string;
  }): Promise<{
    challenge: WalletChallengeRecord;
    user: PlatformUser;
  }> {
    const challenge = await this.repository.getWalletChallenge(input.challengeId);

    if (!challenge) {
      throw new NotFoundError("Wallet challenge");
    }

    if (challenge.userId !== input.actorUserId) {
      throw new AuthorizationError("Wallet challenge does not belong to the authenticated user.");
    }

    if (challenge.usedAt) {
      throw new ValidationError("Wallet challenge already used.");
    }

    if (new Date(challenge.expiresAt).getTime() < Date.now()) {
      throw new ValidationError("Wallet challenge expired.");
    }

    const derivedAddress = deriveAddress(input.publicKey);

    if (derivedAddress !== challenge.walletAddress) {
      throw new AuthorizationError("Public key does not match the expected wallet address.");
    }

    const isValid = verify(utf8ToHex(challenge.message), input.signature, input.publicKey);

    if (!isValid) {
      throw new AuthorizationError("Wallet signature verification failed.");
    }

    const user = await this.repository.getUser(challenge.userId);

    if (!user) {
      throw new NotFoundError("User");
    }

    const now = new Date().toISOString();
    const updatedChallenge = await this.repository.markWalletChallengeUsed(challenge.id, now);

    let nextUserState = user.state;

    if (user.state === "registered" || user.state === "email_verified") {
      nextUserState = transitionUserState(user.state, "link_wallet");
    }

    const updatedUser: PlatformUser = {
      ...user,
      walletAddress: challenge.walletAddress,
      state: nextUserState,
      updatedAt: now
    };

    const savedUser = await this.repository.upsertUser(updatedUser);

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      actorUserId: savedUser.id,
      action: "wallet.challenge.verified",
      entityType: "wallet_challenge",
      entityId: updatedChallenge.id,
      payload: {
        walletAddress: savedUser.walletAddress
      },
      createdAt: now
    });

    return {
      challenge: updatedChallenge,
      user: savedUser
    };
  }
}
