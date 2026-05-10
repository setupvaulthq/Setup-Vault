import { hasAuthenticatedSession } from "./_auth.js";

const MAX_DECODED_BYTES = 3 * 1024 * 1024; // ~3 MiB raw — JSON base64 stays under typical serverless body limits

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

function contentsApiUrl(owner, repo, filePath) {
  const segments = filePath
    .replace(/^\/+/, "")
    .split("/")
    .map(encodeURIComponent);
  return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${segments.join("/")}`;
}

function extFromMime(mime) {
  const m = String(mime || "").toLowerCase();
  if (m === "image/jpeg" || m === "image/jpg") return ".jpg";
  if (m === "image/png") return ".png";
  if (m === "image/webp") return ".webp";
  if (m === "image/jfif" || m === "image/pjpeg") return ".jfif";
  return "";
}

function sniffImageExt(buffer) {
  if (!buffer || buffer.length < 12) return "";
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return ".jpg";
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return ".png";
  }
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return ".webp";
  }
  return "";
}

function sanitizeRepoFilename(input, fallbackExtNoDot) {
  const base = String(input || "")
    .trim()
    .split(/[/\\]/)
    .pop();
  if (!base) return "";
  let cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  const extNoDot = String(fallbackExtNoDot || "jpg").replace(/^\./, "");
  if (!/\.(jpe?g|png|webp|jfif)$/i.test(cleaned)) {
    cleaned = `${cleaned.replace(/\.+$/g, "")}.${extNoDot}`;
  }
  if (cleaned.length > 120) cleaned = cleaned.slice(0, 120);
  if (!/\.(jpe?g|png|webp|jfif)$/i.test(cleaned)) return "";
  return cleaned;
}

function forceExtensionToSniffed(filename, sniffed) {
  const sniff = String(sniffed || "").toLowerCase();
  if (!sniff || !filename) return filename;
  const base = String(filename).replace(/\.[^.]+$/i, "");
  return base + sniff;
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
    const assetPrefix = String(process.env.GITHUB_ASSET_PREFIX || "").trim().replace(/^\/+|\/+$/g, "");

    if (!token || !owner || !repo) {
      return res.status(503).json({
        ok: false,
        error: "GitHub yükleme kapalı",
        hint:
          "Vercel ortamına GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO ekleyin (bkz. VERCEL_ADMIN_SETUP.md)."
      });
    }

    const body = await readBody(req);
    const contentBase64 = String(body.contentBase64 || "").replace(/\s/g, "");
    if (!contentBase64) {
      return res.status(400).json({ ok: false, error: "contentBase64 gerekli." });
    }

    let buffer;
    try {
      buffer = Buffer.from(contentBase64, "base64");
    } catch (err) {
      return res.status(400).json({ ok: false, error: "Geçersiz base64." });
    }

    if (!buffer.length) {
      return res.status(400).json({ ok: false, error: "Boş dosya." });
    }
    if (buffer.length > MAX_DECODED_BYTES) {
      return res.status(413).json({
        ok: false,
        error: `Dosya çok büyük (en fazla ${Math.floor(MAX_DECODED_BYTES / (1024 * 1024))} MiB).`
      });
    }

    const sniffed = sniffImageExt(buffer);
    if (!sniffed) {
      return res.status(400).json({
        ok: false,
        error: "Desteklenmeyen görsel türü (yalnızca JPEG, PNG, WebP)."
      });
    }

    const mimeExt = extFromMime(body.contentType);
    const extNoDot = (sniffed || mimeExt || ".jpg").replace(/^\./, "");
    const preferred =
      String(body.targetFilename || body.filename || "").trim() ||
      String(body.originalFilename || "").trim();
    let filePath = sanitizeRepoFilename(preferred, extNoDot);
    if (!filePath) {
      filePath = `gear-upload-${Date.now()}${sniffed}`;
    } else {
      filePath = forceExtensionToSniffed(filePath, sniffed);
    }

    if (assetPrefix) {
      filePath = `${assetPrefix}/${filePath}`.replace(/\/{2,}/g, "/");
    }

    const githubContent = buffer.toString("base64");
    const url = contentsApiUrl(owner, repo, filePath);
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "SetupVault-Admin-Upload"
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
      console.warn("[upload-asset] github get failed", getRes.status, errText);
      return res.status(502).json({
        ok: false,
        error: "GitHub dosyası okunamadı",
        detail: errText.slice(0, 500)
      });
    }

    const message = `chore(assets): upload ${filePath} via admin (${new Date().toISOString().slice(0, 10)})`;
    const putBody = {
      message,
      content: githubContent,
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
      console.warn("[upload-asset] github put failed", putRes.status, errText);
      return res.status(502).json({
        ok: false,
        error: "GitHub'a yüklenemedi",
        detail: errText.slice(0, 800)
      });
    }

    const basename = filePath.includes("/")
      ? filePath.slice(filePath.lastIndexOf("/") + 1)
      : filePath;

    return res.status(200).json({
      ok: true,
      path: basename,
      fullPath: filePath,
      message:
        "Görsel GitHub'a yazıldı. Vercel deploy sonrası sitede görünür; Image alanına dosya adı yazıldı."
    });
  } catch (err) {
    console.error("[upload-asset]", err);
    return res.status(500).json({
      ok: false,
      error: "Sunucu hatası",
      detail: err && err.message ? err.message : "Unknown"
    });
  }
}
