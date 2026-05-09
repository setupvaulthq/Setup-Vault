const {
  getSecrets,
  createSessionToken,
  sessionCookie
} = require("./_auth");

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

module.exports = async function handler(req, res) {
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

    const body = await readBody(req);
    const password = (body && body.password ? String(body.password) : "").trim();
    if (password !== adminPassword) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const token = createSessionToken(sessionSecret);
    res.setHeader("Set-Cookie", sessionCookie(token));
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Login endpoint failed",
      detail: err && err.message ? err.message : "Unknown error"
    });
  }
};
