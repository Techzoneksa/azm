import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const protectedPaths = [
  "/dashboard",
  "/readiness",
  "/company",
  "/compliance",
  "/official-links",
  "/drivers",
  "/vehicles",
  "/users",
  "/settings",
];

const publicPaths = ["/login"];

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "azm-flow-secret"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathWithoutLocale = pathname.replace(/^\/(ar|en)/, "") || "/";

  const isProtected = protectedPaths.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + "/")
  );
  const isPublic = publicPaths.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + "/")
  );
  const isApi = pathname.startsWith("/api");
  const isStatic =
    pathname.includes("/_next") ||
    pathname.includes("/favicon") ||
    pathname.includes("/images");

  if (isStatic) return NextResponse.next();

  if (isApi) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      try {
        await jwtVerify(token, SECRET);
        return NextResponse.next();
      } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("session")?.value;
  let isAuthenticated = false;

  if (sessionCookie) {
    try {
      await jwtVerify(sessionCookie, SECRET);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  if (isProtected && !isAuthenticated) {
    const locale = pathname.match(/^\/(ar|en)/)?.[1] || "ar";
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublic && isAuthenticated && pathWithoutLocale === "/login") {
    const locale = pathname.match(/^\/(ar|en)/)?.[1] || "ar";
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
