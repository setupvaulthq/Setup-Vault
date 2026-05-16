# 5-Day Campaign Launch Checklist

## Conversion
- Confirm every visible product card has one primary CTA (`Check Current Price on Amazon`; PC internals use `See Amazon Discount`).
- Verify trust text appears in both top section and product cards.
- Test `#hash` deep links from Pinterest on mobile and desktop.
- Test exit-intent popup once per session (desktop mouse to top edge; mobile fast scroll up). Cookie banner should block exit-intent while visible.

## Tracking
- Test `Amazon_Click` event in Pinterest and GA with:
  - `product_id`
  - `setup_type` (including `exit_intent` for popup CTA)
  - `price_tier`
  - `traffic_source`
  - `campaign_id`
  - `creative_id`
  - `device_type`
  - `day_stamp`
- Click at least 3 products and confirm `localStorage.sv_click_log` is being appended.

## Content Scale
- Add or edit products in `data/products.json` only (home Zen/Stealth grids are JSON-driven).
- Confirm IDs in JSON match hash anchors (`#angel-keyboard`, `#stealth-pc-unit`, etc.).
- Update `topPicks` list in JSON and confirm top pick cards refresh.

## SEO & Performance
- Run `npm run optimize:images` after adding new product photos.
- Check one page run in Lighthouse (mobile first): focus on LCP and CLS.
- Confirm non-critical product images use `loading="lazy"`.
- Keep title/meta description aligned with active campaign wording.

## Trust & Compliance
- Ensure Amazon associate disclosure is visible before purchase intent moments.
- Validate Privacy and Terms modal content (keyboard: Tab trap, Escape to close).
- Confirm contact mail link works.

## Final Smoke Test
- Run `node scripts/audit-products.mjs` and `npm run smoke:site` (or local server + Playwright).
- Mobile:
  - open from a pin link with `utm_source=pinterest&day=1`
  - click two products
  - close/open focus mode
- Desktop:
  - verify left sidebar scrollbar matches dark theme
  - verify top picks and build grids render from JSON
  - verify focus card does not clip
