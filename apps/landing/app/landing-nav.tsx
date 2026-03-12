"use client";
import { Badge } from "@/components/ui/badge";
import { LangToggle } from "@/components/lang-toggle";
import { useLang } from "@/components/lang-provider";

export function LandingNav() {
  const { t } = useLang();
  return (
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
            {t("nav.problem")}
          </a>
          <a
            href="#como-funciona"
            className="hidden transition hover:text-dusk sm:block"
          >
            {t("nav.howItWorks")}
          </a>
          <a
            href="#ativos"
            className="hidden transition hover:text-dusk md:block"
          >
            {t("nav.protocol")}
          </a>
          <a
            href="https://github.com/IJus-dev/VALYRIA"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-dusk"
          >
            {t("nav.docs")}
          </a>
          <LangToggle />
        </nav>
      </div>
    </header>
  );
}
