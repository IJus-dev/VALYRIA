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

/* ─── Equipe (substitua pelas informações reais) ───────────────────────── */
const equipe = [
  { nome: "Roberto Caparroz", papel: "", foto: "/equipe/Roberto.jpg", iniciais: "RC", cor: "bg-moss" },
  { nome: "Daniel Matos", papel: "", foto: "/equipe/Daniel.jpg", iniciais: "DM", cor: "bg-clay" },
  { nome: "Leonardo Caparroz", papel: "", foto: "/equipe/Leo.jpg", iniciais: "LC", cor: "bg-dusk" },
  { nome: "Gustavo Caparroz", papel: "", foto: "/equipe/Gustavo.jpg", iniciais: "GC", cor: "bg-moss", fotoOffset: "-20px" },
  { nome: "Pedro Sola", papel: "", foto: "/equipe/Pedro.jpg", iniciais: "PS", cor: "bg-clay" },
  { nome: "Renzo", papel: "", foto: "/equipe/Renzo.jpg", iniciais: "RZ", cor: "bg-dusk" },
  { nome: "Marcos Vergueiro", papel: "", foto: "/equipe/Marcus.jpg", iniciais: "MV", cor: "bg-moss" },
];

/* ─── Problemas ─────────────────────────────────────────────────────────── */
const problemas = [
  {
    titulo: "Intermediação cara",
    descricao:
      "Cooperativa, trading, corretora, banco. Cada um come um pedaço. O produtor que plantou a soja recebe menos, o comprador que precisa dela paga mais. A margem desaparece no caminho.",
  },
  {
    titulo: "Mercado fechado",
    descricao:
      "Um produtor no interior do Mato Grosso vende pra quem aparece na porta. Sem acesso a compradores de SP, MG, exportadores. A liquidez morre na região e o preço é o que der.",
  },
  {
    titulo: "Zero transparência",
    descricao:
      "Comprador não vê laudo, não vê foto do campo, não sabe a produtividade real. Produtor não sabe quem quer comprar nem a que preço. Os dois operam no escuro.",
  },
];

/* ─── Etapas ────────────────────────────────────────────────────────────── */
const etapas = [
  {
    titulo: "Onboarding e KYC",
    descricao:
      "Produtor faz reconhecimento facial, envia documento e comprova propriedade ou arrendamento da terra. Recebe credenciais on-chain que liberam a plataforma.",
  },
  {
    titulo: "Documentação do lote",
    descricao:
      "Registra commodity, quantidade em sacas, região com GPS, safra e grade de qualidade. Envia laudos técnicos, fotos geolocalizadas e histórico de produtividade. Trava no mínimo 10% do valor em VEX como garantia.",
  },
  {
    titulo: "Emissão do token",
    descricao:
      "A plataforma verifica a documentação e emite um token semi-fungível que representa aquele lote. O token vai pro book de ofertas com preço, prazo de vencimento e todos os dados do produtor.",
  },
  {
    titulo: "Negociação no mercado",
    descricao:
      "Comprador navega por commodity, preço, prazo e reputação do produtor. Aceita o preço listado ou propõe bid. Pode revender o token no mercado secundário a qualquer momento antes do vencimento.",
  },
  {
    titulo: "Liquidação e entrega",
    descricao:
      "No vencimento, quem tem o token abre um redeem. Escrow bilateral trava tokens e valores. Produtor entrega, comprador confirma. Token é queimado, valores liberados. Deu problema? DAO arbitra.",
  },
];

/* ─── Métricas ──────────────────────────────────────────────────────────── */
const metricas = [
  { valor: "$8 tri", rotulo: "Mercado global do agro" },
  { valor: "3–5s", rotulo: "Liquidação no XRPL" },
  { valor: "$150 bi", rotulo: "Derivativos agrícolas na B3" },
  { valor: "2026", rotulo: "Programa UDAX" },
];

