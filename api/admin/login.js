import { getSecrets, createSessionToken, sessionCookie } from "./_auth.js";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 7;
const attemptsByIp = globalThis.__svAdminAttempts || new Map();
globalThis.__svAdminAttempts = attemptsByIp;

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return (
    req.headers["x-real-ip"] ||
    (req.socket && req.socket.remoteAddress) ||
    "unknown"
  );
}

function parseAllowList() {
  return String(process.env.ADMIN_IP_ALLOWLIST || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function consumeAttempt(ip) {
  const now = Date.now();
  const slot = attemptsByIp.get(ip) || { count: 0, firstAt: now };
  if (now - slot.firstAt > RATE_LIMIT_WINDOW_MS) {
    slot.count = 0;
    slot.firstAt = now;
  }
  slot.count += 1;
  attemptsByIp.set(ip, slot);
  return slot;
}

function clearAttempts(ip) {
  attemptsByIp.delete(ip);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === "object") {
      resolve(req.body);
      return;
    }

    if (typeof req.body === "string") {
      try {
        resolve(JSON.parse(req.body || "{}"));
      } catch (err) {
        resolve({});
      }
      return;
    }

    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const { adminPassword, sessionSecret } = getSecrets();
    if (!adminPassword || !sessionSecret) {
      return res.status(500).json({
        ok: false,
        error: "Server auth configuration is missing"
      });
    }

    const clientIp = getClientIp(req);
    const allowList = parseAllowList();
    if (allowList.length > 0 && !allowList.includes(clientIp)) {
      console.warn("[admin-login] ip_not_allowed", { ip: clientIp });
      return res.status(403).json({ ok: false, error: "IP not allowed" });
    }

    const attemptState = consumeAttempt(clientIp);
    if (attemptState.count > RATE_LIMIT_MAX_ATTEMPTS) {
      console.warn("[admin-login] rate_limited", { ip: clientIp });
      return res.status(429).json({
        ok: false,
        error: "Too many attempts. Try again later."
      });
    }

    const body = await readBody(req);
    const password = (body && body.password ? String(body.password) : "").trim();
    if (password !== adminPassword) {
      console.warn("[admin-login] invalid_credentials", { ip: clientIp });
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    clearAttempts(clientIp);
    const token = createSessionToken(sessionSecret);
    res.setHeader("Set-Cookie", sessionCookie(token));
    console.info("[admin-login] success", { ip: clientIp });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Login endpoint failed",
      detail: err && err.message ? err.message : "Unknown error"
    });
  }
}
