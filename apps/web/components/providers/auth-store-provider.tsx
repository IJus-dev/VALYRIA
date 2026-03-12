"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";

interface AuthStoreProviderProps {
  children: ReactNode;
  session: {
    userId: string;
    email: string;
    walletAddress?: string;
    state?: string;
    roles?: string[];
  } | null;
}

export function AuthStoreProvider({
  children,
  session,
}: AuthStoreProviderProps) {
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    setSession(session);
  }, [session, setSession]);

  return <>{children}</>;
}
