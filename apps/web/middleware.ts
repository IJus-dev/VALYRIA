import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Redirecionar / para /dashboard no edge (antes do SSR)
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isSecure = request.url.startsWith("https");
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? "valyria-dev-secret",
    salt: isSecure ? "__Secure-authjs.session-token" : "authjs.session-token",
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
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
