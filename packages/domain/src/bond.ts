import { InvalidStateTransitionError, ValidationError } from "./errors";

export type BondState =
  | "pending"
  | "locked"
  | "frozen"
  | "partially_slashed"
  | "released"
  | "forfeited";

export type BondEvent =
  | "confirm_deposit"
  | "freeze"
  | "restore_lock"
  | "slash_partial"
  | "release"
  | "forfeit";

export interface Bond {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  credentialIds: string[];
  state: BondState;
  slashedAmount: number;
  ledgerHash?: string;
  ledgerSequence?: number;
  escrowSequence?: number;
  escrowCondition?: string;
  escrowFinishAfter?: string;
  escrowLedgerHash?: string;
  createdAt: string;
  updatedAt: string;
  lockedAt?: string;
  frozenAt?: string;
}

const bondTransitions: Record<BondState, Partial<Record<BondEvent, BondState>>> = {
  pending: {
    confirm_deposit: "locked",
    forfeit: "forfeited"
  },
  locked: {
    freeze: "frozen",
    slash_partial: "partially_slashed",
    release: "released",
    forfeit: "forfeited"
  },
  frozen: {
    restore_lock: "locked",
    slash_partial: "partially_slashed",
    forfeit: "forfeited"
  },
  partially_slashed: {
    freeze: "frozen",
    release: "released",
    forfeit: "forfeited"
  },
  released: {},
  forfeited: {}
};

export function transitionBondState(currentState: BondState, event: BondEvent): BondState {
  const nextState = bondTransitions[currentState][event];

  if (!nextState) {
    throw new InvalidStateTransitionError("Bond", currentState, event);
  }

  return nextState;
}

export function createBond(input: {
  id: string;
  userId: string;
  amount: number;
  currency?: string;
  credentialIds?: string[];
  state?: BondState;
  slashedAmount?: number;
  ledgerHash?: string;
  ledgerSequence?: number;
  escrowSequence?: number;
  escrowCondition?: string;
  escrowFinishAfter?: string;
  escrowLedgerHash?: string;
  createdAt?: string;
  lockedAt?: string;
  frozenAt?: string;
}): Bond {
  if (input.amount <= 0) {
    throw new ValidationError("Bond amount must be greater than zero.");
  }

  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    id: input.id,
    userId: input.userId,
    amount: input.amount,
    currency: input.currency ?? "VEX",
    credentialIds: input.credentialIds ?? [],
    state: input.state ?? "pending",
    slashedAmount: input.slashedAmount ?? 0,
    ...(input.ledgerHash ? { ledgerHash: input.ledgerHash } : {}),
    ...(typeof input.ledgerSequence === "number" ? { ledgerSequence: input.ledgerSequence } : {}),
    ...(typeof input.escrowSequence === "number" ? { escrowSequence: input.escrowSequence } : {}),
    ...(input.escrowCondition ? { escrowCondition: input.escrowCondition } : {}),
    ...(input.escrowFinishAfter ? { escrowFinishAfter: input.escrowFinishAfter } : {}),
    ...(input.escrowLedgerHash ? { escrowLedgerHash: input.escrowLedgerHash } : {}),
    createdAt,
    updatedAt: createdAt,
    ...(input.lockedAt ? { lockedAt: input.lockedAt } : {}),
    ...(input.frozenAt ? { frozenAt: input.frozenAt } : {})
  };
}
