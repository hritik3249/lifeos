-- Run this in Supabase SQL Editor to create the required table

create table if not exists checkins (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  date date not null unique,
  sleep numeric(3,1) not null,
  mood integer not null check (mood between 1 and 10),
  energy integer not null check (energy between 1 and 10),
  study_hours numeric(3,1) not null,
  productivity integer not null check (productivity between 1 and 10),
  gym_done boolean not null default false,
  screen_time numeric(3,1) not null,
  anxiety integer not null check (anxiety between 1 and 10),
  win text,
  struggle text,
  score numeric(4,2)
);

-- Enable Row Level Security (optional but recommended)
alter table checkins enable row level security;

-- Allow all operations for anon key (single user app)
create policy "Allow all for anon" on checkins
  for all using (true) with check (true);
