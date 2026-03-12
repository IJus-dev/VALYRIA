import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { API_URL, buildAuthenticatedUserHeaders } from "@/lib/platform-server";

const verifyWalletChallengeSchema = z.object({
  challengeId: z.string(),
  signature: z.string().min(16),
  publicKey: z.string().min(16)
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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

  const body = verifyWalletChallengeSchema.parse(await request.json());
  const response = await fetch(`${API_URL}/api/auth/wallet-verify`, {
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
