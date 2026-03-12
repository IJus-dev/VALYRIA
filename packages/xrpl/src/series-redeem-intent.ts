export interface SeriesRedeemIntent {
  holderWallet: string;
  destinationWallet: string;
  deliver: {
    currency: string;
    issuer: string;
    value: string;
  };
}

export function buildSeriesRedeemIntent(input: {
  holderWallet: string;
  destinationWallet: string;
  deliver: {
    currency: string;
    issuer: string;
    value: string;
  };
}): SeriesRedeemIntent {
  return {
    holderWallet: input.holderWallet,
    destinationWallet: input.destinationWallet,
    deliver: input.deliver
  };
}

// --- Redeem Escrow Intents ---

export interface RedeemEscrowCreateIntent {
  source: string;
  destination: string;
  amount: string;
  finishAfter: string;
  deliver: {
    currency: string;
    issuer: string;
    value: string;
  };
  preflightChecks: string[];
  notes: string[];
}

export function buildRedeemEscrowCreateIntent(input: {
  source: string;
  destination: string;
  amount: string;
  finishAfter: string;
  deliver: {
    currency: string;
    issuer: string;
    value: string;
  };
}): RedeemEscrowCreateIntent {
  if (!input.source) throw new Error("Escrow source address is required.");
  if (!input.destination) throw new Error("Escrow destination address is required.");
  if (!input.amount || Number(input.amount) <= 0) throw new Error("Escrow amount must be a positive string value.");
  if (!input.finishAfter) throw new Error("Escrow finishAfter (ISO date) is required.");

  return {
    source: input.source,
    destination: input.destination,
    amount: input.amount,
    finishAfter: input.finishAfter,
    deliver: input.deliver,
    preflightChecks: [
      "source_account_exists",
      "destination_account_exists",
      "finish_after_in_future",
      "last_ledger_sequence_attached"
    ],
    notes: [
      // EscrowCreate trava o IOU da série on-chain até FinishAfter (deadline da janela de resposta)
      "EscrowCreate locks series IOU on-chain until FinishAfter (response window deadline).",
      "EscrowFinish releases to settlement after acceptance. EscrowCancel returns to holder on dispute."
    ]
  };
}

export interface RedeemEscrowFinishIntent {
  owner: string;
  offerSequence: number;
  preflightChecks: string[];
}

export function buildRedeemEscrowFinishIntent(input: {
  owner: string;
  offerSequence: number;
}): RedeemEscrowFinishIntent {
  if (!input.owner) {
    throw new Error("Escrow owner address is required.");
  }

  if (typeof input.offerSequence !== "number" || input.offerSequence <= 0) {
    throw new Error("Escrow offerSequence must be a positive integer.");
  }

  return {
    owner: input.owner,
    offerSequence: input.offerSequence,
    preflightChecks: [
      "escrow_exists_on_ledger",
      "finish_after_has_passed",
      "last_ledger_sequence_attached"
    ]
  };
}

export interface RedeemEscrowCancelIntent {
  owner: string;
  offerSequence: number;
  preflightChecks: string[];
}

export function buildRedeemEscrowCancelIntent(input: {
  owner: string;
  offerSequence: number;
}): RedeemEscrowCancelIntent {
  if (!input.owner) {
    throw new Error("Escrow owner address is required.");
  }

  if (typeof input.offerSequence !== "number" || input.offerSequence <= 0) {
    throw new Error("Escrow offerSequence must be a positive integer.");
  }

  return {
    owner: input.owner,
    offerSequence: input.offerSequence,
    preflightChecks: [
      "escrow_exists_on_ledger",
      "cancel_after_has_passed_or_not_set",
      "last_ledger_sequence_attached"
    ]
  };
}
