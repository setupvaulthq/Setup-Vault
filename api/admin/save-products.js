import { hasAuthenticatedSession } from "./_auth.js";

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body != null && typeof req.body === "object") {
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

function isValidShape(data) {
  if (!data || typeof data !== "object") return false;
  if (!Array.isArray(data.products)) return false;
  if (!Array.isArray(data.topPicks)) return false;
  return true;
}

function contentsApiUrl(owner, repo, filePath) {
  const segments = filePath.replace(/^\/+/, "").split("/").map(encodeURIComponent);
  return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${segments.join("/")}`;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    if (!hasAuthenticatedSession(req)) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const token = String(process.env.GITHUB_TOKEN || "").trim();
    const owner = String(process.env.GITHUB_OWNER || "").trim();
    const repo = String(process.env.GITHUB_REPO || "").trim();
    const branch = String(process.env.GITHUB_BRANCH || "main").trim();
    const filePath = String(
      process.env.GITHUB_PRODUCTS_PATH || "data/products.json"
    ).trim();

    if (!token || !owner || !repo) {
      return res.status(503).json({
        ok: false,
        error: "GitHub kaydı kapalı",
        hint:
          "Vercel ortamına GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO ekleyin (bkz. VERCEL_ADMIN_SETUP.md)."
      });
    }

    const data = await readBody(req);
    if (!isValidShape(data)) {
      return res.status(400).json({
        ok: false,
        error: "Geçersiz JSON: products[] ve topPicks[] gerekli."
      });
    }

    const jsonText = JSON.stringify(data, null, 2);
    const content = Buffer.from(jsonText, "utf8").toString("base64");
    const url = contentsApiUrl(owner, repo, filePath);
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "SetupVault-Admin-Save"
    };

    const getRes = await fetch(`${url}?ref=${encodeURIComponent(branch)}`, {
      method: "GET",
      headers
    });

    let sha = null;
    if (getRes.ok) {
      const meta = await getRes.json();
      sha = meta.sha || null;
    } else if (getRes.status !== 404) {
      const errText = await getRes.text();
      console.warn("[save-products] github get failed", getRes.status, errText);
      return res.status(502).json({
        ok: false,
        error: "GitHub dosyası okunamadı",
        detail: errText.slice(0, 500)
      });
    }

    const message = `chore(data): update products.json via admin (${new Date().toISOString().slice(0, 10)})`;
    const putBody = {
      message,
      content,
      branch
    };
    if (sha) putBody.sha = sha;

    const putRes = await fetch(url, {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(putBody)
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      console.warn("[save-products] github put failed", putRes.status, errText);
      return res.status(502).json({
        ok: false,
        error: "GitHub'a yazılamadı",
        detail: errText.slice(0, 800)
      });
    }

    const result = await putRes.json().catch(function() {
      return {};
    });

    return res.status(200).json({
      ok: true,
      commit: result.commit && result.commit.sha ? result.commit.sha : null,
      message: "GitHub'a yazıldı. Vercel otomatik deploy edecek; ~1–2 dk sonra sitede görünür."
    });
  } catch (err) {
    console.error("[save-products]", err);
    return res.status(500).json({
      ok: false,
      error: "Sunucu hatası",
      detail: err && err.message ? err.message : "Unknown"
    });
  }
}
