import "server-only";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { prisma } from "./prisma";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is required but not configured. Set it in the .env file."
    );
  }
  return new TextEncoder().encode(secret);
}

const SECRET = getJwtSecret();

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getServerSession(): Promise<SessionUser | null> {
  return getSession();
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function requireRole(roles: string[]): Promise<SessionUser> {
  const session = await requireAuth();
  const hasRole = session.roles.some((r) => roles.includes(r));
  if (!hasRole) throw new Error("Forbidden");
  return session;
}

export async function requirePermission(
  permission: string
): Promise<SessionUser> {
  const session = await requireAuth();
  const hasPermission = session.permissions.includes(permission);
  if (!hasPermission) throw new Error("Forbidden");
  return session;
}

export async function loginUser(email: string, password: string) {
  const bcrypt = await import("bcryptjs");
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
    },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return null;
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roles: user.roles.map((ur) => ur.role.name),
    permissions: user.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.name)
    ),
  };

  const token = await createToken(sessionUser);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return { token, user: sessionUser };
}
