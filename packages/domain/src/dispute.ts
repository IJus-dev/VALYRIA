import { InvalidStateTransitionError } from "./errors";

export type DisputeTier = "tier_1" | "tier_2" | "tier_3";

export type DisputeState = "opened" | "under_review" | "resolved" | "escalated" | "rejected";

export type DisputeEvent = "start_review" | "escalate" | "resolve" | "reject";

export type DisputeBondDecision = "restore_lock" | "slash_partial" | "forfeit";

export interface DisputeCase {
  id: string;
  redeemId: string;
  openedByUserId: string;
  tier: DisputeTier;
  state: DisputeState;
  reason: string;
  evidenceUri?: string;
  bondId?: string;
  bondDecision?: DisputeBondDecision;
  slaDueAt?: string;
  resolvedAt?: string;
  resolutionSummary?: string;
  createdAt: string;
  updatedAt: string;
}

const disputeTransitions: Record<DisputeState, Partial<Record<DisputeEvent, DisputeState>>> = {
  opened: {
    start_review: "under_review",
    escalate: "escalated",
    resolve: "resolved",
    reject: "rejected"
  },
  under_review: {
    escalate: "escalated",
    resolve: "resolved",
    reject: "rejected"
  },
  escalated: {
    resolve: "resolved",
    reject: "rejected"
  },
  resolved: {},
  rejected: {}
};

export function transitionDisputeState(currentState: DisputeState, event: DisputeEvent): DisputeState {
  const nextState = disputeTransitions[currentState][event];

  if (!nextState) {
    throw new InvalidStateTransitionError("Dispute", currentState, event);
  }

  return nextState;
}

export function escalateDisputeTier(currentTier: DisputeTier): DisputeTier {
  if (currentTier === "tier_1") {
    return "tier_2";
  }

  if (currentTier === "tier_2") {
    return "tier_3";
  }

  throw new InvalidStateTransitionError("Dispute", currentTier, "escalate");
}

export function getDisputeTierSlaDays(tier: DisputeTier): number {
  if (tier === "tier_1") {
    return 5;
  }

  if (tier === "tier_2") {
    return 10;
  }

  return 30;
}

export function createDisputeCase(input: {
  id: string;
  redeemId: string;
  openedByUserId: string;
  reason: string;
  tier?: DisputeTier;
  evidenceUri?: string;
  bondId?: string;
  slaDueAt?: string;
  createdAt?: string;
}): DisputeCase {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    id: input.id,
    redeemId: input.redeemId,
    openedByUserId: input.openedByUserId,
    tier: input.tier ?? "tier_1",
    state: "opened",
    reason: input.reason,
    ...(input.evidenceUri ? { evidenceUri: input.evidenceUri } : {}),
    ...(input.bondId ? { bondId: input.bondId } : {}),
    ...(input.slaDueAt ? { slaDueAt: input.slaDueAt } : {}),
    createdAt,
    updatedAt: createdAt
  };
}
