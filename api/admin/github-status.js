/**
 * Returns whether server-side GitHub commit is configured (no secrets exposed).
 */
export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const token = String(process.env.GITHUB_TOKEN || "").trim();
  const owner = String(process.env.GITHUB_OWNER || "").trim();
  const repo = String(process.env.GITHUB_REPO || "").trim();

  return res.status(200).json({
    ok: true,
    saveAvailable: Boolean(token && owner && repo)
  });
}
