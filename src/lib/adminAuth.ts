import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "cyberhunt_admin_session";
export const ADMIN_SESSION_MAX_AGE = 8 * 60 * 60;

type AdminSession = {
  username: string;
  expiresAt: number;
};

const isProduction = process.env.NODE_ENV === "production";
const getAdminConfiguration = () => ({
  username: process.env.ADMIN_USERNAME || (isProduction ? undefined : "Ajay"),
  password: process.env.ADMIN_PASSWORD || (isProduction ? undefined : "212006"),
  signingSecret: process.env.ADMIN_SESSION_SECRET || (isProduction ? undefined : "cyberhunt-local-development-session-secret"),
});

const getSigningSecret = () => getAdminConfiguration().signingSecret;

export const getAdminCredentials = () => getAdminConfiguration();

export const secureStringEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

export const createAdminSession = (username: string) => {
  const secret = getSigningSecret();
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters");
  }

  const payload: AdminSession = {
    username,
    expiresAt: Date.now() + ADMIN_SESSION_MAX_AGE * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
};

export const verifyAdminSession = (token?: string | null) => {
  const { signingSecret: secret, username: expectedUsername } = getAdminConfiguration();
  if (!secret || secret.length < 32 || !expectedUsername || !token) return false;

  const [encodedPayload, providedSignature, extraPart] = token.split(".");
  if (!encodedPayload || !providedSignature || extraPart !== undefined) return false;

  const expectedSignature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  if (!secureStringEqual(providedSignature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString()) as AdminSession;
    return payload.username === expectedUsername && Number.isFinite(payload.expiresAt) && payload.expiresAt > Date.now();
  } catch {
    return false;
  }
};

export const getAdminSessionToken = (cookieHeader?: string | null) => {
  const cookie = cookieHeader?.split(";").map(value => value.trim()).find(value => value.startsWith(`${ADMIN_SESSION_COOKIE}=`));
  return cookie ? decodeURIComponent(cookie.slice(ADMIN_SESSION_COOKIE.length + 1)) : null;
};