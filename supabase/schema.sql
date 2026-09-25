-- FlatFinds schema. Run this once in your Supabase project's SQL editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run).

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Nullable: a group is created with just a name (step 1); the expected
  -- member count is set a screen later (step 2). The check still applies
  -- once it's set — Postgres check constraints don't reject NULLs.
  expected_member_count int check (expected_member_count >= 2),
  created_at timestamptz not null default now()
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

-- There's no accounts/auth in this app: a group is reachable by anyone who
-- has its id (from the QR code or invite link), which is the deliberate
-- "if you have the link you're in" model the join flow depends on. These
-- policies are intentionally permissive for that reason. Before a real
-- (non-classroom) launch, this would want Supabase Anonymous Auth with
-- policies keyed to auth.uid(), or a server-side proxy that validates group
-- membership instead of trusting the client.
alter table groups enable row level security;
alter table profiles enable row level security;

create policy "anyone can read groups" on groups for select using (true);
create policy "anyone can create groups" on groups for insert with check (true);

create policy "anyone can read profiles" on profiles for select using (true);
create policy "anyone can create profiles" on profiles for insert with check (true);

-- Powers the "waiting for X more people" live count on the join screen.
alter publication supabase_realtime add table profiles;
