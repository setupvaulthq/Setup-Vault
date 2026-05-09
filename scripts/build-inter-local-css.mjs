import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const fontsDir = path.join(root, "fonts");

const cssRes = await fetch(
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;500;700;900&display=swap",
  {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    },
  },
);
let css = await cssRes.text();
const urlRe = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
const seen = new Map();
let idx = 0;
css = css.replace(urlRe, (_m, url) => {
  if (!seen.has(url)) {
    seen.set(url, `inter-${idx}.woff2`);
    idx++;
  }
  return `url(./${seen.get(url)})`;
});
fs.writeFileSync(path.join(root, "fonts", "inter-local.css"), css);
console.log("Wrote fonts/inter-local.css with", seen.size, "unique files");
