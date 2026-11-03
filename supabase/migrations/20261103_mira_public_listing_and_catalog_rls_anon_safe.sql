
drop policy if exists mira_car_direct_read on public.mira_car_direct_listings;
create policy mira_car_direct_public_read on public.mira_car_direct_listings for select to anon,authenticated using(status='active');
create policy mira_car_direct_private_read on public.mira_car_direct_listings for select to authenticated using(seller_id=(select auth.uid()) or (select public.mira_is_content_admin()));
drop policy if exists friday_read_active on public.mira_friday_listings;
create policy mira_friday_public_read on public.mira_friday_listings for select to anon,authenticated using(status='active');
create policy mira_friday_private_read on public.mira_friday_listings for select to authenticated using(seller_id=(select auth.uid()) or (select public.mira_is_content_admin()));
drop policy if exists "MIRA approved catalog read" on public.mira_records;
create policy "MIRA approved catalog public read" on public.mira_records for select to anon,authenticated using(coalesce(data->>'status','')='active');
create policy "MIRA assigned catalog private read" on public.mira_records for select to authenticated using((select public.mira_is_content_admin()) or (kind='offer' and exists(select 1 from public.mira_merchants m where m.user_id=(select auth.uid()) and m.store_id=mira_records.data->>'storeId')));
notify pgrst,'reload schema';
