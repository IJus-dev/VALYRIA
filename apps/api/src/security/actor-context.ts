import type { FastifyInstance, FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify";
import { env } from "../config/env";

const actorRoles = ["admin", "compliance", "operations", "support", "read_only"] as const;

export type ActorRole = (typeof actorRoles)[number];

export interface ActorContext {
  userId?: string;
  roles: ActorRole[];
  hasStepUp: boolean;
  isTrustedInternal: boolean;
}

declare module "fastify" {
  interface FastifyRequest {
    actor?: ActorContext;
  }
}

function isActorRole(value: string): value is ActorRole {
  return actorRoles.includes(value as ActorRole);
}

function normalizeHeaderValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value.join(",");
  }

  return value ?? "";
}

function parseRoles(value: string | string[] | undefined): ActorRole[] {
  return normalizeHeaderValue(value)
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is ActorRole => item.length > 0 && isActorRole(item));
}

function parseStepUp(value: string | string[] | undefined): boolean {
  const normalized = normalizeHeaderValue(value).trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "verified";
}

function hasTrustedInternalToken(request: FastifyRequest): boolean {
  const token = normalizeHeaderValue(request.headers["x-valyria-internal-token"]).trim();
  return token.length > 0 && token === env.INTERNAL_API_TOKEN;
}

function buildActorContext(request: FastifyRequest): ActorContext {
  const isTrustedInternal = hasTrustedInternalToken(request);

  if (!isTrustedInternal) {
    return {
      roles: [],
      hasStepUp: false,
      isTrustedInternal: false
    };
  }

  const userIdHeader = request.headers["x-valyria-user-id"];
  const userId = typeof userIdHeader === "string" && userIdHeader.trim().length > 0 ? userIdHeader.trim() : undefined;

  return {
    ...(userId ? { userId } : {}),
    roles: parseRoles(request.headers["x-valyria-roles"]),
    hasStepUp: parseStepUp(request.headers["x-valyria-step-up"]),
    isTrustedInternal: true
  };
}

export function registerActorContext(app: FastifyInstance): void {
  app.decorateRequest("actor", undefined);
  app.addHook("onRequest", async (request) => {
    request.actor = buildActorContext(request);
  });
}

export function requireRoles(input: {
  anyOf: ActorRole[];
  stepUp?: boolean;
}): preHandlerHookHandler {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const actor = request.actor ?? {
      roles: [],
      hasStepUp: false,
      isTrustedInternal: false
    };
    const hasRole = input.anyOf.some((role) => actor.roles.includes(role));

    if (!hasRole) {
      return reply.status(403).send({
        message: `One of the following roles is required: ${input.anyOf.join(", ")}.`
      });
    }

    if (input.stepUp && !actor.hasStepUp) {
      return reply.status(403).send({
        message: "Step-up authentication is required for this action."
      });
    }
  };
}

export function requireAuthenticatedActor(): preHandlerHookHandler {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const actor = request.actor ?? {
      roles: [],
      hasStepUp: false,
      isTrustedInternal: false
    };

    if (!actor.isTrustedInternal || !actor.userId) {
      return reply.status(401).send({
        message: "Authenticated actor context is required."
      });
    }
  };
}
