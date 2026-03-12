import { createKeyValueStore } from "@valyria/cache";
import type { FastifyInstance } from "fastify";

interface RateLimiterOptions {
  redisUrl?: string;
  windowSeconds: number;
  maxRequests: number;
}

function getClientKey(rawAddress: string): string {
  return rawAddress.replace(/[:.%]/g, "_");
}

function getPathKey(url: string): string {
  return (url.split("?")[0] ?? url).replace(/[^a-zA-Z0-9/_-]/g, "_");
}

function isRateLimitedPath(pathname: string): boolean {
  return pathname !== "/health";
}

export function registerRateLimiter(app: FastifyInstance, options: RateLimiterOptions): void {
  const primaryStore = createKeyValueStore(options.redisUrl);
  const fallbackStore = createKeyValueStore();

  app.addHook("onRequest", async (request, reply) => {
    const pathname = request.url.split("?")[0] ?? request.url;

    if (!isRateLimitedPath(pathname)) {
      return;
    }

    const clientAddress = request.ip || request.headers["x-forwarded-for"] || "unknown";
    const clientKey = Array.isArray(clientAddress) ? (clientAddress[0] ?? "unknown") : clientAddress;
    const rateKey = `rate:${getPathKey(pathname)}:${getClientKey(clientKey)}`;

    let requestsInWindow: number;

    try {
      requestsInWindow = await primaryStore.incr(rateKey, {
        ttlSeconds: options.windowSeconds
      });
    } catch {
      requestsInWindow = await fallbackStore.incr(rateKey, {
        ttlSeconds: options.windowSeconds
      });
    }

    if (requestsInWindow > options.maxRequests) {
      return reply.status(429).send({
        message: "Rate limit exceeded.",
        retryAfterSeconds: options.windowSeconds
      });
    }
  });
}
