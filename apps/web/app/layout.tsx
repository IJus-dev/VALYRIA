import type { Metadata } from "next";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { AuthStoreProvider } from "@/components/providers/auth-store-provider";
import { SiteHeader } from "@/components/shell/site-header";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "VALYRIA",
  description: "Infraestrutura XRPL-native para originação, negociação e liquidação de derivativos agrícolas."
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const user = session?.user;
  const sessionData = user
    ? {
        userId: user.id!,
        email: user.email ?? "",
        ...(user.walletAddress ? { walletAddress: user.walletAddress } : {}),
        ...(user.state ? { state: user.state } : {}),
        ...(user.roles ? { roles: user.roles } : {}),
      }
    : null;

  return (
    <html lang="pt-BR">
      <body>
        <SessionProvider>
          <AuthStoreProvider session={sessionData}>
            <QueryProvider>
              <div className="app-shell">
                <SiteHeader session={session} />
                {children}
              </div>
            </QueryProvider>
          </AuthStoreProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
