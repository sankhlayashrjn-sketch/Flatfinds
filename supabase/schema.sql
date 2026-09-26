-- FlatFinds schema. Run this once in your Supabase project's SQL editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run). Safe to re-run —
-- everything here is idempotent (if-not-exists / drop-then-create).

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Nullable: a group is created with just a name (step 1); the expected
  -- member count is set a screen later (step 2). The check still applies
  -- once it's set — Postgres check constraints don't reject NULLs.
  expected_member_count int check (expected_member_count >= 2),
  created_at timestamptz not null default now(),
  -- Set once the group agrees on a listing (see ShortlistCard's "Mark as
  -- our choice"). finalized_listing_id is a mock listing id (text), not a
  -- foreign key — listings live in code (src/lib/listingPool.ts), not a table.
  finalized_listing_id text,
  finalized_at timestamptz
);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  name text not null,
  musts jsonb not null,
  preferences jsonb not null,
  submitted_at timestamptz not null default now()
);

create index if not exists profiles_group_id_idx on profiles (group_id);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  sender_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_group_id_idx on messages (group_id);

-- A URL someone found on their own (99acres, MagicBricks, NoBroker, ...),
-- submitted alongside their preferences. Parsed best-effort on the server
-- (see src/lib/parseListingUrl.ts) so it can be scored by the same matcher
-- as the mock pool — parse_status/raw_* stay populated even when parsing
-- fails so the UI can say so instead of guessing.
create table if not exists suggested_listings (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  submitted_by text not null,
  url text not null,
  parse_status text not null default 'pending' check (parse_status in ('pending', 'parsed', 'failed')),
  title text,
  image_url text,
  rent_inr integer,
  locality text,
  house_type text,
  property_type text,
  furnishing text,
  bathrooms integer,
  has_lift boolean,
  has_parking boolean,
  pet_friendly boolean,
  created_at timestamptz not null default now()
);

create index if not exists suggested_listings_group_id_idx on suggested_listings (group_id);

-- There's no accounts/auth in this app: a group is reachable by anyone who
-- has its id (from the QR code or invite link), which is the deliberate
-- "if you have the link you're in" model the join flow depends on. These
-- policies are intentionally permissive for that reason. Before a real
-- (non-classroom) launch, this would want Supabase Anonymous Auth with
-- policies keyed to auth.uid(), or a server-side proxy that validates group
-- membership instead of trusting the client.
alter table groups enable row level security;
alter table profiles enable row level security;
alter table messages enable row level security;
alter table suggested_listings enable row level security;

drop policy if exists "anyone can read groups" on groups;
create policy "anyone can read groups" on groups for select using (true);
drop policy if exists "anyone can create groups" on groups;
create policy "anyone can create groups" on groups for insert with check (true);
drop policy if exists "anyone can update groups" on groups;
create policy "anyone can update groups" on groups for update using (true) with check (true);

drop policy if exists "anyone can read profiles" on profiles;
create policy "anyone can read profiles" on profiles for select using (true);
drop policy if exists "anyone can create profiles" on profiles;
create policy "anyone can create profiles" on profiles for insert with check (true);

drop policy if exists "anyone can read messages" on messages;
create policy "anyone can read messages" on messages for select using (true);
drop policy if exists "anyone can create messages" on messages;
create policy "anyone can create messages" on messages for insert with check (true);

drop policy if exists "anyone can read suggested_listings" on suggested_listings;
create policy "anyone can read suggested_listings" on suggested_listings for select using (true);
drop policy if exists "anyone can create suggested_listings" on suggested_listings;
create policy "anyone can create suggested_listings" on suggested_listings for insert with check (true);

-- Powers the "waiting for X more people" live count, the live chat, and the
-- live "Finalised" stamp appearing for everyone as soon as it happens.
-- Guarded because "add table" errors if the table's already a member.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'groups'
  ) then
    alter publication supabase_realtime add table groups;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table profiles;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'suggested_listings'
  ) then
    alter publication supabase_realtime add table suggested_listings;
  end if;
end $$;
