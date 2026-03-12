import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(120),
  INTERNAL_API_TOKEN: z.string().default("valyria-local-internal-token"),
  PERSISTENCE_DRIVER: z.enum(["memory", "prisma"]).default("memory"),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  XRPL_MODE: z.enum(["mock", "real"]).default("mock"),
  XRPL_WS_URL: z.string().default("wss://s.altnet.rippletest.net:51233"),
  XRPL_NETWORK_ID: z.coerce.number().int().positive().default(1),
  XRPL_KYC_ISSUER_SEED: z.string().optional(),
  XRPL_ORACLE_PUBLISHER_SEED: z.string().optional(),
  XRPL_COLD_ISSUER_SEED: z.string().optional(),
  XRPL_SETTLEMENT_WALLET_SEED: z.string().optional(),
  XRPL_TEST_USER_WALLET: z.string().optional(),
  XRPL_TEST_USER_WALLET_SEED: z.string().optional(),
  XRPL_TEST_BUYER_WALLET: z.string().optional(),
  XRPL_TEST_BUYER_WALLET_SEED: z.string().optional(),
  XRPL_COLD_ISSUER: z.string().default("rValyriaColdIssuer11111111111111111111"),
  XRPL_TREASURY_WALLET: z.string().default("rValyriaTreasury1111111111111111111111"),
  XRPL_BOND_VAULT: z.string().default("rValyriaBondVault111111111111111111111"),
  XRPL_SETTLEMENT_WALLET: z.string().default("rValyriaSettlement11111111111111111111"),
  XRPL_HOT_API_WALLET: z.string().default("rValyriaHotApi111111111111111111111111"),
  XRPL_ORACLE_PUBLISHER: z.string().default("rValyriaOracle1111111111111111111111"),
  XRPL_KYC_ISSUER: z.string().default("rValyriaKycIssuer111111111111111111111")
});

export const env = envSchema.parse(process.env);
