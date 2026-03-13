"use client";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  ExternalLink,
  FileCheck2,
  Flame,
  Layers3,
  MapPinned,
  ScrollText,
  ShieldCheck,
  Tractor,
  Truck,
  UserCheck,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { useLang } from "@/components/lang-provider";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/* ─── Equipe ───────────────────────────────────────────────────────────── */
const equipe = [
  { nome: "Roberto Caparroz", papel: "Advisor", foto: "/equipe/Roberto.jpg", iniciais: "RC", cor: "bg-moss" },
  { nome: "Daniel Matos", papel: "CEO", foto: "/equipe/Daniel.jpg", iniciais: "DM", cor: "bg-clay" },
  { nome: "Leonardo Caparroz", papel: "Founder (Wisebit) & Dev", foto: "/equipe/Leo.jpg", iniciais: "LC", cor: "bg-dusk" },
  { nome: "Gustavo Caparroz", papel: "Founder (Wisebit)", foto: "/equipe/Gustavo.jpg", iniciais: "GC", cor: "bg-moss", fotoOffset: "-20px" },
  { nome: "Pedro Sola", papel: "PO", foto: "/equipe/Pedro.jpg", iniciais: "PS", cor: "bg-clay" },
  { nome: "Renzo", papel: "Dev", foto: "/equipe/Renzo.jpg", iniciais: "RZ", cor: "bg-dusk" },
  { nome: "Marcos Scheunemann", papel: "Cloud & Data Analyst", foto: "/equipe/Marcus.jpg", iniciais: "MV", cor: "bg-moss" },
  { nome: "Beatriz", papel: "Legal", foto: "/equipe/Beatriz.jpg", iniciais: "BZ", cor: "bg-clay" },
];

