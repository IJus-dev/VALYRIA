"use client";
import { useLang } from "@/components/lang-provider";

export function LandingFooter() {
  const { t } = useLang();
  return (
    <footer className="border-t border-line/25 bg-paper/40">
      <div className="section-inner grid gap-8 py-12 sm:grid-cols-3">
        <div>
          <span className="text-sm font-bold uppercase tracking-brand text-dusk">
            VALYRIA
          </span>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink/50">
            {t("footer.tagline")}
          </p>
        </div>
        <div>
          <span className="label-caps">{t("footer.protocol")}</span>
          <div className="mt-3 flex flex-col gap-2 text-sm text-ink/55">
            <a href="#problema" className="transition hover:text-dusk">
              {t("nav.problem")}
            </a>
            <a href="#como-funciona" className="transition hover:text-dusk">
              {t("nav.howItWorks")}
            </a>
            <a href="#ativos" className="transition hover:text-dusk">
              {t("footer.assets")}
            </a>
          </div>
        </div>
        <div>
          <span className="label-caps">{t("footer.resources")}</span>
          <div className="mt-3 flex flex-col gap-2 text-sm text-ink/55">
            <a href="#como-funciona" className="transition hover:text-dusk">
              {t("nav.howItWorks")}
            </a>
            <a href="#ativos" className="transition hover:text-dusk">
              {t("footer.assets")}
            </a>
            <a
              href="https://github.com/IJus-dev/VALYRIA"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-dusk"
            >
              {t("footer.documentation")}
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
          &copy; {t("footer.copyright")}
        </p>
      </div>
    </footer>
  );
}
