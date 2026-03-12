import { NextRequest, NextResponse } from "next/server";
import { API_URL, buildOperatorHeaders } from "@/lib/platform-server";

export const dynamic = "force-dynamic";

async function forwardRequest(
  request: NextRequest,
  params: Promise<{
    path: string[];
  }>
) {
  const { path } = await params;
  const target = `${API_URL}/api/${path.join("/")}${request.nextUrl.search}`;
  const headers = buildOperatorHeaders();
  const method = request.method.toUpperCase();
  const init: RequestInit = {
    method,
    headers
  };

  if (method !== "GET" && method !== "HEAD") {
    headers.set("content-type", request.headers.get("content-type") ?? "application/json");
    init.body = await request.text();
  }

  const response = await fetch(target, init);
  const text = await response.text();

  return new NextResponse(text, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json; charset=utf-8"
    }
  });
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      path: string[];
    }>;
  }
) {
  return forwardRequest(request, context.params);
}

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      path: string[];
    }>;
  }
) {
  return forwardRequest(request, context.params);
}
