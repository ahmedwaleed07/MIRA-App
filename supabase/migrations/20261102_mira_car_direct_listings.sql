-- MIRA automotive: individuals may advertise vehicles without creating a showroom.
-- This migration was applied to project xjspokwtikefpgwczehp on 2026-11-02.
-- MIRA hosts display space; payment and ownership transfer are external.
create table if not exists public.mira_car_direct_listings (
 id uuid primary key default gen_random_uuid(),
 seller_id uuid not null references auth.users(id) on delete cascade,
 make text not null check (char_length(trim(make)) between 2 and 70),
 model text not null check (char_length(trim(model)) between 1 and 70),
 model_year integer not null check (model_year between 1950 and 2100),
 mileage_km integer not null check (mileage_km between 0 and 9999999),
 car_condition text not null check (car_condition in ('new','used')),
 price_iqd bigint not null check (price_iqd >= 0),
 province text not null check (char_length(trim(province)) between 2 and 100),
 description text not null default '' check (char_length(description) <= 1500),
 contact_phone text not null check (contact_phone ~ '^\+?[0-9 ]{7,18}$'),
 image_paths text[] not null default '{}'::text[]
   check (cardinality(image_paths) <= 6 and array_position(image_paths,null) is null),
 status text not null default 'active' check (status in ('active','sold','hidden')),
 created_at timestamptz not null default now()
);
create index if not exists mira_car_direct_listings_active_idx
 on public.mira_car_direct_listings(created_at desc) where status='active';
create index if not exists mira_car_direct_listings_seller_idx
 on public.mira_car_direct_listings(seller_id);
alter table public.mira_car_direct_listings enable row level security;
grant usage on schema public to anon,authenticated;
revoke all on public.mira_car_direct_listings from anon;
grant select on public.mira_car_direct_listings to anon;
grant select,insert,update,delete on public.mira_car_direct_listings to authenticated;
drop policy if exists mira_car_direct_read on public.mira_car_direct_listings;
create policy mira_car_direct_read on public.mira_car_direct_listings
 for select to anon,authenticated
 using (status='active' or seller_id=(select auth.uid()));
drop policy if exists mira_car_direct_insert on public.mira_car_direct_listings;
create policy mira_car_direct_insert on public.mira_car_direct_listings
 for insert to authenticated with check (seller_id=(select auth.uid()));
drop policy if exists mira_car_direct_update on public.mira_car_direct_listings;
create policy mira_car_direct_update on public.mira_car_direct_listings
 for update to authenticated using (seller_id=(select auth.uid()))
 with check (seller_id=(select auth.uid()));
drop policy if exists mira_car_direct_delete on public.mira_car_direct_listings;
create policy mira_car_direct_delete on public.mira_car_direct_listings
 for delete to authenticated using (seller_id=(select auth.uid()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('mira-car-direct','mira-car-direct',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
drop policy if exists "MIRA car direct public read" on storage.objects;
create policy "MIRA car direct public read" on storage.objects
 for select to public using (bucket_id='mira-car-direct');
drop policy if exists "MIRA car direct owner upload" on storage.objects;
create policy "MIRA car direct owner upload" on storage.objects
 for insert to authenticated
 with check (bucket_id='mira-car-direct'
 and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "MIRA car direct owner delete" on storage.objects;
create policy "MIRA car direct owner delete" on storage.objects
 for delete to authenticated
 using (bucket_id='mira-car-direct'
 and (storage.foldername(name))[1]=(select auth.uid())::text);
notify pgrst,'reload schema';
