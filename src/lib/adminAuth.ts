import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// Falls back to a random secret generated at process start if SESSION_SECRET
// isn't set — sessions just won't survive a server restart in that case.
// Set SESSION_SECRET in production for persistent admin sessions.
let ephemeralSecret: string | null = null;
function getSessionSecret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (!ephemeralSecret) {
    ephemeralSecret = randomBytes(32).toString("hex");
    console.warn(
      "[adminAuth] SESSION_SECRET is not set — using a random secret for this process. " +
        "Admin sessions will be invalidated on every restart. Set SESSION_SECRET to avoid this."
    );
  }
  return ephemeralSecret;
}

function sign(value: string): string {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function createSessionToken(username: string): string {
  const payload = Buffer.from(
    JSON.stringify({ u: username, exp: Date.now() + ADMIN_SESSION_TTL_MS })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function verifySessionToken(token: string | undefined | null): { username: string } | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (!safeEqual(sign(payload), signature)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as {
      u: string;
      exp: number;
    };
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    if (typeof data.u !== "string" || !data.u) return null;
    return { username: data.u };
  } catch {
    return null;
  }
}

export function checkAdminCredentials(username: string, password: string): boolean {
  const expectedUsername = process.env.ADMIN_USERNAME || "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    console.warn("[adminAuth] ADMIN_PASSWORD is not set — admin login is disabled.");
    return false;
  }
  return safeEqual(username, expectedUsername) && safeEqual(password, expectedPassword);
}

/** For server components / pages. */
export async function getAdminUsername(): Promise<string | null> {
  const store = await cookies();
  const session = verifySessionToken(store.get(ADMIN_SESSION_COOKIE)?.value);
  return session?.username ?? null;
}

/** For route handlers, where cookies come off the request synchronously. */
export function getAdminUsernameFromRequest(request: NextRequest): string | null {
  const session = verifySessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  return session?.username ?? null;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ADMIN_SESSION_TTL_MS / 1000,
  };
}
