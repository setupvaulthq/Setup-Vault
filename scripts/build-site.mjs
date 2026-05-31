import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PARTIALS_DIR = path.join(ROOT, "src", "partials");
const TEMPLATES_DIR = path.join(ROOT, "src", "templates");

const SITE_CSS_VERSION = "13";
const RENDER_VERSION = "3.7";
const SHELL_VERSION = "3";

function readPartial(name) {
  return fs.readFileSync(path.join(PARTIALS_DIR, `${name}.html`), "utf8");
}

function expandIncludes(content, vars) {
  let result = content;
  result = result.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => {
    return expandIncludes(readPartial(name), vars);
  });
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value ?? "");
  }
  return result;
}

const pages = [
  {
    template: "index.html",
    output: "index.html",
    vars: {
      PAGE_ID: "home",
      BODY_ATTRS: "",
      TITLE: "Setup Vault | Premium Workspace Gear",
      DESCRIPTION:
        "Discover clean, minimalist workspace inspiration and premium curated battlestation gear. Elevate your desk setup with expert-picked monitors, peripherals, and PC builds.",
      CANONICAL: "https://www.setupvaulthq.com/",
      OG_TITLE: "Setup Vault | Premium Workspace Gear",
      OG_DESCRIPTION:
        "Discover the ultimate clean & minimalist workspace inspiration. Elevate your battlestation today with premium curated gear.",
      OG_IMAGE: "https://www.setupvaulthq.com/stealth_op.jfif",
      OG_URL: "https://www.setupvaulthq.com/",
      MOBILE_BAR: "default",
      EXTRA_HEAD: ""
    }
  },
  {
    template: "zen.html",
    output: "zen.html",
    vars: {
      PAGE_ID: "zen",
      BODY_ATTRS: ' data-theme="zen"',
      TITLE: "Zen Workspace Gear | Setup Vault",
      DESCRIPTION:
        "Curated Zen (Angel) workspace peripherals—keyboards, mice, headsets, monitors, and desk essentials in a clean, minimalist aesthetic.",
      CANONICAL: "https://www.setupvaulthq.com/zen.html",
      OG_TITLE: "Zen Workspace Gear | Setup Vault",
      OG_DESCRIPTION: "Hand-picked Zen build peripherals and desk gear with honest value tiers.",
      OG_IMAGE: "https://www.setupvaulthq.com/stealth_op.jfif",
      OG_URL: "https://www.setupvaulthq.com/zen.html",
      MOBILE_BAR: "default",
      EXTRA_HEAD: ""
    }
  },
  {
    template: "stealth.html",
    output: "stealth.html",
    vars: {
      PAGE_ID: "stealth",
      BODY_ATTRS: ' data-theme="stealth"',
      TITLE: "Stealth Operator Gear | Setup Vault",
      DESCRIPTION:
        "Stealth Operator peripherals—all-black battlestation picks: mice, keyboards, headsets, monitors, and desk accessories.",
      CANONICAL: "https://www.setupvaulthq.com/stealth.html",
      OG_TITLE: "Stealth Operator Gear | Setup Vault",
      OG_DESCRIPTION: "Dark-aesthetic curated gear with value tiers for the Stealth build.",
      OG_IMAGE: "https://www.setupvaulthq.com/stealth_op.jfif",
      OG_URL: "https://www.setupvaulthq.com/stealth.html",
      MOBILE_BAR: "default",
      EXTRA_HEAD: ""
    }
  },
  {
    template: "noir.html",
    output: "noir.html",
    vars: {
      PAGE_ID: "noir",
      BODY_ATTRS: ' class="theme-noir" data-theme="noir"',
      TITLE: "Vault Noir Build | Setup Vault",
      DESCRIPTION:
        "Vault Noir — heavy artillery battlestation built for streamers, esports grinders and creators. RTX 5080 + Core Ultra 9 firepower, hand-curated above Stealth Operator.",
      CANONICAL: "https://www.setupvaulthq.com/noir.html",
      OG_TITLE: "Vault Noir Build | Setup Vault",
      OG_DESCRIPTION:
        "The heavy-artillery rig for streamers and esports creators — RTX 5080, Core Ultra 9, blackout chassis.",
      OG_IMAGE: "https://www.setupvaulthq.com/noir_setup.jpg",
      OG_URL: "https://www.setupvaulthq.com/noir.html",
      MOBILE_BAR: "noir",
      EXTRA_HEAD: ""
    }
  },
  {
    template: "gear.html",
    output: "gear.html",
    vars: {
      PAGE_ID: "gear",
      BODY_ATTRS: "",
      TITLE: "Gear Library | Setup Vault",
      DESCRIPTION:
        "Browse Setup Vault gear by category—keyboards, mice, headsets, monitors, desk mats, desk organizers, and lighting. Zen and Stealth picks together.",
      CANONICAL: "https://www.setupvaulthq.com/gear.html",
      OG_TITLE: "Gear Library | Setup Vault",
      OG_DESCRIPTION: "Category tabs with Zen and Stealth products side by side.",
      OG_IMAGE: "https://www.setupvaulthq.com/stealth_op.jfif",
      OG_URL: "https://www.setupvaulthq.com/gear.html",
      MOBILE_BAR: "default",
      EXTRA_HEAD: ""
    }
  }
];

const sharedVars = {
  CSS_VERSION: SITE_CSS_VERSION,
  RENDER_VERSION: RENDER_VERSION,
  SHELL_VERSION: SHELL_VERSION
};

let built = 0;
for (const page of pages) {
  const templatePath = path.join(TEMPLATES_DIR, page.template);
  const mainContent = fs.readFileSync(templatePath, "utf8");
  const mobileBarPartial =
    page.vars.MOBILE_BAR === "noir"
      ? readPartial("mobile-bottom-bar-noir")
      : readPartial("mobile-bottom-bar-default");
  const layout = readPartial("layout-shell");
  const html = expandIncludes(layout, {
    ...sharedVars,
    ...page.vars,
    MAIN_CONTENT: mainContent,
    MOBILE_BAR_PARTIAL: mobileBarPartial
  });
  fs.writeFileSync(path.join(ROOT, page.output), html, "utf8");
  built += 1;
  console.log(`Built ${page.output}`);
}

console.log(`Done — ${built} pages written.`);
