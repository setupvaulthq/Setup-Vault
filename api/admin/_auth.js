import crypto from "node:crypto";

const COOKIE_NAME = "sv_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = 4 - (normalized.length % 4 || 4);
  return Buffer.from(normalized + "=".repeat(padding), "base64").toString("utf8");
}

function signPayload(payloadText, sessionSecret) {
  return base64UrlEncode(
    crypto.createHmac("sha256", sessionSecret).update(payloadText).digest()
  );
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return header.split(";").reduce((acc, part) => {
    const idx = part.indexOf("=");
    if (idx < 0) return acc;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

function getSecrets() {
  // Trim password so accidental newlines/spaces in Vercel env UI don't break login.
  const adminPassword = String(process.env.ADMIN_PASSWORD || "").trim();
  const sessionSecret = String(process.env.ADMIN_SESSION_SECRET || "").trim();
  return { adminPassword, sessionSecret };
}

function createSessionToken(sessionSecret) {
  const payload = JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  });
  const payloadEncoded = base64UrlEncode(payload);
  const signature = signPayload(payloadEncoded, sessionSecret);
  return `${payloadEncoded}.${signature}`;
}

function verifySessionToken(token, sessionSecret) {
  if (!token || !sessionSecret) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadEncoded, signature] = parts;
  const expectedSig = signPayload(payloadEncoded, sessionSecret);

  const expectedBuf = Buffer.from(expectedSig);
  const actualBuf = Buffer.from(signature);
  if (
    expectedBuf.length !== actualBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, actualBuf)
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded));
    if (!payload || typeof payload.exp !== "number") return false;
    return payload.exp > Math.floor(Date.now() / 1000);
  } catch (err) {
    return false;
  }
}

function sessionCookie(token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(
    token
  )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

function clearSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function hasAuthenticatedSession(req) {
  const { sessionSecret } = getSecrets();
  if (!sessionSecret) return false;
  const cookies = parseCookies(req);
  return verifySessionToken(cookies[COOKIE_NAME] || "", sessionSecret);
}

export {
  getSecrets,
  createSessionToken,
  hasAuthenticatedSession,
  sessionCookie,
  clearSessionCookie
};
