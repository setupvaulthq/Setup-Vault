/**
 * Emit WebP variants for heroes, logo, and product card images.
 * Run: npm run optimize:images
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "img-optimized");
const base = "https://www.setupvaulthq.com";

const heroJobs = [
  { src: "logo.jfif", widths: [130, 260], name: "logo" },
  { src: "ANGEL_SETUP.jfif", widths: [400, 800], name: "angel-setup" },
  { src: "stealth_op.jfif", widths: [400, 800], name: "stealth-op" },
  { src: "Full_Angell.jfif", widths: [400, 800], name: "angel-full" },
  { src: "stealth_setup.jfif", widths: [400, 800], name: "stealth-setup" },
];

const cardWidths = [240, 480];

async function ensureInput(rel) {
  const local = path.join(root, rel);
  if (fs.existsSync(local)) return local;
  const url = `${base}/${rel.replace(/\\/g, "/")}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch ${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(local, buf);
  console.log("Downloaded", rel);
  return local;
}

async function writeWebp(input, widths, namePrefix) {
  for (const w of widths) {
    const out = path.join(outDir, `${namePrefix}-${w}.webp`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await sharp(input)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(out);
    console.log("Wrote", path.relative(root, out));
  }
}

function slugFromFilename(file) {
  return path
    .basename(file, path.extname(file))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const cardSources = fs
  .readdirSync(root)
  .filter((f) => /\.(jpe?g|jfif)$/i.test(f))
  .filter((f) => !["ANGEL_SETUP.jfif", "stealth_op.jfif", "logo.jfif", "Full_Angell.jfif", "stealth_setup.jfif", "noir_full.jfif"].includes(f));

for (const job of heroJobs) {
  try {
    const input = await ensureInput(job.src);
    await writeWebp(input, job.widths, job.name);
  } catch (err) {
    console.warn("Skip hero", job.src, err.message);
  }
}

for (const file of cardSources) {
  try {
    const input = path.join(root, file);
    const name = "card-" + slugFromFilename(file);
    await writeWebp(input, cardWidths, name);
  } catch (err) {
    console.warn("Skip card", file, err.message);
  }
}

console.log("Done.");
