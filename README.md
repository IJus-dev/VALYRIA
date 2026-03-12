# VALYRIA

Plataforma descentralizada construida sobre o XRP Ledger (XRPL) que permite a tokenizacao e negociacao de derivativos de commodities agricolas, conectando produtores, compradores e investidores em um marketplace digital onde contratos tokenizados representando entregas futuras de commodities podem ser emitidos e negociados.

A VALYRIA conecta produtores rurais, compradores e investidores em um marketplace transparente onde a producao agricola — milho, soja, cafe, acucar, arroz, feijao, algodao e outras commodities — pode ser tokenizada e negociada antes da colheita por meio de tokens semi-fungiveis representando contratos de entrega futura. Utilizando a liquidacao rapida e os baixos custos de transacao da infraestrutura do XRP Ledger, a plataforma permite que produtores acessem mecanismos de hedge e comercializacao antecipada, enquanto investidores e compradores negociam contratos tokenizados em um mercado secundario liquido.

O ecossistema e alimentado pelo token utilitario VEX (Valyria Exchange), utilizado para acesso a plataforma, colateral de transacoes, participacao em governanca e provisao de liquidez. Market makers automatizados (AMM nativo XRPL), oraculos de preco em tempo real, liquidacao baseada em escrow on-chain e governanca DAO garantem negociacao segura, descoberta de precos e resolucao de disputas dentro de uma infraestrutura financeira descentralizada projetada especificamente para o mercado de commodities agricolas.

A plataforma cobre o ciclo completo: onboarding de produtores rurais, colateral em VEX (bond via escrow), emissao de series tokenizadas, mercado DEX/AMM nativo, resgate com entrega fisica, rastreabilidade via proof NFTs, disputas com penalizacao on-chain e auditoria.

---

## Indice

