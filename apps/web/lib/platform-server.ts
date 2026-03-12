import "server-only";

export const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN ?? "valyria-local-internal-token";

function createInternalHeaders(): Headers {
  const headers = new Headers();
  headers.set("x-valyria-internal-token", INTERNAL_API_TOKEN);
  return headers;
}

export function buildOperatorHeaders(): Headers {
  const headers = createInternalHeaders();
  headers.set("x-valyria-roles", "admin,compliance,operations,read_only");
  headers.set("x-valyria-user-id", "usr_ops_1");
  headers.set("x-valyria-step-up", "verified");
  return headers;
}

export function buildAuthenticatedUserHeaders(input: {
  userId: string;
  stepUp?: boolean;
}): Headers {
  const headers = createInternalHeaders();
  headers.set("x-valyria-user-id", input.userId);

  if (input.stepUp) {
    headers.set("x-valyria-step-up", "verified");
  }

  return headers;
}
