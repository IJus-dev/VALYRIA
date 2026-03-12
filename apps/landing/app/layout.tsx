import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import "./globals.css";

export const metadata: Metadata = {
  title: "VALYRIA — Derivativos agrícolas na XRPL",
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
    <html lang="pt-BR">
      <body>
        <header className="sticky top-0 z-header border-b border-line/20 bg-paper/80 backdrop-blur-xl">
          <div className="section-inner flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold uppercase tracking-brand text-dusk">
                VALYRIA
              </span>
              <Badge variant="neutral" className="hidden sm:inline-flex">
                protocol
              </Badge>
            </div>
            <nav className="flex items-center gap-6 text-sm font-medium text-dusk/70">
              <a
                href="#problema"
                className="hidden transition hover:text-dusk sm:block"
              >
                O problema
              </a>
              <a
                href="#como-funciona"
                className="hidden transition hover:text-dusk sm:block"
              >
                Como funciona
              </a>
              <a
                href="#ativos"
                className="hidden transition hover:text-dusk md:block"
              >
                Protocolo
              </a>
              <a
                href="https://github.com/valyria-protocol"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-dusk"
              >
                Docs
              </a>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="border-t border-line/25 bg-paper/40">
          <div className="section-inner grid gap-8 py-12 sm:grid-cols-3">
            <div>
              <span className="text-sm font-bold uppercase tracking-brand text-dusk">
                VALYRIA
              </span>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink/50">
                Derivativos agrícolas nativos do XRPL. Do campo ao contrato, do
                contrato à entrega.
              </p>
            </div>
            <div>
              <span className="label-caps">Protocolo</span>
              <div className="mt-3 flex flex-col gap-2 text-sm text-ink/55">
                <a
                  href="#problema"
                  className="transition hover:text-dusk"
                >
                  O problema
                </a>
                <a
                  href="#como-funciona"
                  className="transition hover:text-dusk"
                >
                  Como funciona
                </a>
                <a
                  href="#ativos"
                  className="transition hover:text-dusk"
                >
                  Ativos
                </a>
              </div>
            </div>
            <div>
              <span className="label-caps">Protocolo</span>
              <div className="mt-3 flex flex-col gap-2 text-sm text-ink/55">
                <a
                  href="#como-funciona"
                  className="transition hover:text-dusk"
                >
                  Como funciona
                </a>
                <a
                  href="#ativos"
                  className="transition hover:text-dusk"
                >
                  Ativos
                </a>
                <a
                  href="https://github.com/valyria-protocol"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-dusk"
                >
                  Documentação
                </a>
                <a
                  href="https://udax-fgv.notion.site/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-dusk"
                >
                  UDAX 2026
                </a>
              </div>
            </div>
          </div>
          <div className="section-inner border-t border-line/15 py-4">
            <p className="text-xs text-ink/30">
              &copy; 2026 VALYRIA. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
