import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { API_URL, buildAuthenticatedUserHeaders } from "@/lib/platform-server";

const createWalletChallengeSchema = z.object({
  walletAddress: z.string().min(10)
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

  const body = createWalletChallengeSchema.parse(await request.json());
  const response = await fetch(`${API_URL}/api/auth/wallet-challenges`, {
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
