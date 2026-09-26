-- Adds support for group members submitting listing URLs they found
-- themselves, alongside their preferences. Safe to re-run.
-- Run this once in the Supabase SQL editor (schema.sql already has this
-- merged in, so a fresh project only needs schema.sql).

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

alter table suggested_listings enable row level security;

drop policy if exists "anyone can read suggested_listings" on suggested_listings;
create policy "anyone can read suggested_listings" on suggested_listings for select using (true);
drop policy if exists "anyone can create suggested_listings" on suggested_listings;
create policy "anyone can create suggested_listings" on suggested_listings for insert with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'suggested_listings'
  ) then
    alter publication supabase_realtime add table suggested_listings;
  end if;
end $$;
