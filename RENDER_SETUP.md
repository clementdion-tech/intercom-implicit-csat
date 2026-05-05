# Render Deployment Guide

## Prerequisites

1. GitHub repo created at `github.com/USERNAME/intercom-implicit-csat`
2. Supabase database provisioned (see [SUPABASE_SETUP.md](SUPABASE_SETUP.md))
3. All environment variables ready (see `.env.example`)

---

## Service 1 — Backend API (Web Service)

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo: `intercom-implicit-csat`
3. Configure:

| Field | Value |
|-------|-------|
| Name | `intercom-csat-api` |
| Environment | `Node` |
| Region | Same as Supabase |
| Branch | `main` |
| Root Directory | _(leave blank)_ |
| Build Command | `npm install && npx prisma generate && npx prisma migrate deploy && npm run build` |
| Start Command | `npm run start` |
| Instance Type | Free |

4. **Environment Variables** — add all of the following:

```
INTERCOM_ACCESS_TOKEN=
ANTHROPIC_API_KEY=
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
CANVAS_WEBHOOK_SECRET=
SLACK_WEBHOOK_URL=
PORT=3000
DASHBOARD_SECRET=
NEXT_PUBLIC_API_URL=https://intercom-csat-api.onrender.com
BATCH_CONCURRENCY=10
SCHEDULE_CRON=*/30 * * * *
```

5. Click **Create Web Service**

### Free tier notes

- Spins down after **15 minutes** of inactivity
- First request after sleep takes ~30s to wake up
- Add [UptimeRobot](https://uptimerobot.com) free monitor:
  - URL: `https://intercom-csat-api.onrender.com/health`
  - Interval: every 5 minutes
  - This prevents sleeping entirely

---

## Service 2 — Dashboard (Static Site)

1. Go to Render → **New → Static Site**
2. Connect the same GitHub repo
3. Configure:

| Field | Value |
|-------|-------|
| Name | `intercom-csat-dashboard` |
| Branch | `main` |
| Root Directory | `dashboard` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `out` |

4. **Environment Variables**:

```
NEXT_PUBLIC_API_URL=https://intercom-csat-api.onrender.com
```

5. Click **Create Static Site**

### Static site notes

- Zero cold start — always fast
- Rebuilds automatically on every push to `main`
- CORS: the backend already allows `*` — restrict `DASHBOARD_ORIGIN` in production if needed

---

## Intercom Canvas Kit Setup

1. Go to your Intercom app → **Settings → Canvas Kit** (or via Developer Hub)
2. Create a new app:
   - Initialize URL: `https://intercom-csat-api.onrender.com/canvas/initialize`
   - Submit URL: `https://intercom-csat-api.onrender.com/canvas/submit`
3. Copy the **webhook secret** → paste as `CANVAS_WEBHOOK_SECRET` in Render env vars
4. Install the app in your Intercom workspace

---

## Intercom Webhook Setup

1. Go to **Settings → Webhooks**
2. Add webhook URL: `https://intercom-csat-api.onrender.com/api/webhook/intercom`
3. Subscribe to topics:
   - `conversation.user.created`
   - `conversation.user.replied`
   - `conversation.admin.closed`
   - `conversation.admin.replied`
4. This triggers real-time scoring on every conversation event

---

## GitHub Actions

CI runs automatically on every push to `main`:
- TypeScript type check (backend + dashboard)
- Prisma schema validation
- Render deploys automatically via GitHub integration (no extra config needed)

---

## Post-Deployment Checklist

- [ ] `https://intercom-csat-api.onrender.com/health` returns `{"status":"ok"}`
- [ ] Dashboard loads at `https://intercom-csat-dashboard.onrender.com`
- [ ] UptimeRobot monitor active (ping every 5 min)
- [ ] Intercom Canvas Kit app installed and visible in conversation sidebar
- [ ] Intercom webhook delivering events (check Render logs)
- [ ] Slack webhook sending test alert (POST to `/api/alerts/config`)
- [ ] Run first batch: `npm run batch -- --limit 10 --dry-run`
- [ ] Run first real batch: `npm run batch -- --limit 50`
