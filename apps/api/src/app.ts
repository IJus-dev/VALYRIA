import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import websocket from "@fastify/websocket";
import Fastify from "fastify";
import { DomainError } from "@valyria/domain";
import { ZodError } from "zod";
import { InMemoryPlatformRepository } from "./adapters/storage/in-memory-platform-repository";
import { LocalProofFileStore } from "./adapters/storage/local-proof-file-store";
import { PrismaPlatformRepository } from "./adapters/storage/prisma-platform-repository";
import { MockXrplGateway } from "./adapters/xrpl/mock-xrpl-gateway";
import { RealXrplGateway } from "./adapters/xrpl/real-xrpl-gateway";
import type { AccountTopology, XrplGateway } from "./adapters/xrpl/xrpl-gateway";
import { env } from "./config/env";
import { AmmService } from "./modules/amm-service";
import { AuditService } from "./modules/audit-service";
import { BondService } from "./modules/bond-service";
import { CredentialService } from "./modules/credential-service";
import { DisputeService } from "./modules/dispute-service";
import { GovernanceService } from "./modules/governance-service";
import { MarketService } from "./modules/market-service";
import { OnboardingService } from "./modules/onboarding-service";
import type { PlatformRepository } from "./modules/platform-repository";
import { ProofService } from "./modules/proof-service";
import { RedeemService } from "./modules/redeem-service";
import { WalletChallengeService } from "./modules/wallet-challenge-service";
import { OracleService } from "./modules/oracle-service";
import { auditRoutes } from "./routes/audit";
import { ammRoutes } from "./routes/amm";
import { feeRoutes } from "./routes/fees";
import { authRoutes } from "./routes/auth";
import { bondRoutes } from "./routes/bonds";
import { credentialRoutes } from "./routes/credentials";
import { disputeRoutes } from "./routes/disputes";
import { healthRoutes } from "./routes/health";
import { marketRoutes } from "./routes/market";
import { offerRoutes } from "./routes/offers";
import { onboardingRoutes } from "./routes/onboarding";
import { oracleRoutes } from "./routes/oracles";
import { proofRoutes } from "./routes/proofs";
import { redeemRoutes } from "./routes/redeems";
import { governanceRoutes } from "./routes/governance";
import { registerActorContext } from "./security/actor-context";
import { registerRateLimiter } from "./security/rate-limiter";
import { EventBus } from "./lib/event-bus";

function getAccountTopology(): AccountTopology {
  return {
    coldIssuer: env.XRPL_COLD_ISSUER,
    treasury: env.XRPL_TREASURY_WALLET,
    bondVault: env.XRPL_BOND_VAULT,
    settlement: env.XRPL_SETTLEMENT_WALLET,
    hotApi: env.XRPL_HOT_API_WALLET,
    oraclePublisher: env.XRPL_ORACLE_PUBLISHER,
    kycIssuer: env.XRPL_KYC_ISSUER
  };
}

function createRepository(): PlatformRepository {
  if (env.PERSISTENCE_DRIVER === "prisma") {
    return new PrismaPlatformRepository();
  }

  return new InMemoryPlatformRepository();
}

function createXrplGateway(topology: AccountTopology): XrplGateway {
  if (env.XRPL_MODE === "real") {
    return new RealXrplGateway({
      url: env.XRPL_WS_URL,
      networkId: env.XRPL_NETWORK_ID,
      topology,
      kycIssuerSeed: env.XRPL_KYC_ISSUER_SEED,
      oraclePublisherSeed: env.XRPL_ORACLE_PUBLISHER_SEED,
      coldIssuerSeed: env.XRPL_COLD_ISSUER_SEED,
      settlementWalletSeed: env.XRPL_SETTLEMENT_WALLET_SEED,
      testUserWallet: env.XRPL_TEST_USER_WALLET,
      testUserWalletSeed: env.XRPL_TEST_USER_WALLET_SEED,
      testBuyerWallet: env.XRPL_TEST_BUYER_WALLET,
      testBuyerWalletSeed: env.XRPL_TEST_BUYER_WALLET_SEED
    });
  }

  return new MockXrplGateway(topology);
}

export function createApp() {
  const topology = getAccountTopology();
  const repository = createRepository();
  const xrplGateway = createXrplGateway(topology);
  const eventBus = new EventBus();
  const onboardingService = new OnboardingService(repository);
  const walletChallengeService = new WalletChallengeService(repository);
  const credentialService = new CredentialService(repository, xrplGateway);
  const ammService = new AmmService(repository, xrplGateway);
  const bondService = new BondService(repository, xrplGateway, eventBus);
  const marketService = new MarketService(repository, xrplGateway, eventBus);
  const redeemService = new RedeemService(repository, xrplGateway, eventBus);
  const oracleService = new OracleService(repository, xrplGateway);
  const proofFileStore = new LocalProofFileStore();
  const proofService = new ProofService(repository, xrplGateway, proofFileStore);
  const disputeService = new DisputeService(repository, xrplGateway, eventBus);
  const governanceService = new GovernanceService(repository, eventBus);
  const auditService = new AuditService(repository);

  const app = Fastify({
    logger: true
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        code: "VALIDATION_ERROR",
        message: "Validation error",
        issues: error.flatten()
      });
    }

    if (error instanceof DomainError) {
      return reply.status(error.httpStatus).send({
        code: error.code,
        message: error.message
      });
    }

    app.log.error(error);

    return reply.status(500).send({
      code: "INTERNAL_ERROR",
      message: "Unexpected error"
    });
  });

  app.register(cors, {
    origin: env.CORS_ORIGIN
  });

  app.register(multipart, { limits: { fileSize: 10_000_000 } });

  registerActorContext(app);
  registerRateLimiter(app, {
    redisUrl: env.REDIS_URL,
    windowSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS
  });

  app.register(websocket);

  app.register(healthRoutes, {
    topology,
    xrplGateway
  });

  app.register(onboardingRoutes, {
    prefix: "/api/onboarding",
    service: onboardingService
  });

  app.register(ammRoutes, {
    prefix: "/api/amm",
    service: ammService
  });

  app.register(authRoutes, {
    prefix: "/api/auth",
    service: walletChallengeService,
    credentialService
  });

  app.register(credentialRoutes, {
    prefix: "/api/credentials",
    service: credentialService
  });

  app.register(bondRoutes, {
    prefix: "/api/bonds",
    service: bondService
  });

  app.register(offerRoutes, {
    prefix: "/api/offers",
    marketService,
    redeemService
  });

  app.register(redeemRoutes, {
    prefix: "/api/redeems",
    service: redeemService,
    eventBus
  });

  app.register(oracleRoutes, {
    prefix: "/api/oracles",
    service: oracleService
  });

  app.register(proofRoutes, {
    prefix: "/api/proofs",
    service: proofService
  });

  app.register(disputeRoutes, {
    prefix: "/api/disputes",
    service: disputeService,
    eventBus
  });

  app.register(auditRoutes, {
    prefix: "/api/audit",
    service: auditService
  });

  app.register(marketRoutes, {
    prefix: "/api/market",
    service: marketService,
    eventBus
  });

  app.register(governanceRoutes, {
    prefix: "/api/governance",
    service: governanceService,
    eventBus
  });

  app.register(feeRoutes, {
    prefix: "/api/fees",
    repository
  });

  return app;
}
