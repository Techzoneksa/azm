import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const adminPaths = [
  "/dashboard", "/readiness", "/company", "/compliance",
  "/official-links", "/drivers", "/vehicles", "/users", "/settings",
  "/partners", "/contracts", "/pickup-points", "/coverage-areas",
  "/shipments", "/dispatch", "/returns", "/reports",
];

const driverPaths = ["/driver"];

const publicPaths = ["/login"];

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "azm-flow-secret"
);

interface JwtPayload {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

async function verifySession(
  cookie: string | undefined
): Promise<JwtPayload | null> {
  if (!cookie) return null;
  try {
    const { payload } = await jwtVerify(cookie, SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathWithoutLocale = pathname.replace(/^\/(ar|en)/, "") || "/";

  const isAdminPath = adminPaths.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + "/")
  );
  const isDriverPath = driverPaths.some(
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
  const session = await verifySession(sessionCookie);
  const isAuthenticated = session !== null;
  const isDriver = session?.roles?.includes("DRIVER") ?? false;

  // Redirect DRIVER away from admin paths
  if (isDriver && isAdminPath) {
    const locale = pathname.match(/^\/(ar|en)/)?.[1] || "ar";
    return NextResponse.redirect(new URL(`/${locale}/driver`, request.url));
  }

  // Redirect non-DRIVER away from driver paths
  if (isDriverPath && isAuthenticated && !isDriver) {
    const locale = pathname.match(/^\/(ar|en)/)?.[1] || "ar";
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  // Require auth for admin paths
  if (isAdminPath && !isAuthenticated) {
    const locale = pathname.match(/^\/(ar|en)/)?.[1] || "ar";
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Require auth for driver paths
  if (isDriverPath && !isAuthenticated) {
    const locale = pathname.match(/^\/(ar|en)/)?.[1] || "ar";
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from /login based on role
  if (isPublic && isAuthenticated && pathWithoutLocale === "/login") {
    const locale = pathname.match(/^\/(ar|en)/)?.[1] || "ar";
    const target = isDriver ? "driver" : "dashboard";
    return NextResponse.redirect(new URL(`/${locale}/${target}`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
