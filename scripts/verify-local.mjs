/**
 * Local end-to-end verification for the built site.
 *
 * Serves the repo root over HTTP (never file://, where fetch of
 * data/products.json is blocked) and drives it with Playwright to assert:
 *   - per-page product hooks render (counts derived from data/products.json)
 *   - zero console errors on every page
 *   - hash deep-link engages focus mode (and auto-opens a closed accordion)
 *   - analytics are consent-gated (no GA/Pinterest before "Accept")
 *
 * Run:  node scripts/build-site.mjs && node scripts/verify-local.mjs
 */
import { createServer } from "http";
import { readFile } from "fs/promises";
import { extname, join } from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".jfif": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

const data = JSON.parse(await readFile(join(ROOT, "data/products.json"), "utf8"));
const activeProducts = (data.products || []).filter((p) => p.active);
const categoriesWithProducts = (data.categories || []).filter((c) =>
  activeProducts.some((p) => p.category === c.id)
).length;
const expectTopPicks = Math.min(3, (data.topPicks || []).length);
const expectGearTabs = categoriesWithProducts;

const failures = [];
function check(name, cond, detail) {
  if (cond) {
    console.log(`  ok   ${name}`);
  } else {
    console.log(`  FAIL ${name} — ${detail}`);
    failures.push(name);
  }
}

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p === "/") p = "/index.html";
    const buf = await readFile(join(ROOT, p));
    res.writeHead(200, { "Content-Type": MIME[extname(p)] || "application/octet-stream" });
    res.end(buf);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
const browser = await chromium.launch();

async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  return { page, errors };
}

// ---- Per-page hooks + zero console errors -------------------------------
const pageExpect = {
  "index.html": (c) => {
    check("index topPicks", c.topPicks === expectTopPicks, `${c.topPicks} != ${expectTopPicks}`);
    check("index tierChips=4", c.tierChips === 4, `${c.tierChips}`);
    check("index spotlights=6", c.spotlights === 6, `${c.spotlights}`);
    check("index dynamic grids populated", c.dynamicNonEmpty === c.dynamicTotal, `${c.dynamicNonEmpty}/${c.dynamicTotal}`);
    check("index build accordions collapsed by default", c.openAccordions === 0, `${c.openAccordions} open`);
    check("index no gear mount", c.gearMount === 0, "mount still present");
  },
  "zen.html": (c) => check("zen grid populated", c.dynamicNonEmpty > 0 && c.partCards > 0, `${c.partCards} cards`),
  "stealth.html": (c) => check("stealth grid populated", c.dynamicNonEmpty > 0 && c.partCards > 0, `${c.partCards} cards`),
  "noir.html": (c) => {
    check("noir products visible (not coming-soon)", c.noirWrapVisible, "wrap hidden");
    check("noir grid populated", c.partCards > 0, `${c.partCards} cards`);
  },
  "gear.html": (c) => check(`gear tabs=${expectGearTabs}`, c.tabs === expectGearTabs, `${c.tabs}`),
};

for (const pg of Object.keys(pageExpect)) {
  const { page, errors } = await openPage();
  await page.goto(`${base}/${pg}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const counts = await page.evaluate(() => {
    const grids = [...document.querySelectorAll("[data-dynamic-section]")];
    return {
      topPicks: document.querySelectorAll("#topPicksGrid .pick-card").length,
      tierChips: document.querySelectorAll("#tierFilterChips .tier-chip").length,
      spotlights: document.querySelectorAll("#categorySpotlightGrid .spotlight-card").length,
      tabs: document.querySelectorAll("#categoryTabs .catalog-tab").length,
      partCards: document.querySelectorAll(".setup-content-grid .part-card").length,
      dynamicTotal: grids.length,
      dynamicNonEmpty: grids.filter((g) => g.querySelector(".part-card")).length,
      openAccordions: document.querySelectorAll("section .parts-accordion[open]").length,
      gearMount: document.querySelectorAll("#gearLibraryHomeMount").length,
      noirWrapVisible: (() => {
        const w = document.querySelector("[data-noir-products-wrap]");
        return !!w && !w.hasAttribute("hidden");
      })(),
    };
  });
  console.log(`\n[${pg}]`);
  pageExpect[pg](counts);
  check(`${pg} zero console errors`, errors.length === 0, errors.join(" | "));
  await page.close();
}

// ---- Deep-link focus mode (auto-opens closed accordion on home) ----------
{
  const { page, errors } = await openPage();
  await page.goto(`${base}/index.html#angel-keyboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  const r = await page.evaluate(() => {
    const card = document.getElementById("angel-keyboard");
    const details = card ? card.closest("details") : null;
    return {
      focusMode: document.body.classList.contains("focus-mode"),
      targetFocus: !!document.querySelector("#angel-keyboard.target-focus"),
      detailsOpen: details ? details.open : null,
    };
  });
  console.log("\n[deep-link index.html#angel-keyboard]");
  check("focus mode engaged", r.focusMode, "no focus-mode");
  check("target card focused", r.targetFocus, "no target-focus");
  check("closed accordion auto-opened", r.detailsOpen === true, `details.open=${r.detailsOpen}`);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  const esc = await page.evaluate(() => document.body.classList.contains("focus-mode"));
  check("Escape exits focus mode", esc === false, "still in focus mode");
  check("deep-link page zero console errors", errors.length === 0, errors.join(" | "));
  await page.close();
}

// ---- Consent gating: no GA/Pinterest before Accept, loads after ----------
{
  const { page } = await openPage();
  const tracker = [];
  page.on("request", (req) => {
    const u = req.url();
    if (/googletagmanager\.com|s\.pinimg\.com/.test(u)) tracker.push(u);
  });
  await page.goto(`${base}/index.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  console.log("\n[consent gating]");
  check("no tracker before consent", tracker.length === 0, tracker.join(" | "));
  const acceptBtn = await page.$("#cookieAcceptBtn");
  check("cookie Accept button present", !!acceptBtn, "missing");
  if (acceptBtn) {
    await acceptBtn.click();
    await page.waitForTimeout(800);
    check("tracker loads after Accept", tracker.length > 0, "no tracker request after accept");
  }
  await page.close();
}

await browser.close();
server.close();

console.log(`\n${failures.length === 0 ? "ALL CHECKS PASSED" : "FAILURES: " + failures.join(", ")}`);
process.exit(failures.length === 0 ? 0 : 1);
