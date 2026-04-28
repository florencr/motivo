import { UserRole } from "@/app/generated/prisma/enums";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE_NAME = "motivo_session";
const SESSION_TTL_DAYS = 30;

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionTtlSeconds() {
  return SESSION_TTL_DAYS * 24 * 60 * 60;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hashed = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hashed}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;

  const [salt, stored] = parts;
  const computed = scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(stored, "hex");
  const b = Buffer.from(computed, "hex");

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getSessionExpiryDate() {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_TTL_DAYS);
  return date;
}

export function normalizeRole(input?: string) {
  switch ((input ?? "").toUpperCase()) {
    case "BUYER":
      return UserRole.BUYER;
    case "PRIVATE_SELLER":
      return UserRole.PRIVATE_SELLER;
    case "DEALER":
      return UserRole.DEALER;
    default:
      return null;
  }
}
