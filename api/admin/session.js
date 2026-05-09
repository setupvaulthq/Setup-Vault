import { hasAuthenticatedSession } from "./_auth.js";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const authenticated = hasAuthenticatedSession(req);
  if (!authenticated) {
    return res.status(401).json({ ok: true, authenticated: false });
  }

  return res.status(200).json({ ok: true, authenticated: true });
}
