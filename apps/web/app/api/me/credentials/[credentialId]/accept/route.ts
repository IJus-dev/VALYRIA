import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { API_URL, buildAuthenticatedUserHeaders } from "@/lib/platform-server";

const acceptCredentialSchema = z.object({
  ledgerCredentialId: z.string().min(4)
});

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      credentialId: string;
    }>;
  }
) {
  const session = await auth();
  const actorUserId = session?.user?.id;

  if (!actorUserId) {
    return NextResponse.json(
      {
        message: "Authentication required."
      },
      {
        status: 401
      }
    );
  }

  const { credentialId } = await context.params;
  const body = acceptCredentialSchema.parse(await request.json());
  const response = await fetch(`${API_URL}/api/auth/me/credentials/${credentialId}/accept`, {
    method: "POST",
    headers: {
      ...Object.fromEntries(buildAuthenticatedUserHeaders({ userId: actorUserId }).entries()),
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();

  return new NextResponse(text, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json; charset=utf-8"
    }
  });
}
