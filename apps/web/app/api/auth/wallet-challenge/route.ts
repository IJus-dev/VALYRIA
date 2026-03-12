import { prisma } from "@valyria/database";
import { NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";
const INTERNAL_API_TOKEN =
  process.env.INTERNAL_API_TOKEN ?? "valyria-local-internal-token";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const walletAddress = body?.walletAddress;

    if (typeof walletAddress !== "string" || walletAddress.length < 10) {
      return NextResponse.json(
        { error: "walletAddress is required (min 10 chars)" },
        { status: 400 }
      );
    }

    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: { updatedAt: new Date() },
      create: {
        walletAddress,
        state: "registered",
        roles: [],
      },
    });

    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("x-valyria-internal-token", INTERNAL_API_TOKEN);
    headers.set("x-valyria-user-id", user.id);

    const res = await fetch(`${API_URL}/api/auth/wallet-challenges`, {
      method: "POST",
      headers,
      body: JSON.stringify({ walletAddress }),
    });

    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ message: "Challenge creation failed" }));
      return NextResponse.json(err, { status: res.status });
    }

    const challenge = await res.json();

    return NextResponse.json({
      challengeId: challenge.id,
      message: challenge.message,
      userId: user.id,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
