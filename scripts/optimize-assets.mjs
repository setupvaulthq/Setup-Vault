/**
 * Fetch key images from production (if missing locally) and emit WebP variants.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = "https://www.setupvaulthq.com";

const jobs = [
  { src: "logo.jfif", widths: [130, 260], name: "logo" },
  { src: "ANGEL_SETUP.jfif", widths: [400, 800], name: "angel-setup" },
  { src: "stealth_op.jfif", widths: [400, 800], name: "stealth-op" },
];

async function ensureInput(rel) {
  const local = path.join(root, rel);
  if (fs.existsSync(local)) {
    return local;
  }
  const url = `${base}/${rel}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Fetch ${url} -> ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(local, buf);
  console.log("Downloaded", rel);
  return local;
}

for (const job of jobs) {
  const input = await ensureInput(job.src);
  for (const w of job.widths) {
    const out = path.join(root, `img-optimized`, `${job.name}-${w}.webp`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await sharp(input)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(out);
    console.log("Wrote", path.relative(root, out));
  }
}

console.log("Done.");
