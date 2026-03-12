import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { API_URL, buildAuthenticatedUserHeaders } from "@/lib/platform-server";

export const dynamic = "force-dynamic";

export async function GET() {
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

  const response = await fetch(`${API_URL}/api/auth/me/credentials`, {
    headers: buildAuthenticatedUserHeaders({ userId: actorUserId }),
    cache: "no-store"
  });

  const text = await response.text();

  return new NextResponse(text, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json; charset=utf-8"
    }
  });
}