/* ─── Ativos ────────────────────────────────────────────────────────────── */
const ativos = [
  {
    icon: WalletCards,
    titulo: "VEX",
    descricao:
      "Utility token do protocolo. Produtor trava como garantia (mínimo 10% do lote), comprador paga taxa de transação, holder faz staking e vota na DAO. Emissão e queima dinâmicas mantêm o preço estável.",
  },
  {
    icon: Layers3,
    titulo: "Série",
    descricao:
      "Token semi-fungível que representa um lote de commodity. Carrega produto, região, safra, grade e prazo de vencimento. Pode ser negociado no DEX nativo do XRPL ou trocado por tokens de outras commodities via AMM.",
  },
  {
    icon: FileCheck2,
    titulo: "Proof",
    descricao:
      "NFT que ancora toda a documentação do lote: laudo técnico, fotos geolocalizadas, registro de plantio, coordenadas GPS, histórico de produtividade. Armazenado em IPFS. Verificável por qualquer comprador.",
  },
  {
    icon: MapPinned,
    titulo: "Redeem",
    descricao:
      "O mecanismo de entrega física. Comprador abre um pedido, escrow bilateral trava tokens e valores, produtor entrega com rastreio, comprador confirma recebimento. Token queimado, pagamento liberado.",
  },
];

