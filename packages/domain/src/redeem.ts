import { InvalidStateTransitionError } from "./errors";

export type RedeemState =
  | "requested"
  | "tracking_pending"
  | "in_delivery"
  | "delivered"
  | "accepted"
  | "disputed"
  | "closed";

export type RedeemEvent =
  | "attach_tracking"
  | "ship"
  | "confirm_delivery"
  | "accept"
  | "open_dispute"
  | "close";

export interface RedeemRequest {
  id: string;
  offerId: string;
  holderId: string;
  state: RedeemState;
  requestedAt: string;
  responseWindowDays: number;
  settlementWallet: string;
  trackingCode?: string;
  settlementLedgerHash?: string;
  settlementLedgerSequence?: number;
  settlementTransferredAt?: string;
  escrowSequence?: number;
  escrowFinishAfter?: string;
  escrowLedgerHash?: string;
  shippedAt?: string;
  deliveredAt?: string;
  acceptedAt?: string;
  closedAt?: string;
}

const redeemTransitions: Record<RedeemState, Partial<Record<RedeemEvent, RedeemState>>> = {
  requested: {
    attach_tracking: "tracking_pending",
    open_dispute: "disputed"
  },
  tracking_pending: {
    ship: "in_delivery",
    open_dispute: "disputed"
  },
  in_delivery: {
    confirm_delivery: "delivered",
    open_dispute: "disputed"
  },
  delivered: {
    accept: "accepted",
    open_dispute: "disputed"
  },
  accepted: {
    close: "closed"
  },
  disputed: {
    close: "closed"
  },
  closed: {}
};

export function transitionRedeemState(currentState: RedeemState, event: RedeemEvent): RedeemState {
  const nextState = redeemTransitions[currentState][event];

  if (!nextState) {
    throw new InvalidStateTransitionError("Redeem", currentState, event);
  }

  return nextState;
}

export function createRedeemRequest(input: {
  id: string;
  offerId: string;
  holderId: string;
  settlementWallet: string;
  responseWindowDays?: number;
  createdAt?: string;
  trackingCode?: string;
  settlementLedgerHash?: string;
  settlementLedgerSequence?: number;
  settlementTransferredAt?: string;
  escrowSequence?: number;
  escrowFinishAfter?: string;
  escrowLedgerHash?: string;
  shippedAt?: string;
  deliveredAt?: string;
  acceptedAt?: string;
  closedAt?: string;
}): RedeemRequest {
  const requestedAt = input.createdAt ?? new Date().toISOString();

  return {
    id: input.id,
    offerId: input.offerId,
    holderId: input.holderId,
    settlementWallet: input.settlementWallet,
    responseWindowDays: input.responseWindowDays ?? 5,
    requestedAt,
    state: "requested",
    ...(input.trackingCode ? { trackingCode: input.trackingCode } : {}),
    ...(input.settlementLedgerHash ? { settlementLedgerHash: input.settlementLedgerHash } : {}),
    ...(typeof input.settlementLedgerSequence === "number"
      ? { settlementLedgerSequence: input.settlementLedgerSequence }
      : {}),
    ...(input.settlementTransferredAt ? { settlementTransferredAt: input.settlementTransferredAt } : {}),
    ...(typeof input.escrowSequence === "number" ? { escrowSequence: input.escrowSequence } : {}),
    ...(input.escrowFinishAfter ? { escrowFinishAfter: input.escrowFinishAfter } : {}),
    ...(input.escrowLedgerHash ? { escrowLedgerHash: input.escrowLedgerHash } : {}),
    ...(input.shippedAt ? { shippedAt: input.shippedAt } : {}),
    ...(input.deliveredAt ? { deliveredAt: input.deliveredAt } : {}),
    ...(input.acceptedAt ? { acceptedAt: input.acceptedAt } : {}),
    ...(input.closedAt ? { closedAt: input.closedAt } : {})
  };
}
