# Life OS — Upgrade Guide

## New files to add

```
pages/
  api/
    coach.js        ← NEW: Server-side proxy for AI Coach (avoids CORS)
  calendar.js       ← NEW: Calendar heatmap with day detail view
  reports.js        ← NEW: Weekly/monthly analytics & charts
  coach.js          ← NEW: AI coaching chat (uses /api/coach)
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
ANTHROPIC_API_KEY=your_anthropic_api_key   ← NEW: for AI Coach
```

Get your Anthropic API key at: https://console.anthropic.com

## What's new

- **Calendar** (`/calendar`) — Color-coded heatmap, click any day for details, 12-week strip
- **Reports** (`/reports`) — Score trend, study/screen charts, radar chart, best/worst day
- **AI Coach** (`/coach`) — Chat with Claude using your actual data as context
- **Achievements** (`/achievements`) — 12 achievements, 4 live streak counters
- **Dashboard** — Mini heatmap, quick-action tiles, study streak, week-over-week delta

## Notes

- The existing `checkin.js`, `history.js`, `goals.js`, `_app.js` are unchanged
- The Nav in `index.js` is exported and used by all pages — it now has 8 links
- All new pages import `{ Nav }` from `./index` as before
