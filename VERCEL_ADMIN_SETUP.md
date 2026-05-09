# Vercel Admin Auth Setup

## 1) Add environment variables in Vercel

Project Settings -> Environment Variables:

- `ADMIN_PASSWORD`: long random admin password
- `ADMIN_SESSION_SECRET`: long random secret used to sign session cookie

Use different values for Preview and Production.

Optional hardening variables:

- `ADMIN_IP_ALLOWLIST`: comma-separated IP list allowed to login (example: `1.2.3.4,5.6.7.8`)

## 2) Deploy

Push this repo, then trigger a Vercel deployment.

## 3) Test

Open `/api/admin/session`:
- Before login: `401` with `authenticated: false`

Open `/admin.html`, login with `ADMIN_PASSWORD`.

Open `/api/admin/session` again:
- After login: `200` with `authenticated: true`

## 4) Rotate password

When you want to change admin password:

1. Update `ADMIN_PASSWORD` in Vercel.
2. Redeploy (or trigger a new deployment).
3. Logout/login again.

No code change is needed to rotate password.

## 5) Security hardening included

- Login rate limiting is enabled (`7` attempts / `10` minutes per IP).
- Failed logins and blocked requests are logged in Vercel Function Logs.
- Optional IP allowlist support with `ADMIN_IP_ALLOWLIST`.

## 6) One-click save to GitHub (optional)

Admin **does not** write to the database; the live site reads `data/products.json` from the repo. To publish catalog changes without manually copying files:

1. Create a GitHub **fine-grained PAT** (or classic PAT) with **Contents: Read and write** on this repository.
2. In Vercel → Environment Variables (Production), add:

   - `GITHUB_TOKEN` — the PAT  
   - `GITHUB_OWNER` — GitHub user or org (example: `setupvaulthq`)  
   - `GITHUB_REPO` — repo name only (example: `Setup-Vault`)  
   - Optional: `GITHUB_BRANCH` (default `main`), `GITHUB_PRODUCTS_PATH` (default `data/products.json`)

3. Redeploy.

After login, admin shows **GitHub’a kaydet → canlı site**. That endpoint (`POST /api/admin/save-products`) commits `data/products.json`; Vercel deploys and the site updates.

If these variables are omitted, use **Download products.json** and replace `data/products.json` locally, then `git push`.
