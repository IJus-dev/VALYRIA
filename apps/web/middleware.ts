import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function ensureLocaleCookie(request: NextRequest, response: NextResponse): NextResponse {
  if (!request.cookies.get("NEXT_LOCALE")) {
    const acceptLang = request.headers.get("accept-language") ?? "";
    const locale = acceptLang.toLowerCase().includes("pt") ? "pt-BR" : "en";
    response.cookies.set("NEXT_LOCALE", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  return response;
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    return ensureLocaleCookie(
      request,
      NextResponse.redirect(new URL("/dashboard", request.url)),
    );
  }

  const isSecure = request.url.startsWith("https");
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? "valyria-dev-secret",
    salt: isSecure ? "__Secure-authjs.session-token" : "authjs.session-token",
  });

  if (!token) {
    return ensureLocaleCookie(
      request,
      NextResponse.redirect(new URL("/login", request.url)),
    );
  }

  return ensureLocaleCookie(request, NextResponse.next());
}

export const config = {
  matcher: [
    "/",
    "/wallet",
    "/admin/:path*",
    "/offers/new",
    "/notifications"
  ]
};
