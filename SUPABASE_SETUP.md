# Supabase Setup Guide

## 1. Create a new Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Choose your organization, give it a name (e.g. `intercom-csat`), set a database password, select a region close to your Render deployment
4. Click **Create new project** — wait ~2 minutes for provisioning

## 2. Get your connection strings

1. Go to **Settings → Database**
2. Scroll to **Connection string** section
3. Select the **URI** tab

You need **two** connection strings:

### DATABASE_URL (Pooling — for runtime queries)
- Click **Connection pooling** tab
- Copy the URI (uses port **6543**)
- Append `?pgbouncer=true` if not already present
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true
```

### DIRECT_URL (Direct — for Prisma migrations)
- Click **Session pooler** or the plain **URI** tab
- Copy the URI (uses port **5432**)
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

## 3. Run migrations

With both URLs in your `.env` file:

```bash
# First time setup
npx prisma migrate dev --name init

# Deploy to production (used in Render build command)
npx prisma migrate deploy
```

## 4. Verify the schema

In Supabase Dashboard → **Table Editor**, you should see:
- `Conversation`
- `MessageScore`
- `DailySnapshot`
- `_prisma_migrations`

## 5. Add to Render environment variables

In your Render Web Service, add:
- `DATABASE_URL` — the pooling URL (port 6543)
- `DIRECT_URL` — the direct URL (port 5432)

## Notes

- The free tier gives you 500MB storage and 2 concurrent connections (pooling handles this)
- Enable **Row Level Security** if you want to restrict API access per user
- The free tier pauses after 1 week of inactivity — use UptimeRobot to keep it warm
- Upgrade to Pro ($25/month) for no pause and 8GB storage if traffic grows
