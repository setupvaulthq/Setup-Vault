import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const fontsDir = path.join(root, "fonts");
fs.mkdirSync(fontsDir, { recursive: true });

const cssRes = await fetch(
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;500;700;900&display=swap",
  {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    },
  },
);
const css = await cssRes.text();
const re = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/g;
const urls = [...css.matchAll(re)].map((m) => m[1]);
const uniq = [...new Set(urls)];
let i = 0;
const lines = [];
for (const u of uniq) {
  const buf = Buffer.from(await (await fetch(u)).arrayBuffer());
  const file = `inter-${i}.woff2`;
  fs.writeFileSync(path.join(fontsDir, file), buf);
  lines.push(`/* ${file} <= ${u} */`);
  i++;
}
fs.writeFileSync(path.join(fontsDir, "sources.txt"), lines.join("\n"));
console.log("Saved", i, "woff2 files to fonts/");
