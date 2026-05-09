/**
 * Headless checks: responsive layout + hash focus mode (live site).
 * Run: npx playwright install chromium && node scripts/smoke-site.mjs
 */
import { chromium } from "playwright";

const base = "https://setupvaulthq.com/";

const viewports = [
  { name: "375-mobile", width: 375, height: 812 },
  { name: "768-tablet", width: 768, height: 1024 },
  { name: "1280-desktop", width: 1280, height: 800 },
];

const browser = await chromium.launch({ headless: true });

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 60000 });
  const flexDir = await page.evaluate(() => {
    const el = document.querySelector(".app-layout");
    return el ? getComputedStyle(el).flexDirection : "missing";
  });
  const bottomBarDisplay = await page.evaluate(() => {
    const el = document.querySelector(".mobile-bottom-bar");
    return el ? getComputedStyle(el).display : "missing";
  });
  const sidebarPosition = await page.evaluate(() => {
    const el = document.querySelector(".sidebar");
    return el ? getComputedStyle(el).position : "missing";
  });
  console.log(
    JSON.stringify({
      viewport: vp.name,
      appLayoutFlexDirection: flexDir,
      mobileBottomBarDisplay: bottomBarDisplay,
      sidebarPosition,
    }),
  );
  await page.close();
}

const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(base + "#angel-keyboard", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(600);
const afterHash = await page.evaluate(() => ({
  focusMode: document.body.classList.contains("focus-mode"),
  targetFocus: !!document.querySelector("#angel-keyboard.target-focus"),
}));
console.log(JSON.stringify({ step: "after_hash_angel_keyboard", ...afterHash }));

await page.keyboard.press("Escape");
await page.waitForTimeout(200);
const afterEsc = await page.evaluate(() => ({
  focusMode: document.body.classList.contains("focus-mode"),
}));
console.log(JSON.stringify({ step: "after_escape", ...afterEsc }));

await page.close();
await browser.close();
