
alter table public.mira_listing_reports alter column target_id drop not null;
alter table public.mira_listing_reports add column if not exists target_record_id text;
alter table public.mira_listing_reports drop constraint if exists mira_listing_reports_target_type_check;
alter table public.mira_listing_reports add constraint mira_listing_reports_target_type_check
 check (target_type in ('friday','car','offer','store'));
alter table public.mira_listing_reports add constraint mira_listing_reports_target_ref_check
 check ((target_type in ('friday','car') and target_id is not null and target_record_id is null)
 or (target_type in ('offer','store') and target_id is null and target_record_id is not null and length(target_record_id) between 1 and 150));
create index if not exists mira_listing_reports_record_idx
 on public.mira_listing_reports(target_type,target_record_id)
 where target_record_id is not null;
drop policy if exists mira_report_insert on public.mira_listing_reports;
create policy mira_report_insert on public.mira_listing_reports
 for insert to authenticated with check(
 reporter_id=(select auth.uid()) and status='open' and admin_note='' and resolved_at is null
 and (
  exists(select 1 from public.mira_friday_listings f where target_type='friday' and f.id=target_id and f.status='active')
  or exists(select 1 from public.mira_car_direct_listings c where target_type='car' and c.id=target_id and c.status='active')
  or exists(select 1 from public.mira_records r where target_type in ('offer','store')
    and r.id=target_record_id and r.kind=target_type and r.data->>'status'='active')
 )
);
notify pgrst,'reload schema';

