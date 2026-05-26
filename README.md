# Life OS — Setup Guide

A personal life tracking app built with Next.js, Supabase, and deployed on Vercel.

---

## Step 1 — Set up Supabase database

1. Go to your Supabase project: https://wwddpwmshsoprgcibpyg.supabase.co
2. Click **SQL Editor** in the left sidebar
3. Paste and run the contents of `supabase-schema.sql`
4. You should see a `checkins` table created under **Table Editor**

---

## Step 2 — Deploy to Vercel

### Option A — Via GitHub (recommended)

1. Create a new GitHub repository (private)
2. Push this entire folder:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/lifeos.git
   git push -u origin main
   ```
3. Go to https://vercel.com → New Project → Import your GitHub repo
4. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://wwddpwmshsoprgcibpyg.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
5. Click **Deploy**

### Option B — Via Vercel CLI

```bash
npm install -g vercel
cd lifeos
vercel
```
Follow the prompts. Add env vars when asked.

---

## Step 3 — Test locally (optional)

```bash
npm install
npm run dev
```

Open http://localhost:3000

---

## App structure

```
pages/
  index.js      — Dashboard (scores, chart, patterns)
  checkin.js    — Daily check-in form
  history.js    — All past entries
  goals.js      — Goals and CAT battle plan
lib/
  supabase.js   — Database client
  scoring.js    — Score calculation and feedback engine
styles/
  globals.css   — Dark theme, fonts, components
```

---

## Features

- Daily check-in with 8 tracked metrics
- Live score calculated as you fill in the form
- Supabase stores all data persistently
- Dashboard with 7-day trend chart
- Automated pattern detection
- Personalized feedback after each check-in
- Full history with expandable entries
- Goals page with your CAT battle plan

---

## Important note on .env.local

The `.env.local` file contains your Supabase credentials.
It is gitignored and will NOT be pushed to GitHub.
You must add the env vars manually in Vercel dashboard.
