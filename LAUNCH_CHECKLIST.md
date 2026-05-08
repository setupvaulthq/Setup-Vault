# 5-Day Campaign Launch Checklist

## Conversion
- Confirm every visible product card has one primary CTA (`View on Amazon`).
- Verify trust text appears in both top section and product cards.
- Test `#hash` deep links from Pinterest on mobile and desktop.

## Tracking
- Test `Amazon_Click` event in Pinterest and GA with:
  - `product_id`
  - `setup_type`
  - `price_tier`
  - `traffic_source`
  - `campaign_id`
  - `creative_id`
  - `device_type`
  - `day_stamp`
- Click at least 3 products and confirm `localStorage.sv_click_log` is being appended.

## Content Scale
- Add one new product entry in `data/products.json` and confirm schema consistency.
- Validate IDs in JSON match real anchor/card IDs in `index.html`.
- Update `topPicks` list in JSON and confirm top pick cards refresh.

## SEO & Performance
- Check one page run in Lighthouse (mobile first): focus on LCP and CLS.
- Confirm all non-critical product images use `loading="lazy"`.
- Keep title/meta description aligned with active campaign wording.

## Trust & Compliance
- Ensure Amazon associate disclosure is visible before purchase intent moments.
- Validate Privacy and Terms modal content still opens and reads correctly.
- Confirm contact mail link works.

## Final Smoke Test
- Mobile:
  - open from a pin link with `utm_source=pinterest&day=1`
  - click two products
  - close/open focus mode
- Desktop:
  - verify left sidebar and focus card do not clip
  - verify top picks render from JSON
