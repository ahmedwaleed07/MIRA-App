-- Applied to Supabase MIRA project xjspokwtikefpgwczehp.
-- Up to six JPEG, PNG or WebP photos per Friday Market listing.
-- Pictures live in a dedicated public-read bucket; only their owner may upload or delete.
alter table public.mira_friday_listings
  add column if not exists image_paths text[] not null default '{}'::text[];

alter table public.mira_friday_listings
  drop constraint if exists mira_friday_listings_max_six_images;
alter table public.mira_friday_listings
  add constraint mira_friday_listings_max_six_images
  check (cardinality(image_paths) <= 6 and array_position(image_paths, null) is null);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mira-friday-items', 'mira-friday-items', true, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "MIRA Friday photos public read" on storage.objects;
create policy "MIRA Friday photos public read"
  on storage.objects for select to public
  using (bucket_id = 'mira-friday-items');

drop policy if exists "MIRA Friday photos owner upload" on storage.objects;
create policy "MIRA Friday photos owner upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'mira-friday-items'
    and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "MIRA Friday photos owner delete" on storage.objects;
create policy "MIRA Friday photos owner delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'mira-friday-items'
    and (storage.foldername(name))[1] = (select auth.uid())::text);

notify pgrst, 'reload schema';