- [Modelo de ativos](#modelo-de-ativos)
- [Arquitetura](#arquitetura)
- [Stack](#stack)
- [Monorepo](#monorepo)
- [Pre-requisitos](#pre-requisitos)
- [Setup](#setup)
- [Comandos](#comandos)
- [Variaveis de ambiente](#variaveis-de-ambiente)
- [API](#api)
- [Frontend](#frontend)
- [Domain](#domain)
- [XRPL](#xrpl)
- [Database](#database)
- [Design system](#design-system)
- [Seguranca](#seguranca)
- [O que ja foi provado em testnet](#o-que-ja-foi-provado-em-testnet)
- [Roadmap](#roadmap)

---

## Modelo de ativos

A plataforma opera com quatro tipos de ativo:

**VEX** -- Issued currency no XRPL emitido pelo cold issuer da Valyria. Funciona como colateral e moeda de liquidacao interna. Produtores depositam VEX como bond antes de listar ofertas.

**Series Token** -- Cada oferta agricola gera um currency code unico no XRPL (20 bytes, prefixo `0x56`). O alias segue o formato `COMMODITY.REGION.YEAR.CYCLE.GRADE.LOTUNIT.SEQUENCE` -- por exemplo `MLH.MT.2026.Q3.G1.01.0001`. A serie e negociada no DEX do XRPL via `OfferCreate`.

**Proof NFT** -- Artefatos de prova (laudo de underwriting, documento rural, geofoto, comprovante de entrega) sao mintados como NFTs no XRPL via `NFTokenMint`. Cada proof carrega hash SHA-256 do manifesto, CID IPFS e metadados da serie vinculada.

**Bond** -- Deposito em VEX travado via `EscrowCreate` no XRPL. O valor fica on-chain ate o `FinishAfter` (default 90 dias). `EscrowFinish` libera o bond; `EscrowCancel` confisca. Slash parcial faz EscrowFinish total + redistribuicao. Garante a oferta do produtor. Minimo de 10% do notional.

---

## Arquitetura

Baseada no modelo C4 (Context, Container, Component).

### C1 — Contexto

```
                            +-------------------------+
                            |   Ofertante / Produtor   |
                            | cadastro, provas, oferta |
                            +------------+------------+
                                         |
                                         v
+------------------+          +---------------------+          +------------------+
| Provedor KYC/AML | <-----  |                     |  ------> | Oraculos de Preco|
| verif. facial/doc|          |   VALYRIA Platform   |          | commodities      |
+------------------+          |                     |          +------------------+
                              +-----+------+--------+
+------------------+          |     |      |        |          +------------------+
| IPFS / Arweave   | <-------+     |      |        +--------> | API Logistica    |
| docs, metadados  |               |      |                   | tracking/entrega |
+------------------+               v      v                   +------------------+
                  +-----------+   +--------+-------+
                  | Comprador |   |      XRPL      |
                  | Investidor|   | token, escrow,  |
                  | bid/compra|   | AMM, governance |
                  +-----------+   +----------------+
```

Atores: produtor rural (oferta) e comprador/investidor (demanda). Sistemas externos: KYC, oraculos, IPFS e logistica.

### C2 — Container

```
+-----------------------------------------------------------------------+
|                            VALYRIA                                     |
|                                                                        |
|  +-----------+  +-------------+       +-----------+  +-----------+     |
|  | Mobile App|  |   Web App   | :3000 | Realtime  |  | Backend   |     |
|  | (futuro)  |  | Next.js 14  |------>| Gateway   |  | API       | :4000
|  +-----------+  | App Router  |       | WebSocket |  | Fastify   |     |
|                 +------+------+       +-----+-----+  +-----+-----+     |
|                        |                    |              |           |
|                 proxy /api/backoffice/*      |              |           |
|                        |                    |              |           |
|                        +----------+---------+--------------+           |
|                                   |         |              |           |
|                            +------v--+  +---v----+  +------v------+   |
|                            |PostgreSQL|  | Redis  |  |XRPL Testnet|   |
|                            | Prisma   |  | Cache  |  | xrpl.js    |   |
|                            +---------+  +--------+  +------------+   |
+-----------------------------------------------------------------------+
                                   |              |              |
                          +--------v---+  +-------v----+  +-----v------+
                          |Provedor KYC|  |  Oraculos  |  |IPFS/Logist.|
                          +------------+  +------------+  +------------+
```

O frontend nao chama a API direto do browser — proxy server-side injeta headers internos.

### C3 — Componente (Backend)

```
+------------------------------------------------------------------+
|                       API / BFF (Fastify)                          |
+------+------+------+-------+------+-------+------+------+-------+
       |      |      |       |      |       |      |      |
       v      v      v       v      v       v      v      v
 +--------+ +-----+ +------+ +---+ +------+ +----+ +---+ +-----+
 |Identity| |Bond | |Market| |AMM| |Redeem| |Disp| |Gov| |Proof|
 |& Compli| |Serv.| |Serv. | |Srv| |Serv. | |Srv.| |Srv| |Serv.|
 +---+----+ +--+--+ +--+---+ +-+-+ +--+---+ +-+--+ +-+-+ +--+--+
     |         |        |      |       |       |      |       |
     v         v        v      v       v       v      v       v
 +-------+ +-------+ +------+ +------+ +--------+ +--------+
 |KYC    | |XRPL   | |Oracle| |Storag| |Logistic| |Realtime|
 |Adapter| |Adapter | |Adapt.| |Adapt.| |Adapter | |Publish.|
 +-------+ +---+---+ +--+---+ +--+---+ +--------+ +---+----+
               |         |       |                      |
               v         v       v                      v
           +------+  +------+ +------+              +------+
           | XRPL |  |Oracles| |Postgr|             | Redis|
           +------+  +------+ +------+              +------+
```

Cada service segue o padrao: domain valida (state machine) → gateway submete (XRPL) → repository persiste → audit log registra → EventBus notifica.

### Implementacao vs. Diagrama

A comunicacao com o XRPL Ledger passa por uma interface `XrplGateway` com duas implementacoes:

- `MockXrplGateway` — retorna recibos falsos, para dev local sem precisar de testnet
- `RealXrplGateway` — conecta ao XRPL Testnet via xrpl.js e submete transacoes reais

Alternado pela env `XRPL_MODE` (`mock` ou `real`).

Persistencia segue o mesmo padrao dual:

- `InMemoryPlatformRepository` — dados em Map, para rodar sem banco
- `PrismaPlatformRepository` — PostgreSQL via Prisma

Controlado pela env `PERSISTENCE_DRIVER` (`memory` ou `prisma`).

> **Nota:** O diagrama C4 original menciona "Smart Contracts" (VEXToken, CommodityFactory, OrderBook, AMM, Governance, Slashing). No XRPL essas funcionalidades sao **features nativas do protocolo** — nao smart contracts. Escrow, AMM (XLS-30d), Credentials, Oracle, DEX sao configurados via transacoes usando `xrpl.js`. Nao ha Solidity/Rust.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router), TanStack Query, TanStack Table, Recharts, Zustand, react-hook-form, Zod |
| Backend | Fastify 5, Zod, xrpl.js 4.6, ripple-keypairs |
| Auth | next-auth v5 beta (JWT + Email OTP + XRPL Wallet) |
| Database | PostgreSQL 16, Prisma ORM |
| Cache | Redis 7 (com fallback in-memory via ioredis) |
| Ledger | XRPL Testnet |
| Monorepo | pnpm 10 workspaces |
| Runtime | Node.js 20+, TypeScript 5.7 |
| UI | Tailwind CSS 3.4, Lucide React, Sonner (toasts) |

---

## Monorepo

```
valyria-platform/
  apps/
    api/             Fastify REST + WebSocket API (:4000)
    web/             Next.js 14 App Router (:3000)
    landing/         Landing page estatica
  packages/
    domain/          Entidades puras e state machines (sem I/O)
    xrpl/            Intent builders e transaction guard
    database/        Prisma client wrapper + singleton
    cache/           KeyValueStore com Redis e in-memory
  prisma/
    schema.prisma    Schema do banco
    seed.ts          Dados de demonstracao
  scripts/
    lint-design-system.mjs
  docker-compose.yml
```

### packages/domain

Camada de dominio pura, sem dependencia de I/O. Exporta tipos, funcoes de transicao de estado e fabricas:

| Modulo | Entidade | Estados |
|---|---|---|
| `identity` | User | registered, email_verified, wallet_linked, kyc_pending, kyc_approved, kyc_rejected, producer_approved, suspended |
| `bond` | Bond | pending, locked, frozen, partially_slashed, released, forfeited |
| `offer` | Offer | draft, listed, partially_filled, filled, redeem_requested, settled, cancelled |
| `redeem` | Redeem | requested, tracking_pending, in_delivery, delivered, accepted, disputed, closed |
| `dispute` | Dispute | opened, under_review, escalated, resolved, rejected |
| `credential` | Credential | created, accepted, revoked, expired |
| `proposal` | Proposal | draft, active, review, approved, rejected, archived |
| `amm` | AmmPool | AMM nativo XRPL (XLS-30d) com `AMMCreate`, `AMMDeposit`, `AMMWithdraw` |
| `fees` | FeeRecord | listing (0.05%), transaction (0.1%), settlement (0.15%) |
| `oracle` | OraclePrice | Symbol BASE/QUOTE, FNV-1a document ID |
| `proof` | ProofArtifact | underwriting_report, farm_document, geo_photo, delivery_receipt, dispute_evidence |
| `series` | Series | Alias builder + currency code encoder (20-byte hex) |

Cada state machine expoe `transitionXState(current, event)` que retorna o proximo estado ou lanca `InvalidStateTransitionError`.

Erros tipados: `NotFoundError` (404), `ValidationError` (422), `AuthorizationError` (403), `ConflictError` (409), `InsufficientFundsError` (422), `InvalidStateTransitionError` (422), `XrplSubmissionError` (502).

### packages/xrpl

Builders de intent para transacoes XRPL. Cada builder recebe parametros, roda preflight checks e retorna um objeto tipado. O gateway consome os intents e submete ao ledger.

Intents disponiveis: `BondDeposit`, `BondEscrowCreate`, `BondEscrowFinish`, `BondEscrowCancel`, `CredentialCreate`, `CredentialAccept`, `OracleSet`, `SeriesOffer`, `SeriesBuy`, `SeriesRedeem`, `RedeemEscrowCreate`, `RedeemEscrowFinish`, `RedeemEscrowCancel`, `ProofNftMint`, `AmmCreate`, `AmmDeposit`, `AmmWithdraw`.

Transacoes XRPL: `Payment`, `EscrowCreate`, `EscrowFinish`, `EscrowCancel`, `CredentialCreate`, `CredentialAccept`, `OracleSet`, `OfferCreate`, `TrustSet`, `NFTokenMint`, `AMMCreate`, `AMMDeposit`, `AMMWithdraw`.

Inclui `transaction-guard.ts` com `getTransactionResult()` e `assertTesSuccess()` para validar respostas, e `xrpl-result-classifier.ts` que classifica result codes em `success`, `retryable` ou `terminal`.

### packages/cache

Abstracao `KeyValueStore` com `get`, `set`, `del`, `incr`. Duas implementacoes: `InMemoryKeyValueStore` (Map com TTL) e `RedisKeyValueStore` (ioredis). Factory `createKeyValueStore(redisUrl?)` seleciona automaticamente.

### packages/database

Wrapper do Prisma client. Re-exporta `PrismaClient` e uma instancia singleton `prisma`. Client gerado em `packages/database/generated/client/`.

---

## Pre-requisitos

- Node.js 20+
- pnpm 10+
- Docker e Docker Compose (para PostgreSQL e Redis)

---

## Setup

```bash
# 1. Clonar e instalar
git clone <repo-url> && cd valyria-platform
pnpm install

# 2. Copiar envs de exemplo
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local

# 3. Subir PostgreSQL e Redis
docker compose up -d

# 4. Gerar Prisma client, push do schema e seed
pnpm db:generate
pnpm db:push
pnpm db:seed

# 5. (Opcional) Bootstrap das contas XRPL Testnet
pnpm xrpl:bootstrap:testnet

# 6. Iniciar tudo
pnpm dev
```

API em `http://localhost:4000`, frontend em `http://localhost:3000`.

---

## Comandos

| Comando | Descricao |
|---|---|
| `pnpm install` | Instala dependencias do monorepo |
| `pnpm dev` | Inicia API e frontend em paralelo |
| `pnpm dev:api` | Inicia apenas o Fastify |
| `pnpm dev:web` | Inicia apenas o Next.js |
| `pnpm build` | Build de todos os packages |
| `pnpm typecheck` | Typecheck de todos os packages |
| `pnpm test` | Roda todos os testes (vitest) |
| `pnpm test:watch` | Testes em modo watch |
| `pnpm lint:design` | Lint do design system (proibe hex, rgb, px crus em componentes) |
| `pnpm db:generate` | Gera o Prisma client (roda automaticamente no postinstall) |
| `pnpm db:push` | Aplica schema no banco |
| `pnpm db:seed` | Popula com dados demo |
| `pnpm xrpl:bootstrap:testnet` | Configura contas XRPL Testnet (trustlines, VEX, DepositAuth) |

---

## Variaveis de ambiente

Tres arquivos `.env` sao necessarios: `.env` (raiz), `apps/api/.env`, `apps/web/.env.local`. Ver `.env.example` de cada um.

### Principais toggles

| Variavel | Valores | Default | Descricao |
|---|---|---|---|
| `XRPL_MODE` | `mock`, `real` | `mock` | Mock retorna recibos falsos. Real conecta ao Testnet. |
| `PERSISTENCE_DRIVER` | `memory`, `prisma` | `memory` | Memory usa Maps. Prisma usa PostgreSQL. |

### Infraestrutura

| Variavel | Exemplo |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/valyria?schema=public` |
| `REDIS_URL` | `redis://localhost:6379` |
| `AUTH_SECRET` | String secreta para JWT |
| `NEXTAUTH_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` |
| `API_URL` | `http://localhost:4000` |
| `INTERNAL_API_TOKEN` | Token compartilhado entre web e API |
| `HOST` | `0.0.0.0` (API) |
| `PORT` | `4000` (API) |
| `CORS_ORIGIN` | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_SECONDS` | `60` |
| `RATE_LIMIT_MAX_REQUESTS` | `120` |

### Topologia XRPL

Sete wallets compoe a topologia de contas no ledger:

| Variavel | Wallet | Funcao |
|---|---|---|
| `XRPL_COLD_ISSUER` | Cold Issuer | Emissor do VEX e series tokens |
| `XRPL_TREASURY_WALLET` | Treasury | Reserva da plataforma |
| `XRPL_BOND_VAULT` | Bond Vault | Custodia de bonds (DepositAuth habilitado) |
| `XRPL_SETTLEMENT_WALLET` | Settlement | Liquidacao de resgates |
| `XRPL_HOT_API_WALLET` | Hot API | Wallet operacional da API |
| `XRPL_ORACLE_PUBLISHER` | Oracle Publisher | Publicador de precos via OracleSet |
| `XRPL_KYC_ISSUER` | KYC Issuer | Emissor de credenciais KYC/Producer |

No modo `real`, as seeds correspondentes (`XRPL_*_SEED`) devem ser preenchidas com contas fundadas na Testnet.

---

## API

Fastify na porta 4000. Rotas prefixadas com `/api/` exceto health. Validacao de entrada via Zod. Error handler centralizado: `DomainError` retorna o `httpStatus` correto, `ZodError` retorna 400, erros desconhecidos retornam 500.

### Endpoints completos

**Infraestrutura**

| Metodo | Rota | Descricao | Auth |
|---|---|---|---|
| `GET` | `/health` | Status do servico + topologia + rede XRPL | Nenhum |
| `WS` | `/api/market/stream` | Stream de mercado event-driven (EventBus push) | Token |

**Onboarding** (prefixo `/api/onboarding`)

| Metodo | Rota | Descricao | Roles | StepUp |
|---|---|---|---|---|
| `GET` | `/users` | Lista usuarios | admin, compliance, support, read_only | -- |
| `POST` | `/users` | Cria usuario (email + nome) | admin, compliance | -- |
| `POST` | `/users/:userId/transition` | Avanca lifecycle (9 eventos) | admin, compliance, operations, support | Sim |

Eventos de transicao: `verify_email`, `link_wallet`, `submit_kyc`, `approve_kyc`, `reject_kyc`, `approve_producer`, `suspend`, `reinstate`.

**Auth** (prefixo `/api/auth`)

| Metodo | Rota | Descricao | Auth |
|---|---|---|---|
| `POST` | `/wallet-challenges` | Cria challenge para wallet linking | Authenticated actor |
| `POST` | `/wallet-verify` | Verifica assinatura da wallet | Authenticated actor |
| `GET` | `/me/credentials` | Lista credenciais proprias | Authenticated actor |
| `POST` | `/me/credentials/:credentialId/accept` | Aceita credencial on-chain | Authenticated actor |

**Credentials** (prefixo `/api/credentials`)

| Metodo | Rota | Descricao | Roles | StepUp |
|---|---|---|---|---|
| `GET` | `/` | Lista credenciais (filtro `?userId`) | Todos | -- |
| `POST` | `/preview` | Preview do intent CredentialCreate | admin, compliance | -- |
| `POST` | `/` | Emite credencial on-chain | admin, compliance | Sim |
| `POST` | `/:credentialId/accept` | Aceita credencial (admin/ops) | admin, compliance, operations | Sim |

Tipos: `KYCApproved`, `ProducerApproved`.

**Bonds** (prefixo `/api/bonds`)

| Metodo | Rota | Descricao | Roles | StepUp |
|---|---|---|---|---|
| `GET` | `/` | Lista bonds | Todos | -- |
| `POST` | `/preview` | Preview do intent BondDeposit | admin, operations | -- |
| `POST` | `/` | Cria bond (EscrowCreate ao bond vault) | admin, operations | Sim |
| `POST` | `/:bondId/release` | Libera bond (EscrowFinish) | admin, operations | Sim |
| `POST` | `/:bondId/forfeit` | Confisca bond (EscrowCancel) | admin, operations | Sim |
| `POST` | `/:bondId/transition` | Transicao do bond (6 eventos) | admin, operations | Sim |

Eventos: `confirm_deposit`, `freeze`, `restore_lock`, `slash_partial`, `release`, `forfeit`.

**Offers** (prefixo `/api/offers`)

| Metodo | Rota | Descricao | Roles | StepUp |
|---|---|---|---|---|
| `GET` | `/` | Lista ofertas | Publico | -- |
| `GET` | `/:offerId` | Detalhe da oferta | Publico | -- |
| `POST` | `/` | Cria oferta (OfferCreate no DEX) | admin, operations | Sim |
| `POST` | `/:offerId/buy` | Compra oferta (OfferCreate buyer) | admin, operations | Sim |
| `POST` | `/:offerId/redeem` | Abre resgate (Payment ao settlement) | admin, operations | Sim |

**Redeems** (prefixo `/api/redeems`)

| Metodo | Rota | Descricao | Roles | StepUp |
|---|---|---|---|---|
| `GET` | `/` | Lista resgates | Todos | -- |
| `GET` | `/:redeemId` | Detalhe do resgate | Todos | -- |
| `POST` | `/:redeemId/transition` | Transicao do resgate (6 eventos) | admin, operations, support | Sim |
| `WS` | `/stream` | WebSocket push de `redeem.state_changed` | Token |

Eventos: `attach_tracking`, `ship`, `confirm_delivery`, `accept`, `open_dispute`, `close`.

**Disputes** (prefixo `/api/disputes`)

| Metodo | Rota | Descricao | Roles | StepUp |
|---|---|---|---|---|
| `GET` | `/` | Lista disputas | Todos | -- |
| `POST` | `/` | Abre disputa (freeze do bond) | admin, operations, support | Sim |
| `POST` | `/:disputeId/transition` | Transicao (4 eventos) | admin, operations, support | Sim |
| `WS` | `/stream` | WebSocket push de `dispute.state_changed` | Token |

Eventos: `start_review`, `escalate`, `resolve`, `reject`. Resolucao aplica `bondDecision`: `restore_lock`, `slash_partial` (com `slashPercentage`) ou `forfeit`. Slash e forfeit executam `EscrowFinish`/`EscrowCancel` on-chain.

**Oracles** (prefixo `/api/oracles`)

| Metodo | Rota | Descricao | Roles | StepUp |
|---|---|---|---|---|
| `GET` | `/` | Lista precos (filtro `?symbol`) | admin, compliance, operations, read_only | -- |
| `POST` | `/preview` | Preview do intent OracleSet | admin, operations | -- |
| `POST` | `/` | Publica preco on-chain | admin, operations | Sim |
| `GET` | `/aggregate/:symbol` | Preco agregado (median, mean, trimmedSet) | admin, compliance, operations, read_only | -- |

**Proofs** (prefixo `/api/proofs`)

| Metodo | Rota | Descricao | Roles | StepUp |
|---|---|---|---|---|
| `GET` | `/` | Lista provas (filtro `?offerId`) | Todos | -- |
| `GET` | `/:proofId` | Detalhe da prova | Todos | -- |
| `POST` | `/` | Cria prova (opcionalmente minta NFT inline) | admin, compliance, operations | -- |
| `POST` | `/:proofId/mint` | Minta NFT no XRPL | admin, compliance, operations | Sim |
| `POST` | `/:proofId/upload` | Upload de arquivo (multipart, max 10MB) | admin, compliance, operations | -- |

Tipos de artefato: `underwriting_report`, `farm_document`, `geo_photo`, `delivery_receipt`, `dispute_evidence`.

**AMM** (prefixo `/api/amm`)

| Metodo | Rota | Descricao | Auth |
|---|---|---|---|
| `GET` | `/pools` | Lista pools | Publico |
| `POST` | `/pools` | Cria pool (AMMCreate on-chain) | admin, operations + stepUp |
| `POST` | `/pools/:poolId/deposit` | Deposita liquidez (AMMDeposit) | admin, operations + stepUp |
| `POST` | `/pools/:poolId/withdraw` | Retira liquidez (AMMWithdraw) | admin, operations + stepUp |
| `POST` | `/quote` | Cotacao de swap | Publico |
| `POST` | `/swap` | Executa swap | admin, operations + stepUp |

**Market** (prefixo `/api/market`)

| Metodo | Rota | Descricao | Auth |
|---|---|---|---|
| `GET` | `/summary` | Resumo (metricas, order book, price trend) | Publico |
| `WS` | `/stream` | WebSocket event-driven push (`offer.created`, `offer.filled`, `amm.swap`) | Token |

Formato do WebSocket (event-driven):
```json
{ "type": "offer.created", "payload": { "offerId": "...", "status": "listed" } }
{ "type": "offer.filled", "payload": { "offerId": "...", "buyerId": "..." } }
{ "type": "amm.swap", "payload": { "poolId": "...", "direction": "buy" } }
```

**Governance** (prefixo `/api/governance`)

| Metodo | Rota | Descricao | Roles | StepUp |
|---|---|---|---|---|
| `GET` | `/` | Lista propostas | Todos | -- |
| `GET` | `/:proposalId` | Detalhe da proposta | Todos | -- |
| `POST` | `/` | Cria proposta | admin, operations | Sim |
| `POST` | `/:proposalId/transition` | Transicao (5 eventos) | admin | Sim |
| `DELETE` | `/:proposalId` | Deleta proposta | admin | Sim |
| `WS` | `/stream` | WebSocket push de `governance.proposal_changed` | Token |

Eventos: `activate`, `submit_review`, `approve`, `reject`, `archive`.

**Audit** (prefixo `/api/audit`)

| Metodo | Rota | Descricao | Roles |
|---|---|---|---|
| `GET` | `/` | Lista audit logs (`?limit` max 200) | Todos |

**Fees** (prefixo `/api/fees`)

| Metodo | Rota | Descricao | Auth |
|---|---|---|---|
| `GET` | `/` | Lista fee records (`?entityType`, `?entityId`) | Publico |

### Services

| Servico | Responsabilidade |
|---|---|
| `OnboardingService` | Cria usuarios e dirige o lifecycle state machine |
| `WalletChallengeService` | Gera challenges (5min TTL, nonce), verifica assinaturas via `ripple-keypairs` |
| `CredentialService` | Emite e aceita credenciais on-chain (CredentialCreate + CredentialAccept) |
| `BondService` | Cria bonds via EscrowCreate, release via EscrowFinish, forfeit via EscrowCancel |
| `MarketService` | CRUD de ofertas, buy-side, monta MarketSummary, coleta fees |
| `RedeemService` | Lifecycle do resgate com escrow on-chain (EscrowCreate com FinishAfter) |
| `DisputeService` | Abre disputas (freeze bond), transiciona, aplica bond decisions on-chain |
| `OracleService` | Publica precos on-chain, preview de intents, consulta aggregated price |
| `ProofService` | Cria provas com SHA-256 manifest, upload de arquivos, mint NFT |
| `AmmService` | Pools XRPL nativos (AMMCreate/Deposit/Withdraw), cotacoes via `amm_info` RPC |
| `GovernanceService` | CRUD propostas com state machine, audit log, EventBus |
| `AuditService` | Leitura de audit logs |

---

## Frontend

Next.js 14 com App Router, `lang="pt-BR"`. Auth via next-auth v5 beta com JWT.

### Autenticacao

Duas formas de login:

**Email OTP** -- Usuario informa email, recebe codigo de 6 digitos, confirma e recebe sessao JWT. Na primeira entrada, o usuario e criado com estado `email_verified`.

**XRPL Wallet** -- Usuario informa endereco da wallet, a API gera um challenge (nonce + mensagem com TTL de 5 minutos), o usuario assina com a chave privada, a assinatura e verificada via `ripple-keypairs` (`verify` + `deriveAddress`). A wallet e vinculada e o estado avanca para `wallet_linked`.

O JWT e enriquecido a cada request com `state`, `walletAddress` e `roles` do banco. O middleware protege rotas verificando o cookie `authjs.session-token`.

### Paginas

| Rota | Descricao | Acesso |
|---|---|---|
| `/` | Landing page com modelo de ativos e fluxo operacional | Publico |
| `/login` | Login (Email OTP + XRPL Wallet) | Publico |
| `/market` | Marketplace com order book, filtros por commodity, AMM swap | Publico |
| `/dashboard` | Painel operacional (metricas, grafico de precos, order book) | Autenticado |
| `/onboarding` | Pipeline KYC (5 estagios, contadores, compliance console) | Autenticado |
| `/wallet` | Posicoes do usuario (ofertas, resgates, bonds, credenciais) | Autenticado |
| `/bond-vault` | Console de bonds + listagem de credenciais | Autenticado |
| `/offers/new` | Formulario de criacao de oferta (origination desk) | Autenticado |
| `/offers/[offerId]` | Detalhe da oferta + compra + resgate | Autenticado |
| `/redeems` | Entregas em andamento com transicao e escrow on-chain | Autenticado |
| `/disputes` | Workflow de disputas (3 tiers, trilha de auditoria) | Autenticado |
| `/proofs` | Registro de provas operacionais + formulario de criacao | Autenticado |
| `/proofs/[proofId]` | Detalhe da prova + mint NFT panel | Autenticado |
| `/oracles` | Feed de precos publicados + formulario de publicacao | Autenticado |
| `/analytics` | Volumes, feeds e risco por commodity | Autenticado |
| `/reputation` | Scores de reputacao com DataTable | Autenticado |
| `/governance` | Hub de propostas DAO | Autenticado |
| `/notifications` | Alertas recentes (audit + disputes + redeems) | Autenticado |
| `/admin/offers` | Tabela administrativa de ofertas | admin, operations |

### API Routes (Next.js)

O frontend tem suas proprias API routes alem do proxy:

| Rota | Descricao |
|---|---|
| `/api/auth/[...nextauth]` | Handler do next-auth |
| `/api/auth/request-otp` | Gera e envia OTP |
| `/api/auth/wallet-challenge` | Cria challenge (upsert user + proxy para API) |
| `/api/auth/wallet-verify` | Verifica assinatura (proxy para API) |
| `/api/backoffice/[...path]` | Catch-all proxy para API com headers internos |
| `/api/me/credentials` | Lista credenciais do usuario logado |
| `/api/me/credentials/[credentialId]/accept` | Aceita credencial propria |
| `/api/me/wallet-challenges` | Cria challenge para usuario logado |
| `/api/me/wallet-verify` | Verifica wallet do usuario logado |
| `/api/backoffice/governance/*` | Proxy para GovernanceService via API |
| `/api/reputation` | Computa e retorna scores |

### Commodities

8 commodities agricolas brasileiras:

| Codigo | Produto | Unidade | Accent |
|---|---|---|---|
| MLH | Milho | sacas de 60kg | clay |
| SOJ | Soja | sacas de 60kg | moss |
| ARZ | Arroz | sacas de 50kg | moss |
| CAF | Cafe | sacas de 60kg | clay |
| FEJ | Feijao | sacas de 60kg | clay |
| TRG | Trigo | sacas de 60kg | moss |
| ACR | Acucar | toneladas | clay |
| ALG | Algodao | arrobas de 15kg | moss |

Regioes mapeadas: MT, GO, RS, MG, PR, SP, BA, MS, TO, MA, PI, SC.

### Componentes

**Auth:** `OtpRequestForm`, `OtpSignInForm`, `WalletLoginForm`, `WalletLinkPanel`, `CredentialAcceptancePanel`

**Platform:** `BondConsole`, `OfferCreateForm`, `OfferBuyForm`, `OraclePublishForm`, `RedeemConsole`, `DisputeOpenForm`, `ProofCreateForm`, `ProofMintPanel`, `ComplianceConsole`, `ProposalForm`

**Market:** `MarketplaceHero`, `MarketplaceGrid`, `MarketplaceFilters`, `CommodityFilterStrip`, `OfferProductCard`, `LiveMarketPanel`, `AmmSwapPanel`, `PriceTrend`

**Tables:** `DashboardOrderBook`, `MarketOrderBook`, `AdminOffersTable`, `BondVaultTable`, `WalletOffersTable`, `WalletRedeemsTable`, `ReputationTable`

**UI primitivos:** `Button`, `ButtonLink`, `Card`, `Badge`, `Input`, `Textarea`, `Select`, `Eyebrow`, `SectionHeading`, `DataTable`, `Toaster`

---

## Domain

### Ciclo de vida do usuario

```
registered -> email_verified -> wallet_linked -> kyc_pending -> kyc_approved -> producer_approved
                                                      |
                                                      v
                                                 kyc_rejected

Qualquer estado -> suspended (via suspend)
suspended -> estado anterior (via reinstate)
```

Para operar on-chain (criar bonds, listar ofertas), o usuario precisa estar em `kyc_approved` ou `producer_approved`.

### Ciclo de vida do bond

```
pending -> locked (confirm_deposit)
locked -> frozen (freeze) | partially_slashed (slash_partial) | released (release) | forfeited (forfeit)
frozen -> locked (restore_lock) | partially_slashed (slash_partial) | forfeited (forfeit)
partially_slashed -> frozen (freeze) | released (release) | forfeited (forfeit)
```

### Ciclo de vida da oferta

```
draft -> listed -> partially_filled -> filled -> redeem_requested -> settled
                                                                       |
                                                                   cancelled
```

Ao criar, o produtor precisa ter bond em `locked` e credenciais `KYCApproved` + `ProducerApproved` aceitas. A serie e registrada no DEX como `OfferCreate`.

### Ciclo de vida do resgate

```
requested -> tracking_pending -> in_delivery -> delivered -> accepted -> closed
                                                    |
                                                    v
                                                 disputed
```

A janela de resposta e enforced on-chain via `EscrowCreate.FinishAfter`. Apos o deadline, o escrow pode ser finalizado via `EscrowFinish`. Em caso de disputa, `EscrowCancel` devolve ao holder.

### Ciclo de vida da disputa

```
opened -> under_review -> resolved | rejected
              |
              v
          escalated (sobe de tier)
```

Tres tiers com SLAs: tier 1 (5 dias), tier 2 (10 dias), tier 3 (30 dias). Resolucao aplica `restore_lock`, `slash_partial` (com porcentagem) ou `forfeit` no bond.

### AMM

Constant-product (`x * y = k`). Taxa de 30 bps (0.3%). Pools seedados: MLH/VEX, ARZ/VEX, CAF/VEX, FEJ/VEX, TRG/VEX, ACR/VEX, ALG/VEX.

### Fees

| Tipo | Taxa | Momento |
|---|---|---|
| Listing | 0.05% do notional | Criacao da oferta |
| Transaction | 0.1% do notional | Compra da oferta |
| Settlement | 0.15% do notional | Resgate |

### Reputacao

Formula: `score = clamp(0, 100, 55 + credenciais*10 + bonds*12 + ofertas*6 - disputas*18)`

---

## XRPL

### Topologia de contas

```
Cold Issuer ---------> emite VEX + series tokens (DefaultRipple habilitado)
Treasury ------------> reserva da plataforma
Bond Vault ----------> custodia de bonds (DepositAuth + DepositPreauth por credencial)
Settlement ----------> recebe pagamentos de resgate
Hot API -------------> wallet operacional da API
Oracle Publisher ----> publica precos via OracleSet
KYC Issuer ----------> emite credenciais KYC e Producer
```

### Bootstrap Testnet

O script `pnpm xrpl:bootstrap:testnet` configura:

1. Flag `DepositAuth` no bond vault
2. Flag `DefaultRipple` no cold issuer
3. Trustlines VEX para user, bond vault e buyer
4. Ripple (NoRipple cleared) entre cold issuer e contas
5. Saldo inicial de 50.000 VEX para contas de teste
6. `DepositPreauth` no bond vault para credenciais `KYCApproved` e `ProducerApproved`

### Intent pattern

O dominio constroi objetos de intent com preflight checks. O gateway consome e submete. Separa validacao (sincrona, testavel) de submissao (assincrona, com side effects).

```
Domain -> buildBondDepositIntent(input)
  -> { destination, amount, credentialIds, preflightChecks, notes }
     -> Gateway.submitBondDeposit(intent)
        -> XRPL Payment tx
```

### XrplGateway interface

```
getAccountTopology()
getNetworkStatus()
previewBondDeposit / previewCredentialCreate / previewOracleSet
submitBondDeposit / submitCredentialCreate / submitCredentialAccept
submitOracleSet / submitSeriesOffer / submitSeriesBuy
submitSeriesRedeem / submitProofNftMint
submitBondEscrowCreate / submitBondEscrowFinish / submitBondEscrowCancel
submitRedeemEscrowCreate / submitRedeemEscrowFinish / submitRedeemEscrowCancel
submitAmmCreate / submitAmmDeposit / submitAmmWithdraw
getAmmInfo / getAggregatePrice
```

### Resiliencia

- Classificacao de result codes (`tesSUCCESS`, `ter*`, `tef*`, `tem*`, `tec*`)
- Retry com exponential backoff (1s, 2s, 4s, 3 tentativas)
- Circuit breaker (threshold=5, recovery=30s)

---

## Database

PostgreSQL 16 via Prisma. Schema em `prisma/schema.prisma`. Client gerado em `packages/database/generated/client/`.

### Modelos

| Modelo | Campos principais |
|---|---|
| `User` | id, name, email (unique), walletAddress (unique), state, roles[] |
| `WalletChallenge` | userId, walletAddress, nonce, message, expiresAt, usedAt |
| `CredentialRecord` | userId, kind, status, issuerWallet, subjectWallet, ledgerCredentialId (unique), expiresAt |
| `Bond` | userId, amount, currency, credentialIds[], state, slashedAmount, ledgerHash, lockedAt, frozenAt, escrowSequence, escrowCondition, escrowFinishAfter |
| `Offer` | producerId, currentHolderId, quantity, unitPrice, notional, expiresAt, status, executionLane, seriesAlias, seriesCurrencyHex, seriesDescriptor (JSON) |
| `RedeemRequest` | offerId, holderId, state, responseWindowDays, settlementWallet, trackingCode, timestamps, escrowSequence, escrowFinishAfter, escrowLedgerHash |
| `DisputeCase` | redeemId, openedByUserId, tier, state, reason, evidenceUri, bondId, bondDecision, slaDueAt, resolutionSummary |
| `ProofArtifact` | userId, offerId, artifactType, commodity, uri, ipfsCid, manifestHash, nftTokenId (unique), NFT fields, metadata (JSON) |
| `OraclePrice` | symbol, source, value, metadata (JSON), publishedAt (indexed) |
| `AmmPool` | pair (unique), baseAsset, quoteAsset, reserves, feeBps (default 30), ammAccountId, lpTokenCurrency, lpTokenIssuer, isNative |
| `AuditLog` | actorUserId, action, entityType, entityId, payload (JSON) |
| `FeeRecord` | feeType, entityType, entityId, baseAmount, feeRate, feeAmount, currency |
| `Proposal` | code (unique), title, summary, status, authorId |

### Seed

`pnpm db:seed` popula:

- 4 usuarios (2 produtores, 1 comprador, 1 operador admin)
- 4 credenciais (KYC + Producer para cada produtor)
- 2 bonds (15.000 e 8.000 VEX)
- 8 ofertas cobrindo todas as commodities
- 1 resgate em andamento
- 4 provas operacionais
- 13 pontos de preco oracle (MLH, ARZ, CAF, SOJ, FEJ, TRG, ACR, ALG contra BRL)
- 1 disputa aberta
- 7 pools AMM
- 7 audit logs
- 3 propostas de governanca (VAL-001, VAL-002, VAL-003)

### Docker

```yaml
services:
  postgres:  # postgres:16-alpine, porta 5432, db valyria
  redis:     # redis:7-alpine, porta 6379
volumes:
  postgres_data:
  redis_data:
```

---

## Design system

Tokens definidos em `apps/web/design-tokens.ts` e aplicados via CSS custom properties em `globals.css`.

### Paleta

| Token | RGB | Uso |
|---|---|---|
| `paper` | 255 250 243 | Background principal (off-white quente) |
| `sand` | 245 239 227 | Background secundario |
| `fog` | 232 223 208 | Background terciario |
| `clay` | 187 124 76 | Accent quente (terracota) |
| `moss` | 47 93 80 | Accent frio (verde escuro) |
| `dusk` | 43 53 64 | Texto primario / botoes |
| `ink` | 22 26 29 | Texto maximo contraste |
| `line` | 118 112 101 | Bordas e separadores |

### Tipografia

- **Sans:** Aptos, Segoe UI Variable, Trebuchet MS
- **Display:** Iowan Old Style, Palatino Linotype, Book Antiqua (serif para headings)

### Espacamento e radii

| Token | Valor | Uso |
|---|---|---|
| `rounded-panel` | 1.5rem | Cards e paineis |
| `rounded-tile` | 1.125rem | Tiles e inputs |
| `rounded-pill` | 999px | Botoes e badges |
| `gap-section` | clamp(3.5rem, 7vw, 6rem) | Entre secoes |
| `gap-cluster` | 1.5rem | Entre grupos |
| `p-frame` | 1.25rem | Padding interno |
| `max-w-shell` | 80rem | Largura maxima |

### Sombras

| Token | Valor |
|---|---|
| `shadow-panel` | `0 24px 80px rgba(18,24,27,0.12)` |
| `shadow-hero` | `0 36px 120px rgba(18,24,27,0.16)` |

### Motion

Easing fluent: `cubic-bezier(0.2, 0.8, 0.2, 1)`.

Visual polish: grain texture SVG no body, hero stagger animation, glow orbs animados, scroll-driven section reveal.

### Classes utilitarias

| Classe | Descricao |
|---|---|
| `.app-shell` | Container centralizado, max-w-shell, flex column |
| `.panel` | Card glassmorphic (border, radius-panel, paper/72, shadow, backdrop-blur) |
| `.eyebrow` | Label moss uppercase com tracking-brand |
| `.label-caps` | Label clay uppercase com tracking-eyebrow |
| `.body-copy` | Texto ink/72 em 0.875rem |
| `.hero-grid` | Grid `lg:grid-cols-[1.4fr_0.9fr]` |

### Lint

`pnpm lint:design` proibe em componentes:

- Cores hex cruas (`#xxx`)
- `rgb()`/`rgba()` crus
- Valores `px` crus
- Tailwind arbitrary px brackets (`[123px]`)

Excecoes: `globals.css`, `design-tokens.ts`, `tailwind.config.ts`.

---

## Seguranca

### RBAC

Rotas da API sao protegidas por roles via headers internos:

```
x-valyria-internal-token: <INTERNAL_API_TOKEN>
x-valyria-roles: admin,compliance,operations
x-valyria-user-id: <uuid>
x-valyria-step-up: verified
```

| Role | Escopo |
|---|---|
| `admin` | Acesso total |
| `compliance` | Onboarding, credenciais, provas |
| `operations` | Bonds, ofertas, resgates, disputas, oracles |
| `support` | Leitura + transicoes de suporte |
| `read_only` | Somente leitura |

Mutacoes sensiveis exigem `stepUp: true`.

Guards: `requireRoles({ anyOf, stepUp? })` retorna 403 se role ou stepUp insuficiente. `requireAuthenticatedActor()` retorna 401 se token invalido ou userId ausente.

### Rate limiting

Todas as rotas (exceto `/health`) passam por rate limiter:

- Chave: `rate:<path>:<ip>`
- Store: Redis (fallback in-memory em caso de erro)
- Default: 120 requests / 60 segundos
- Resposta: HTTP 429 com `retryAfterSeconds`

### Auth frontend

- Sessao JWT via cookie `authjs.session-token` (HTTPS: `__Secure-authjs.session-token`)
- Middleware Next.js redireciona rotas protegidas para `/login` quando nao autenticado
- O proxy backoffice injeta headers internos server-side, nunca expostos ao browser
- Wallet linking usa challenge-response com `ripple-keypairs` (nonce + assinatura + derivacao de endereco)
- Seeds de wallet informadas nos formularios servem apenas para assinatura do request, nunca sao persistidas

---

## O que ja foi provado em testnet

O projeto ja validou em XRPL Testnet:

- Emissao e aceitacao de credenciais (`CredentialCreate` + `CredentialAccept`)
- Bond em VEX com `DepositAuth` e `CredentialIDs`
- Bond via `EscrowCreate` com `FinishAfter` + `EscrowFinish`/`EscrowCancel`
- `OracleSet` com aggregation nativa do ledger
- Listagem real no DEX (`OfferCreate` seller-side)
- Compra real da serie (`OfferCreate` buyer-side com partial fills)
- `Proof NFT` via `NFTokenMint`
- Redeem com settlement real (Payment para Settlement Wallet)
- Redeem com escrow on-chain (`EscrowCreate` + `EscrowFinish`)
- Dispute com freeze, slash parcial (EscrowFinish + redistribuicao) e forfeit (EscrowCancel)
- AMM nativo XRPL (`AMMCreate`, `AMMDeposit`, `AMMWithdraw`, `amm_info`)

---

## Roadmap

### Implementado

- [x] Onboarding com state machine completa (9 eventos, 8 estados)
- [x] Credenciais on-chain (`CredentialCreate` + `CredentialAccept`)
- [x] Bond via XRPL Escrow (`EscrowCreate` com `FinishAfter`)
- [x] DEX nativo (`OfferCreate` seller/buyer com partial fills)
- [x] AMM nativo XRPL XLS-30d (`AMMCreate`, `AMMDeposit`, `AMMWithdraw`)
- [x] Redeem com escrow on-chain e janela de resposta enforced
- [x] Dispute com freeze, slash parcial, forfeit on-chain
- [x] Proof NFTs com SHA-256 manifest e `NFTokenMint`
- [x] Oracle com `OracleSet` e aggregation nativa
- [x] Governance com state machine, RBAC e audit log
- [x] WebSocket event-driven (EventBus push em tempo real)
- [x] RBAC + rate limiting + audit trail completo
- [x] Fee collection automatica (listing, transaction, settlement)

### Em breve

| Funcionalidade | Status atual | Proximo passo |
|---|---|---|
| IPFS / Arweave | Storage local com pseudo-CID via SHA-256 | Pinning real com provider (Pinata/web3.storage) |
| KYC/KYB externo | Credenciais emitidas manualmente | Integracao com provedor (Sumsub, Onfido) |
| Logistica | Tracking code manual | API de transportadora (Correios, Jadlog) |
| Hardening XRPL | Contas testnet padrao | Multisig + master key disabled em mainnet |
| Governanca on-chain | State machine + API REST | Votacao on-chain com staking de VEX |
| Mobile | Web responsivo | App React Native dedicado |

### Fora do escopo do MVP

- XRPL Hooks, EVM Sidechain e TokenEscrow — nao sao dependencias. Escrow, AMM, Credentials e Oracle sao features nativas do protocolo
- Deploy em mainnet — requer auditoria de seguranca e hardening

---

## Fluxo de uso

1. Usuario cria conta no app (email ou wallet)
2. Vincula uma wallet XRPL (challenge-response)
3. Recebe e aceita credenciais on-chain
4. Se produtor, deposita bond em VEX (minimo 10% do notional)
5. Cria oferta para uma serie agricola
6. Outro participante compra a serie (suporta partial fills)
7. O holder decide entre manter, revender ou abrir redeem
8. No redeem, a serie vai para a Settlement Wallet
9. Entrega segue com tracking, aceite via escrow on-chain ou dispute
10. Fees sao coletadas em cada etapa (listing, transaction, settlement)

