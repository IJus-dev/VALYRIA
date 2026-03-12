import { create } from "zustand";

interface AuthState {
  userId: string | null;
  email: string | null;
  walletAddress: string | null;
  state: string | null;
  roles: string[];
  setSession: (
    session: {
      userId: string;
      email: string;
      walletAddress?: string;
      state?: string;
      roles?: string[];
    } | null
  ) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  email: null,
  walletAddress: null,
  state: null,
  roles: [],
  setSession: (session) =>
    set(
      session
        ? {
            userId: session.userId,
            email: session.email,
            walletAddress: session.walletAddress ?? null,
            state: session.state ?? null,
            roles: session.roles ?? [],
          }
        : {
            userId: null,
            email: null,
            walletAddress: null,
            state: null,
            roles: [],
          }
    ),
}));
