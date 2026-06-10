import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

async function fetchText(url) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": "SetupVault-DeployCheck/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

const local = fs.readFileSync(path.join(root, "index.html"), "utf8");
// Catalog data lives in data/products.json (the live, JSON-driven source).
// NOTE: products now render client-side, so product ids no longer appear in
// the static index.html — the id-presence check below is a legacy heuristic.
const data = JSON.parse(fs.readFileSync(path.join(root, "data/products.json"), "utf8"));

const live = await fetchText("https://setupvaulthq.com/");

const ids = data.products.map((p) => p.id);
const missingLocal = [];
const missingLive = [];
for (const id of ids) {
  const needle = `id="${id}"`;
  if (!local.includes(needle)) missingLocal.push(id);
  if (!live.includes(needle)) missingLive.push(id);
}

console.log(
  JSON.stringify(
    {
      bytesLocal: local.length,
      bytesLive: live.length,
      bytesDelta: live.length - local.length,
      productIdsMissingFromLocal: missingLocal,
      productIdsMissingFromLive: missingLive,
      topPicksMatch: data.topPicks.map((p) => ({
        name: p.name,
        inLocal: local.includes(p.name),
        inLive: live.includes(p.name),
      })),
    },
    null,
    2,
  ),
);