export default function HomePage() {
  const { t } = useLang();

  const problemas = [
    { titulo: t("problems.1.title"), descricao: t("problems.1.body") },
    { titulo: t("problems.2.title"), descricao: t("problems.2.body") },
    { titulo: t("problems.3.title"), descricao: t("problems.3.body") },
  ];

  const metricas = [
    { valor: t("metrics.1.value"), rotulo: t("metrics.1.label") },
    { valor: t("metrics.2.value"), rotulo: t("metrics.2.label") },
    { valor: t("metrics.3.value"), rotulo: t("metrics.3.label") },
    { valor: t("metrics.4.value"), rotulo: t("metrics.4.label") },
  ];

  const pipelineSteps = [
    { icon: UserCheck, titulo: t("howItWorks.step1.title"), cor: "bg-moss", descricao: t("howItWorks.step1.desc") },
    { icon: ScrollText, titulo: t("howItWorks.step2.title"), cor: "bg-clay", descricao: t("howItWorks.step2.desc") },
    { icon: Layers3, titulo: t("howItWorks.step3.title"), cor: "bg-moss", descricao: t("howItWorks.step3.desc") },
    { icon: BarChart3, titulo: t("howItWorks.step4.title"), cor: "bg-clay", descricao: t("howItWorks.step4.desc") },
    { icon: Truck, titulo: t("howItWorks.step5.title"), cor: "bg-moss", descricao: t("howItWorks.step5.desc") },
  ];

  const settlementSteps = [
    { icon: ShieldCheck, label: t("settlement.step1") },
    { icon: WalletCards, label: t("settlement.step2") },
    { icon: Truck, label: t("settlement.step3") },
    { icon: FileCheck2, label: t("settlement.step4") },
    { icon: Flame, label: t("settlement.step5") },
    { icon: MapPinned, label: t("settlement.step6") },
  ];

  const ativos = [
    { icon: WalletCards, titulo: "VEX", descricao: t("assets.vex") },
    { icon: Layers3, titulo: t("assets.seriesTitle"), descricao: t("assets.series") },
    { icon: FileCheck2, titulo: "Proof", descricao: t("assets.proof") },
    { icon: MapPinned, titulo: "Redeem", descricao: t("assets.redeem") },
  ];

  const perfis = [
    { icon: Tractor, titulo: t("forWhom.producers.title"), descricao: t("forWhom.producers.body") },
    { icon: WalletCards, titulo: t("forWhom.buyers.title"), descricao: t("forWhom.buyers.body") },
    { icon: ShieldCheck, titulo: t("forWhom.lps.title"), descricao: t("forWhom.lps.body") },
  ];

  const udaxCards = [
    { label: "Ripple", text: t("udax.ripple") },
    { label: "FGV", text: t("udax.fgv") },
    { label: "Demo Day", text: t("udax.demoDay") },
    { label: "VC Network", text: t("udax.vcNetwork") },
  ];

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pb-section pt-24 sm:pt-32">
        <div className="hero-image-wrapper" aria-hidden="true">
          <img src={`${BASE}/hero-campo.png`} alt="" className="hero-image" />
        </div>
        <div className="section-inner relative">
          <div className="hero-stagger max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>XRPL-native</Badge>
              <Badge variant="outline">UDAX 2026</Badge>
            </div>
            <h1 className="mt-10 font-display text-5xl leading-none tracking-tight text-dusk sm:text-6xl lg:text-7xl">
              {t("hero.h1.line1")}
              <br />
              <span className="text-clay">{t("hero.h1.line2")}</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-dusk/70">
              {t("hero.body")}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="#problema" size="lg">
                {t("hero.cta1")}
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="#como-funciona" variant="ghost" size="lg">
                {t("hero.cta2")}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* ── Partners ── */}
      <section className="border-y border-line/30">
        <div className="section-inner flex flex-wrap items-center justify-center gap-10 py-5 sm:gap-16">
          {["XRPL Ledger", "Ripple", "FGV", "UDAX 2026"].map((p) => (
            <span key={p} className="text-xs font-semibold uppercase tracking-brand text-line">
              {p}
            </span>
          ))}
        </div>
      </section>

      {/* ── Problems ── */}
      <section id="problema" className="section-inner py-section">
        <SectionHeading eyebrow={t("problems.eyebrow")} heading={t("problems.heading")} />
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {problemas.map((p, i) => (
            <div key={i} className="rv border-t-2 border-clay/30 pt-6">
              <span className="font-display text-5xl text-line/30">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-xl font-semibold text-dusk">{p.titulo}</h3>
              <p className="mt-3 text-sm leading-relaxed text-dusk/70">{p.descricao}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Statement ── */}
      <section className="section-inner pb-section">
        <div className="rv-border border-l-2 border-moss/40 pl-6 sm:pl-10">
          <p className="max-w-4xl font-display text-3xl leading-snug tracking-tight text-dusk sm:text-4xl">
            {t("statement")}
          </p>
        </div>
      </section>

      {/* ── Metrics (dark) ── */}
      <section className="bg-dusk">
        <div className="section-inner grid grid-cols-2 py-16 sm:grid-cols-4 sm:py-20">
          {metricas.map((m, i) => (
            <div
              key={i}
              className={`rv-scale flex flex-col items-center gap-3 px-4 py-6 text-center ${
                i < metricas.length - 1 ? "border-r border-paper/15" : ""
              }`}
            >
              <span className="font-display text-5xl tracking-tight text-paper sm:text-6xl">
                {m.valor}
              </span>
              <span className="text-sm text-paper/60">{m.rotulo}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="como-funciona" className="section-inner py-section">
        <SectionHeading eyebrow={t("howItWorks.eyebrow")} heading={t("howItWorks.heading")} />
        <div className="mt-14">
          {/* Desktop */}
          <div className="hidden lg:block">
            <div className="flex items-start">
              {pipelineSteps.map((step, i, arr) => (
                <div key={i} className="rv flex flex-1 flex-col items-center text-center">
                  <div className="flex items-center">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-full ${step.cor} text-paper`}>
                      <step.icon className="h-6 w-6" />
                    </div>
                    {i < arr.length - 1 && (
                      <div className="flex w-full items-center px-2">
                        <div className="h-0.5 flex-1 bg-line/25" />
                        <ArrowRight className="h-4 w-4 shrink-0 text-line/50" />
                      </div>
                    )}
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-dusk">{step.titulo}</h3>
                  <p className="mt-1 max-w-36 text-xs leading-relaxed text-dusk/70">{step.descricao}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Mobile */}
          <div className="lg:hidden">
            <div className="relative border-l-2 border-line/25 pl-8">
              {pipelineSteps.map((step, i) => (
                <div key={i} className="rv relative mb-8 last:mb-0">
                  <div className={`absolute -left-12 flex h-10 w-10 items-center justify-center rounded-full ${step.cor} text-paper`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-dusk">{step.titulo}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-dusk/70">{step.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Two perspectives */}
        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <Card tone="soft" className="rv p-6">
            <div className="flex items-center gap-3">
              <Tractor className="h-5 w-5 text-moss" />
              <h3 className="font-semibold text-dusk">{t("producer.heading")}</h3>
            </div>
            <ol className="mt-5 flex flex-col gap-3 text-sm leading-relaxed text-dusk/70">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <li key={n} className="flex gap-3">
                  <span className="shrink-0 font-display text-lg text-moss">{n}</span>
                  {t(`producer.${n}`)}
                </li>
              ))}
            </ol>
          </Card>
          <Card tone="soft" className="rv p-6">
            <div className="flex items-center gap-3">
              <WalletCards className="h-5 w-5 text-clay" />
              <h3 className="font-semibold text-dusk">{t("buyer.heading")}</h3>
            </div>
            <ol className="mt-5 flex flex-col gap-3 text-sm leading-relaxed text-dusk/70">
              {[1, 2, 3, 4, 5].map((n) => (
                <li key={n} className="flex gap-3">
                  <span className="shrink-0 font-display text-lg text-clay">{n}</span>
                  {t(`buyer.${n}`)}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </section>

      {/* ── Settlement (dark) ── */}
      <section className="bg-dusk">
        <div className="section-inner py-16">
          <SectionHeading eyebrow={t("settlement.eyebrow")} heading={t("settlement.heading")} tone="inverse" />
          <div className="mt-10">
            {/* Desktop */}
            <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-2">
              {settlementSteps.map((step, i, arr) => (
                <div key={i} className="rv flex items-center gap-2">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-paper/20 bg-paper/10">
                      <step.icon className="h-4 w-4 text-paper" />
                    </div>
                    <span className="max-w-20 text-center text-xs text-paper/70">{step.label}</span>
                  </div>
                  {i < arr.length - 1 && <ArrowRight className="h-5 w-5 shrink-0 text-paper/40" />}
                </div>
              ))}
            </div>
            {/* Mobile */}
            <div className="flex flex-col gap-4 sm:hidden">
              {settlementSteps.map((step, i) => (
                <div key={i} className="rv flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-paper/20 bg-paper/10">
                    <step.icon className="h-4 w-4 text-paper" />
                  </div>
                  <span className="text-sm text-paper/70">{step.label}</span>
                </div>
              ))}
            </div>
            {/* Dispute */}
            <div className="rv mt-8 flex items-center gap-3 rounded-tile border border-paper/10 bg-paper/5 px-5 py-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-clay" />
              <p className="text-sm text-paper/70">
                {t("settlement.dispute")} <span className="font-semibold text-paper">{t("settlement.dao")}</span> {t("settlement.disputeEnd")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Assets ── */}
      <section id="ativos" className="section-inner py-section">
        <SectionHeading eyebrow={t("assets.eyebrow")} heading={t("assets.heading")} />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ativos.map((a) => (
            <Card
              key={a.titulo}
              tone="soft"
              className="rv p-6 transition duration-300 ease-fluent hover:-translate-y-1 hover:shadow-hero"
            >
              <a.icon className="h-5 w-5 text-clay" />
              <div className="mt-5 font-display text-3xl text-dusk">{a.titulo}</div>
              <p className="mt-3 text-sm leading-relaxed text-dusk/70">{a.descricao}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── For whom (dark) ── */}
      <section className="bg-dusk">
        <div className="section-inner py-section">
          <SectionHeading eyebrow={t("forWhom.eyebrow")} heading={t("forWhom.heading")} tone="inverse" />
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {perfis.map((p) => (
              <div
                key={p.titulo}
                className="rv rounded-tile border border-paper/15 bg-paper/10 p-6 transition duration-300 ease-fluent hover:bg-paper/15"
              >
                <p.icon className="h-5 w-5 text-paper" />
                <h3 className="mt-4 font-display text-2xl text-paper">{p.titulo}</h3>
                <p className="mt-3 text-sm leading-relaxed text-paper/70">{p.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="section-inner py-section">
        <SectionHeading eyebrow={t("team.eyebrow")} heading={t("team.heading")} />
        <div className="mt-14 flex flex-col gap-12">
          {[equipe.slice(0, 2), equipe.slice(2, 5), equipe.slice(5, 8)].map((row, ri) => (
            <div key={ri} className="flex justify-center gap-8 sm:gap-12">
              {row.map((m) => (
                <div key={m.nome} className="rv flex flex-col items-center gap-4">
                  <img
                    src={`${BASE}${m.foto}`}
                    alt={m.nome}
                    className="h-24 w-24 rounded-full object-cover object-top sm:h-28 sm:w-28"
                    style={m.fotoOffset ? { objectPosition: `center ${m.fotoOffset}` } : undefined}
                  />
                  <div className="text-center">
                    <div className="text-sm font-semibold text-dusk">{m.nome}</div>
                    {m.papel && (
                      <div className="mt-1 text-xs font-medium uppercase tracking-eyebrow text-clay">
                        {m.papel}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── UDAX 2026 ── */}
      <section className="border-y border-line/30">
        <div className="section-inner py-section">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <SectionHeading
                eyebrow={t("udax.eyebrow")}
                heading={t("udax.heading")}
                description={t("udax.description")}
              />
              <a
                href="https://udax-fgv.notion.site/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-moss transition hover:text-clay"
              >
                {t("udax.link")}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {udaxCards.map((c) => (
                <Card
                  key={c.label}
                  tone="soft"
                  className="rv p-5 transition duration-300 ease-fluent hover:-translate-y-1 hover:shadow-hero"
                >
                  <span className="label-caps">{c.label}</span>
                  <p className="mt-3 text-sm leading-relaxed text-dusk/70">{c.text}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA (dark) ── */}
      <section className="bg-dusk">
        <div className="section-inner flex flex-col items-center gap-8 py-section text-center">
          <h2 className="max-w-3xl font-display text-4xl tracking-tight text-paper sm:text-5xl lg:text-6xl">
            {t("cta.h2.line1")}
            <br />
            <span className="text-clay">{t("cta.h2.line2")}</span>
          </h2>
          <p className="max-w-lg text-base leading-relaxed text-paper/70">
            {t("cta.body")}
          </p>
          <ButtonLink
            href="https://github.com/IJus-dev/VALYRIA"
            target="_blank"
            size="lg"
            className="bg-paper text-dusk hover:bg-sand"
          >
            {t("cta.button")}
            <ArrowUpRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
