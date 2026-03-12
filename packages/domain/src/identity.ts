import { InvalidStateTransitionError } from "./errors";

export type UserState =
  | "registered"
  | "email_verified"
  | "wallet_linked"
  | "kyc_pending"
  | "kyc_approved"
  | "kyc_rejected"
  | "producer_approved"
  | "suspended";

export type UserRole = "admin" | "compliance" | "operations" | "support" | "read_only";

export type UserLifecycleEvent =
  | "verify_email"
  | "link_wallet"
  | "submit_kyc"
  | "approve_kyc"
  | "reject_kyc"
  | "approve_producer"
  | "suspend"
  | "reinstate";

export interface PlatformUser {
  id: string;
  name?: string;
  email?: string;
  walletAddress?: string;
  state: UserState;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
}

const userTransitions: Record<UserState, Partial<Record<UserLifecycleEvent, UserState>>> = {
  registered: {
    verify_email: "email_verified",
    link_wallet: "wallet_linked",
    suspend: "suspended"
  },
  email_verified: {
    link_wallet: "wallet_linked",
    suspend: "suspended"
  },
  wallet_linked: {
    submit_kyc: "kyc_pending",
    suspend: "suspended"
  },
  kyc_pending: {
    approve_kyc: "kyc_approved",
    reject_kyc: "kyc_rejected",
    suspend: "suspended"
  },
  kyc_approved: {
    approve_producer: "producer_approved",
    suspend: "suspended"
  },
  kyc_rejected: {
    submit_kyc: "kyc_pending",
    suspend: "suspended"
  },
  producer_approved: {
    suspend: "suspended"
  },
  suspended: {
    reinstate: "kyc_approved"
  }
};

export function transitionUserState(currentState: UserState, event: UserLifecycleEvent): UserState {
  const nextState = userTransitions[currentState][event];

  if (!nextState) {
    throw new InvalidStateTransitionError("User", currentState, event);
  }

  return nextState;
}

export function createUser(input: {
  id: string;
  name?: string;
  email?: string;
  walletAddress?: string;
  roles?: UserRole[];
  state?: UserState;
  createdAt?: string;
}): PlatformUser {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    id: input.id,
    ...(input.name ? { name: input.name } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.walletAddress ? { walletAddress: input.walletAddress } : {}),
    roles: input.roles ?? [],
    state: input.state ?? "registered",
    createdAt,
    updatedAt: createdAt
  };
}

export function canOperateOnChain(state: UserState): boolean {
  return state === "kyc_approved" || state === "producer_approved";
}
