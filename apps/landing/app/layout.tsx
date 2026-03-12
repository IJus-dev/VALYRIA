import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { LangProvider } from "@/components/lang-provider";
import { LandingNav } from "./landing-nav";
import { LandingFooter } from "./landing-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "VALYRIA — Agricultural derivatives on XRPL",
  description:
    "VALYRIA is a decentralized platform built on the XRP Ledger (XRPL) that enables the tokenization and trading of agricultural commodity derivatives, connecting farmers, buyers, and investors in a digital marketplace where tokenized contracts representing future commodity deliveries can be issued and traded.",
  openGraph: {
    title: "VALYRIA — Agricultural derivatives on XRPL",
    description:
      "Decentralized platform on the XRP Ledger for tokenizing and trading agricultural commodity futures. Producers issue contracts backed by real harvests, buyers trade them in a liquid secondary market.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VALYRIA — Agricultural derivatives on XRPL",
    description:
      "Decentralized platform on the XRP Ledger for tokenizing and trading agricultural commodity futures.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LangProvider>
          <LandingNav />
          <main>{children}</main>
          <LandingFooter />
        </LangProvider>
      </body>
    </html>
  );
}
