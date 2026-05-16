import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "data/products.json"), "utf8"));
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");

const ids = new Set((data.products || []).filter((p) => p.active).map((p) => p.id));
const htmlIds = [...index.matchAll(/\bid="([a-z0-9-]+)"/gi)].map((m) => m[1]);
const staticPartCards = htmlIds.filter((id) => index.includes(`id="${id}"`) && index.includes("part-card"));

const zen = (data.products || []).filter((p) => p.active && p.section === "zen-workspace");
const stealth = (data.products || []).filter((p) => p.active && p.section === "stealth-operator");

console.log(
  JSON.stringify(
    {
      activeProducts: ids.size,
      zenWorkspace: zen.length,
      stealthOperator: stealth.length,
      indexHasZenDynamic: index.includes('data-dynamic-section="zen-workspace"'),
      indexHasStealthDynamic: index.includes('data-dynamic-section="stealth-operator"'),
      staticPartCardIdsInIndex: staticPartCards.filter((id) =>
        ["angel-keyboard", "stealth-mouse"].includes(id)
      ),
    },
    null,
    2
  )
);
