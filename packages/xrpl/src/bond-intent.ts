export interface BondAmount {
  currency: string;
  value: string;
  issuer?: string;
}

export interface BondDepositIntent {
  destination: string;
  amount: BondAmount;
  credentialIds: string[];
  preflightChecks: string[];
  notes: string[];
}

export interface BondEscrowCreateIntent {
  source: string;
  destination: string;
  amount: string;
  finishAfter: string;
  condition?: string;
  credentialIds: string[];
  preflightChecks: string[];
  notes: string[];
}

export interface BondEscrowFinishIntent {
  owner: string;
  offerSequence: number;
  condition?: string;
  fulfillment?: string;
  preflightChecks: string[];
}

export interface BondEscrowCancelIntent {
  owner: string;
  offerSequence: number;
  preflightChecks: string[];
}

export function buildBondDepositIntent(input: {
  destination: string;
  amount: BondAmount;
  credentialIds: string[];
}): BondDepositIntent {
  if (input.credentialIds.length === 0) {
    throw new Error("Bond deposits must include at least one accepted credential ID.");
  }

  return {
    destination: input.destination,
    amount: input.amount,
    credentialIds: input.credentialIds,
    preflightChecks: [
      "deposit_authorized(validated)",
      "credential_not_expired",
      "last_ledger_sequence_attached"
    ],
    notes: [
      "Retry tecNO_PERMISSION when the credential expires between pre-check and submission.",
      "Always submit bond transfers with CredentialIDs and validated ledger reads."
    ]
  };
}

export function buildBondEscrowCreateIntent(input: {
  source: string;
  destination: string;
  amount: string;
  finishAfter: string;
  condition?: string;
  credentialIds: string[];
}): BondEscrowCreateIntent {
  if (!input.source) {
    throw new Error("Escrow source address is required.");
  }

  if (!input.destination) {
    throw new Error("Escrow destination address is required.");
  }

  if (!input.amount || Number(input.amount) <= 0) {
    throw new Error("Escrow amount must be a positive string value.");
  }

  if (!input.finishAfter) {
    throw new Error("Escrow finishAfter (ISO date) is required.");
  }

  if (input.credentialIds.length === 0) {
    throw new Error("Bond escrow must include at least one accepted credential ID.");
  }

  return {
    source: input.source,
    destination: input.destination,
    amount: input.amount,
    finishAfter: input.finishAfter,
    ...(input.condition ? { condition: input.condition } : {}),
    credentialIds: input.credentialIds,
    preflightChecks: [
      "source_account_exists",
      "destination_account_exists",
      "credential_not_expired",
      "finish_after_in_future",
      "last_ledger_sequence_attached"
    ],
    notes: [
      // Escrow nativo do XRPL — valor fica travado on-chain até FinishAfter
      "EscrowCreate locks funds on-chain. EscrowFinish releases after FinishAfter.",
      "Persist escrowSequence immediately after submission for later Finish/Cancel."
    ]
  };
}

export function buildBondEscrowFinishIntent(input: {
  owner: string;
  offerSequence: number;
  condition?: string;
  fulfillment?: string;
}): BondEscrowFinishIntent {
  if (!input.owner) {
    throw new Error("Escrow owner address is required.");
  }

  if (typeof input.offerSequence !== "number" || input.offerSequence <= 0) {
    throw new Error("Escrow offerSequence must be a positive integer.");
  }

  return {
    owner: input.owner,
    offerSequence: input.offerSequence,
    ...(input.condition ? { condition: input.condition } : {}),
    ...(input.fulfillment ? { fulfillment: input.fulfillment } : {}),
    preflightChecks: [
      "escrow_exists_on_ledger",
      "finish_after_has_passed",
      "last_ledger_sequence_attached"
    ]
  };
}

export function buildBondEscrowCancelIntent(input: {
  owner: string;
  offerSequence: number;
}): BondEscrowCancelIntent {
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