/* ─── Commodities ───────────────────────────────────────────────────────── */
const commodities = [
  "Milho", "Soja", "Arroz", "Feijão", "Trigo", "Café", "Açúcar", "Algodão", "e outras",
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pb-section pt-24 sm:pt-32">
        {/* Imagem no canto direito */}
        <div className="hero-image-wrapper" aria-hidden="true">
          <img src="/hero-campo.png" alt="" className="hero-image" />
        </div>

        <div className="section-inner relative">
          <div className="hero-stagger max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>XRPL-native</Badge>
              <Badge variant="outline">UDAX 2026</Badge>
            </div>

            <h1 className="mt-10 font-display text-5xl leading-none tracking-tight text-dusk sm:text-6xl lg:text-7xl">
              Safra vira ativo.
              <br />
              <span className="text-clay">Ativo vira mercado.</span>
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-relaxed text-dusk/70">
              Produtor de soja no Mato Grosso documenta o lote, trava garantia
              em VEX e lista no mercado. Comprador em São Paulo vê laudo,
              foto do campo, preço e prazo. Compra direto no XRPL, sem
              cooperativa, sem trading, sem corretora. No vencimento, pede
              entrega e recebe o produto de verdade.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="#problema" size="lg">
                Entender o protocolo
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="#como-funciona" variant="ghost" size="lg">
                Como funciona
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* ── Parceiros ── */}
      <section className="border-y border-line/30">
        <div className="section-inner flex flex-wrap items-center justify-center gap-10 py-5 sm:gap-16">
          {["XRPL Ledger", "Ripple", "FGV", "UDAX 2026"].map((p) => (
            <span
              key={p}
              className="text-xs font-semibold uppercase tracking-brand text-line"
            >
              {p}
            </span>
          ))}
        </div>
      </section>

      {/* ── O problema ── */}
      <section id="problema" className="section-inner py-section">
        <SectionHeading
          eyebrow="O problema"
          heading="O agro movimenta $8 trilhões por ano. O pequeno produtor fica de fora."
        />
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {problemas.map((p, i) => (
            <div key={p.titulo} className="rv border-t-2 border-clay/30 pt-6">
              <span className="font-display text-5xl text-line/30">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-xl font-semibold text-dusk">
                {p.titulo}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-dusk/70">
                {p.descricao}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Statement ── */}
      <section className="section-inner pb-section">
        <div className="rv-border border-l-2 border-moss/40 pl-6 sm:pl-10">
          <p className="max-w-4xl font-display text-3xl leading-snug tracking-tight text-dusk sm:text-4xl">
            A VALYRIA tokeniza safras futuras no XRPL. O produtor emite um
            contrato com laudo técnico, GPS, fotos e histórico de produtividade.
            O comprador analisa tudo on-chain antes de entrar. O preço é
            descoberto pelo mercado — book de ofertas, AMM com oráculos de
            preço em tempo real, liquidação em segundos. No vencimento, o
            contrato vira entrega física rastreada. Deu disputa? A DAO resolve.
          </p>
        </div>
      </section>

      {/* ── Commodities (removido) ── */}

      {/* ── Métricas (dark) ── */}
      <section className="bg-dusk">
        <div className="section-inner grid grid-cols-2 py-16 sm:grid-cols-4 sm:py-20">
          {metricas.map((m, i) => (
            <div
              key={m.rotulo}
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

      {/* ── Como funciona ── */}
      <section id="como-funciona" className="section-inner py-section">
        <SectionHeading
          eyebrow="Como funciona"
          heading="Do campo ao contrato, do contrato à entrega física."
        />

        {/* ── Pipeline visual ── */}
        <div className="mt-14">
          {/* Desktop: horizontal */}
          <div className="hidden lg:block">
            <div className="flex items-start">
              {[
                { icon: UserCheck, titulo: "Onboarding", cor: "bg-moss", descricao: "KYC facial, documentos, comprovação de terra" },
                { icon: ScrollText, titulo: "Documentação", cor: "bg-clay", descricao: "Laudo, GPS, fotos, histórico + garantia em VEX" },
                { icon: Layers3, titulo: "Token emitido", cor: "bg-moss", descricao: "Token semi-fungível no book de ofertas do XRPL" },
                { icon: BarChart3, titulo: "Mercado", cor: "bg-clay", descricao: "Book de ofertas, AMM, oráculos de preço em tempo real" },
                { icon: Truck, titulo: "Entrega", cor: "bg-moss", descricao: "Redeem, escrow bilateral, token queimado" },
              ].map((step, i, arr) => (
                <div key={step.titulo} className="rv flex flex-1 flex-col items-center text-center">
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

          {/* Mobile: timeline vertical */}
          <div className="lg:hidden">
            <div className="relative border-l-2 border-line/25 pl-8">
              {[
                { icon: UserCheck, titulo: "Onboarding", cor: "bg-moss", descricao: "KYC facial, documentos, comprovação de terra" },
                { icon: ScrollText, titulo: "Documentação", cor: "bg-clay", descricao: "Laudo, GPS, fotos, histórico + garantia em VEX" },
                { icon: Layers3, titulo: "Token emitido", cor: "bg-moss", descricao: "Token semi-fungível no book de ofertas do XRPL" },
                { icon: BarChart3, titulo: "Mercado", cor: "bg-clay", descricao: "Book de ofertas, AMM, oráculos de preço em tempo real" },
                { icon: Truck, titulo: "Entrega", cor: "bg-moss", descricao: "Redeem, escrow bilateral, token queimado" },
              ].map((step) => (
                <div key={step.titulo} className="rv relative mb-8 last:mb-0">
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

        {/* ── Duas perspectivas ── */}
        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <Card tone="soft" className="rv p-6">
            <div className="flex items-center gap-3">
              <Tractor className="h-5 w-5 text-moss" />
              <h3 className="font-semibold text-dusk">O que o produtor faz</h3>
            </div>
            <ol className="mt-5 flex flex-col gap-3 text-sm leading-relaxed text-dusk/70">
              <li className="flex gap-3"><span className="shrink-0 font-display text-lg text-moss">1</span>Cadastra com reconhecimento facial e documentação</li>
              <li className="flex gap-3"><span className="shrink-0 font-display text-lg text-moss">2</span>Envia provas de safra: laudos, GPS, fotos, histórico</li>
              <li className="flex gap-3"><span className="shrink-0 font-display text-lg text-moss">3</span>Adquire VEX e trava mínimo 10% como garantia</li>
              <li className="flex gap-3"><span className="shrink-0 font-display text-lg text-moss">4</span>Cria oferta: commodity, quantidade, preço, prazo</li>
              <li className="flex gap-3"><span className="shrink-0 font-display text-lg text-moss">5</span>Token semi-fungível é emitido automaticamente</li>
              <li className="flex gap-3"><span className="shrink-0 font-display text-lg text-moss">6</span>Acompanha ordens e recebe propostas no book</li>
            </ol>
          </Card>

          <Card tone="soft" className="rv p-6">
            <div className="flex items-center gap-3">
              <WalletCards className="h-5 w-5 text-clay" />
              <h3 className="font-semibold text-dusk">O que o comprador faz</h3>
            </div>
            <ol className="mt-5 flex flex-col gap-3 text-sm leading-relaxed text-dusk/70">
              <li className="flex gap-3"><span className="shrink-0 font-display text-lg text-clay">1</span>Cadastra e adquire VEX pra operar</li>
              <li className="flex gap-3"><span className="shrink-0 font-display text-lg text-clay">2</span>Navega o book por commodity, preço, prazo e reputação</li>
              <li className="flex gap-3"><span className="shrink-0 font-display text-lg text-clay">3</span>Aceita o preço listado ou propõe bid</li>
              <li className="flex gap-3"><span className="shrink-0 font-display text-lg text-clay">4</span>Segura o token até o vencimento ou revende no secundário</li>
              <li className="flex gap-3"><span className="shrink-0 font-display text-lg text-clay">5</span>No vencimento, pede entrega e confirma recebimento</li>
            </ol>
          </Card>
        </div>
      </section>

      {/* ── Ciclo de liquidação (dark) ── */}
      <section className="bg-dusk">
        <div className="section-inner py-16">
          <SectionHeading
            eyebrow="Liquidação"
            heading="O que acontece no vencimento."
            tone="inverse"
          />
          <div className="mt-10">
            {/* Desktop: horizontal */}
            <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-2">
              {[
                { icon: ShieldCheck, label: "Acordo fechado" },
                { icon: WalletCards, label: "Escrow bilateral" },
                { icon: Truck, label: "Entrega física" },
                { icon: FileCheck2, label: "Confirmação" },
                { icon: Flame, label: "Token queimado" },
                { icon: MapPinned, label: "Pagamento liberado" },
              ].map((step, i, arr) => (
                <div key={step.label} className="rv flex items-center gap-2">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-paper/20 bg-paper/10">
                      <step.icon className="h-4 w-4 text-paper" />
                    </div>
                    <span className="max-w-20 text-center text-xs text-paper/70">{step.label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <ArrowRight className="h-5 w-5 shrink-0 text-paper/40" />
                  )}
                </div>
              ))}
            </div>
            {/* Mobile: vertical */}
            <div className="flex flex-col gap-4 sm:hidden">
              {[
                { icon: ShieldCheck, label: "Acordo fechado" },
                { icon: WalletCards, label: "Escrow bilateral" },
                { icon: Truck, label: "Entrega física" },
                { icon: FileCheck2, label: "Confirmação" },
                { icon: Flame, label: "Token queimado" },
                { icon: MapPinned, label: "Pagamento liberado" },
              ].map((step) => (
                <div key={step.label} className="rv flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-paper/20 bg-paper/10">
                    <step.icon className="h-4 w-4 text-paper" />
                  </div>
                  <span className="text-sm text-paper/70">{step.label}</span>
                </div>
              ))}
            </div>
            {/* Disputa */}
            <div className="rv mt-8 flex items-center gap-3 rounded-tile border border-paper/10 bg-paper/5 px-5 py-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-clay" />
              <p className="text-sm text-paper/70">
                Deu problema na entrega? O mecanismo de <span className="font-semibold text-paper">governança DAO</span> é acionado. Holders de VEX em staking votam na resolução. Penalização via slashing proporcional ao stake do infrator.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ativos ── */}
      <section id="ativos" className="section-inner py-section">
        <SectionHeading
          eyebrow="Ativos do protocolo"
          heading="Os quatro ativos do protocolo e o que cada um faz."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ativos.map((a) => (
            <Card
              key={a.titulo}
              tone="soft"
              className="rv p-6 transition duration-300 ease-fluent hover:-translate-y-1 hover:shadow-hero"
            >
              <a.icon className="h-5 w-5 text-clay" />
              <div className="mt-5 font-display text-3xl text-dusk">
                {a.titulo}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-dusk/70">
                {a.descricao}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Para quem (dark) ── */}
      <section className="bg-dusk">
        <div className="section-inner py-section">
          <SectionHeading
            eyebrow="Para quem"
            heading="Três perfis operam na VALYRIA."
            tone="inverse"
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: Tractor,
                titulo: "Produtores",
                descricao:
                  "Médio e pequeno produtor que hoje não tem acesso a hedge nem comercialização antecipada. Documenta o lote com laudos e GPS, trava garantia em VEX e vende pra compradores de qualquer lugar do país.",
              },
              {
                icon: WalletCards,
                titulo: "Compradores e investidores",
                descricao:
                  "Analisa laudo técnico, fotos geolocalizadas, histórico do produtor e preço em tempo real. Compra o token e segura até a entrega ou revende no mercado secundário quando quiser.",
              },
              {
                icon: ShieldCheck,
                titulo: "Provedores de liquidez",
                descricao:
                  "Deposita pares de tokens nos pools do AMM (ex: VEX/MLH) e recebe taxas proporcionais de cada transação. O AMM garante contraparte mesmo em mercados com volume baixo.",
              },
            ].map((p) => (
              <div
                key={p.titulo}
                className="rv rounded-tile border border-paper/15 bg-paper/10 p-6 transition duration-300 ease-fluent hover:bg-paper/15"
              >
                <p.icon className="h-5 w-5 text-paper" />
                <h3 className="mt-4 font-display text-2xl text-paper">
                  {p.titulo}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-paper/70">
                  {p.descricao}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Equipe ── */}
      <section className="section-inner py-section">
        <SectionHeading
          eyebrow="Equipe"
          heading="Quem constrói a VALYRIA."
        />
        <div className="mt-14 flex flex-col gap-12">
          {/* Roberto + Daniel */}
          <div className="flex justify-center gap-8 sm:gap-12">
            {equipe.slice(0, 2).map((m) => (
              <div key={m.nome} className="rv flex flex-col items-center gap-4">
                <img
                  src={m.foto}
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
          {/* Leonardo + Gustavo + Pedro */}
          <div className="flex justify-center gap-8 sm:gap-12">
            {equipe.slice(2, 5).map((m) => (
              <div key={m.nome} className="rv flex flex-col items-center gap-4">
                <img
                  src={m.foto}
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
          {/* Renzo + Marcos */}
          <div className="flex justify-center gap-8 sm:gap-12">
            {equipe.slice(5, 7).map((m) => (
              <div key={m.nome} className="rv flex flex-col items-center gap-4">
                <img
                  src={m.foto}
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
        </div>
      </section>

      {/* ── UDAX 2026 ── */}
      <section className="border-y border-line/30">
        <div className="section-inner py-section">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <SectionHeading
                eyebrow="Programa"
                heading="Participantes do UDAX 2026."
                description="O UDAX é o acelerador da Ripple pra startups que constroem no XRPL. A edição 2026 é com a FGV: oito semanas de mentoria com engenheiros da Ripple, professores da FGV e acesso a investidores focados em ativos digitais. Encerra com Demo Day no escritório da Ripple em São Paulo."
              />
              <a
                href="https://udax-fgv.notion.site/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-moss transition hover:text-clay"
              >
                Detalhes do programa
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Ripple", text: "Mentoria técnica com quem construiu o XRPL." },
                { label: "FGV", text: "Programa estruturado e rede acadêmica da FGV Digital Finance." },
                { label: "Demo Day", text: "Pitch pra investidores na Ripple SP. Junho 2026." },
                { label: "VC Network", text: "Acesso direto a fundos que investem em XRPL." },
              ].map((c) => (
                <Card
                  key={c.label}
                  tone="soft"
                  className="rv p-5 transition duration-300 ease-fluent hover:-translate-y-1 hover:shadow-hero"
                >
                  <span className="label-caps">{c.label}</span>
                  <p className="mt-3 text-sm leading-relaxed text-dusk/70">
                    {c.text}
                  </p>
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
            O mercado agrícola vai mudar.
            <br />
            <span className="text-clay">A questão é quando.</span>
          </h2>
          <p className="max-w-lg text-base leading-relaxed text-paper/70">
            A VALYRIA está em construção no programa UDAX 2026 com mentoria
            da Ripple e da FGV. Demo Day em junho no escritório da Ripple em SP.
          </p>
          <ButtonLink
            href="https://github.com/IJus-dev/VALYRIA"
            target="_blank"
            size="lg"
            className="bg-paper text-dusk hover:bg-sand"
          >
            Documentação
            <ArrowUpRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
