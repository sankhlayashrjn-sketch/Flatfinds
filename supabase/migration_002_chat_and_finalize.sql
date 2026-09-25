-- FlatFinds migration 002: group chat + finalizing a choice.
-- Run this once in your Supabase project's SQL editor (the tables/policies
-- from supabase/schema.sql must already exist — this only adds to them).

alter table groups add column if not exists finalized_listing_id text;
alter table groups add column if not exists finalized_at timestamptz;

-- groups only had select/insert policies before; finalizing needs an update.
drop policy if exists "anyone can update groups" on groups;
create policy "anyone can update groups" on groups for update using (true) with check (true);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  sender_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_group_id_idx on messages (group_id);

alter table messages enable row level security;

drop policy if exists "anyone can read messages" on messages;
create policy "anyone can read messages" on messages for select using (true);

drop policy if exists "anyone can create messages" on messages;
create policy "anyone can create messages" on messages for insert with check (true);

-- Powers the live chat and the live "Finalised" stamp appearing for everyone.
-- Guarded because "add table" errors if the table's already a member.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'groups'
  ) then
    alter publication supabase_realtime add table groups;
  end if;
end $$;
