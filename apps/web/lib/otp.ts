import { createHash, randomInt } from "node:crypto";
import { createKeyValueStore } from "@valyria/cache";

const cache = createKeyValueStore(process.env.REDIS_URL);
const OTP_TTL_SECONDS = 10 * 60;
const OTP_RATE_LIMIT = 5;
const OTP_RATE_WINDOW_SECONDS = 5 * 60;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function buildOtpKey(email: string): string {
  return `otp:code:${normalizeEmail(email)}`;
}

function buildRateKey(email: string): string {
  return `otp:rate:${normalizeEmail(email)}`;
}

function generateOtpCode(): string {
  return randomInt(100000, 999999).toString();
}

export async function issueOtpCode(email: string): Promise<{
  ok: true;
  expiresInSeconds: number;
  previewCode?: string;
}> {
  const attempts = await cache.incr(buildRateKey(email), {
    ttlSeconds: OTP_RATE_WINDOW_SECONDS
  });

  if (attempts > OTP_RATE_LIMIT) {
    throw new Error("OTP rate limit exceeded. Try again later.");
  }

  const code = generateOtpCode();

  await cache.set(
    buildOtpKey(email),
    {
      hash: hashCode(code)
    },
    {
      ttlSeconds: OTP_TTL_SECONDS
    }
  );

  return {
    ok: true,
    expiresInSeconds: OTP_TTL_SECONDS,
    ...(process.env.NODE_ENV !== "production" ? { previewCode: code } : {})
  };
}

export async function verifyOtpCode(email: string, code: string): Promise<boolean> {
  const stored = await cache.get<{ hash: string }>(buildOtpKey(email));

  if (!stored) {
    return false;
  }

  const isValid = stored.hash === hashCode(code.trim());

  if (isValid) {
    await cache.del(buildOtpKey(email));
  }

  return isValid;
}
