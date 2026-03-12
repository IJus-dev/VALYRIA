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
    const { challengeId, signature, publicKey, userId } = body ?? {};

    if (
      typeof challengeId !== "string" ||
      typeof signature !== "string" ||
      typeof publicKey !== "string" ||
      typeof userId !== "string"
    ) {
      return NextResponse.json(
        { error: "challengeId, signature, publicKey, and userId are required" },
        { status: 400 }
      );
    }

    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("x-valyria-internal-token", INTERNAL_API_TOKEN);
    headers.set("x-valyria-user-id", userId);

    const res = await fetch(`${API_URL}/api/auth/wallet-verify`, {
      method: "POST",
      headers,
      body: JSON.stringify({ challengeId, signature, publicKey }),
    });

    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ message: "Verification failed" }));
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();

    return NextResponse.json({
      ok: true,
      user: data.user,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
