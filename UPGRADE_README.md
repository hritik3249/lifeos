# Life OS — Upgrade Guide

## New files to add

```
pages/
  api/
    coach.js        ← NEW: Server-side proxy for AI Coach (uses Gemini — FREE)
  calendar.js       ← NEW: Calendar heatmap with day detail view
  reports.js        ← NEW: Weekly/monthly analytics & charts
  coach.js          ← NEW: AI coaching chat
  achievements.js   ← NEW: Streaks & achievement system
  index.js          ← REPLACE: Upgraded dashboard
lib/
  scoring.js        ← REPLACE: Added streaks, achievements, weekly report
styles/
  globals.css       ← REPLACE: Refined animations & styles
```

## Environment variables

Add to your `.env.local` AND Vercel dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key   ← NEW: for AI Coach (FREE)
```

## How to get your FREE Gemini API key

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API key"
4. Copy the key — no credit card needed, free tier is generous
5. Paste it as GEMINI_API_KEY in .env.local and Vercel

## What's new

- **Calendar** (`/calendar`) — Color-coded heatmap, click any day for details, 12-week strip
- **Reports** (`/reports`) — Score trend, study/screen charts, radar chart, best/worst day
- **AI Coach** (`/coach`) — Chat powered by Google Gemini (FREE) using your actual data
- **Achievements** (`/achievements`) — 12 achievements, 4 live streak counters
- **Dashboard** — Mini heatmap, quick-action tiles, study streak, week-over-week delta

## Notes

- The existing checkin.js, history.js, goals.js, _app.js are unchanged
- The Nav in index.js is exported and used by all pages — it now has 8 links
- Gemini 2.0 Flash is used — it's fast, free, and very capable
