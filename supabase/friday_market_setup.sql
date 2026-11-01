-- Friday Market: person-to-person listings, never shops or stalls.
-- Apply in the Supabase project configured by docs/mira-cloud.js (MIRA, not B2ME).
-- Expose active listings for public browsing; publishing requires a signed-in owner.
create table if not exists public.mira_friday_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 100),
  description text not null check (char_length(trim(description)) between 5 and 800),
  item_condition text not null check (item_condition in ('new','used')),
  price_iqd bigint not null check (price_iqd >= 0),
  contact_phone text not null check (contact_phone ~ '^\+?[0-9 ]{7,18}$'),
  status text not null default 'active' check (status in ('active','sold','hidden')),
  created_at timestamptz not null default now()
);
create index if not exists mira_friday_listings_active_idx on public.mira_friday_listings(created_at desc) where status='active';
create index if not exists mira_friday_listings_seller_idx on public.mira_friday_listings(seller_id);
alter table public.mira_friday_listings enable row level security;
grant usage on schema public to anon, authenticated;
revoke all on public.mira_friday_listings from anon;
grant select on public.mira_friday_listings to anon;
grant select,insert,update,delete on public.mira_friday_listings to authenticated;
drop policy if exists friday_read on public.mira_friday_listings;
drop policy if exists friday_read_active on public.mira_friday_listings;
create policy friday_read_active on public.mira_friday_listings
  for select to anon, authenticated
  using (status='active' or seller_id=(select auth.uid()));
drop policy if exists friday_insert on public.mira_friday_listings;
create policy friday_insert on public.mira_friday_listings
  for insert to authenticated with check (seller_id=(select auth.uid()));
drop policy if exists friday_update on public.mira_friday_listings;
create policy friday_update on public.mira_friday_listings
  for update to authenticated
  using (seller_id=(select auth.uid()))
  with check (seller_id=(select auth.uid()));
drop policy if exists friday_delete on public.mira_friday_listings;
create policy friday_delete on public.mira_friday_listings
  for delete to authenticated using (seller_id=(select auth.uid()));
-- Refresh the API schema if PostgREST previously returned PGRST205.
notify pgrst, 'reload schema';
