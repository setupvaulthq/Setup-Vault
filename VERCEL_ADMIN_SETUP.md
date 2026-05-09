# Vercel Admin Auth Setup

## 1) Add environment variables in Vercel

Project Settings -> Environment Variables:

- `ADMIN_PASSWORD`: long random admin password
- `ADMIN_SESSION_SECRET`: long random secret used to sign session cookie

Use different values for Preview and Production.

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
