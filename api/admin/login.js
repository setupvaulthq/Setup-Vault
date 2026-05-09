const {
  getSecrets,
  createSessionToken,
  sessionCookie
} = require("./_auth");

module.exports = function handler(req, res) {
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

  const password = (req.body && req.body.password) || "";
  if (password !== adminPassword) {
    return res.status(401).json({ ok: false, error: "Invalid credentials" });
  }

  const token = createSessionToken(sessionSecret);
  res.setHeader("Set-Cookie", sessionCookie(token));
  return res.status(200).json({ ok: true });
};
