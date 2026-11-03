
-- MIRA launch safety: review BEFORE publication, audit decisions, reports, and secure shared catalog.
-- The only preauthorized content moderators are existing MIRA notification admins.
create or replace function public.mira_is_content_admin()
returns boolean language sql stable security invoker
set search_path='' as $$
 select exists(select 1 from public.mira_notification_admins a
 where a.user_id=(select auth.uid()));
$$;
revoke all on function public.mira_is_content_admin() from public,anon;
grant execute on function public.mira_is_content_admin() to authenticated;

alter table public.mira_friday_listings
 drop constraint if exists mira_friday_listings_status_check;
alter table public.mira_friday_listings
 add constraint mira_friday_listings_status_check
 check (status in ('pending','active','rejected','sold','hidden'));
alter table public.mira_car_direct_listings
 drop constraint if exists mira_car_direct_listings_status_check;
alter table public.mira_car_direct_listings
 add constraint mira_car_direct_listings_status_check
 check (status in ('pending','active','rejected','sold','hidden'));
alter table public.mira_friday_listings
 alter column status set default 'pending',
 add column if not exists reviewed_at timestamptz,
 add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
 add column if not exists review_note text not null default '';
alter table public.mira_car_direct_listings
 alter column status set default 'pending',
 add column if not exists reviewed_at timestamptz,
 add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
 add column if not exists review_note text not null default '';

create or replace function public.mira_guard_personal_listing()
returns trigger language plpgsql security invoker set search_path='' as $$
declare ismoderator boolean;
begin
 ismoderator:=coalesce((select public.mira_is_content_admin()),false);
 if not ismoderator then
   if tg_op='INSERT' then
    new.status:='pending'; new.reviewed_by:=null;new.reviewed_at:=null;new.review_note:='';
   else
    if new.seller_id<>old.seller_id then raise exception 'Seller cannot be changed'; end if;
    new.reviewed_by:=old.reviewed_by;new.reviewed_at:=old.reviewed_at;new.review_note:=old.review_note;
    if old.status='active' and new.status='sold' then
      null;
    elsif old.status='sold' then
      new.status:='sold';
    elsif new.status='hidden' then
      null;
    elsif old.status='active' and new.status='active' then
      if tg_table_name='mira_friday_listings' then
        if new.title is distinct from old.title
           or new.description is distinct from old.description
           or new.price_iqd is distinct from old.price_iqd
           or new.contact_phone is distinct from old.contact_phone
           or new.image_paths is distinct from old.image_paths then
          new.status:='pending';
        end if;
      else
        if new.make is distinct from old.make
           or new.model is distinct from old.model
           or new.model_year is distinct from old.model_year
           or new.price_iqd is distinct from old.price_iqd
           or new.description is distinct from old.description
           or new.contact_phone is distinct from old.contact_phone
           or new.image_paths is distinct from old.image_paths then
          new.status:='pending';
        end if;
      end if;
    else
      new.status:='pending';
    end if;
   end if;
 else
   if tg_op='UPDATE' and new.status is distinct from old.status then
      new.reviewed_at:=now();new.reviewed_by:=(select auth.uid());
   end if;
 end if;
 return new;
end $$;
drop trigger if exists mira_friday_moderation_guard on public.mira_friday_listings;
create trigger mira_friday_moderation_guard before insert or update
 on public.mira_friday_listings for each row execute function public.mira_guard_personal_listing();
drop trigger if exists mira_car_moderation_guard on public.mira_car_direct_listings;
create trigger mira_car_moderation_guard before insert or update
 on public.mira_car_direct_listings for each row execute function public.mira_guard_personal_listing();

drop policy if exists mira_car_direct_read on public.mira_car_direct_listings;
create policy mira_car_direct_read on public.mira_car_direct_listings
 for select to anon,authenticated
 using(status='active' or seller_id=(select auth.uid()) or (select public.mira_is_content_admin()));
drop policy if exists friday_read_active on public.mira_friday_listings;
create policy friday_read_active on public.mira_friday_listings
 for select to anon,authenticated
 using(status='active' or seller_id=(select auth.uid()) or (select public.mira_is_content_admin()));
create policy mira_car_admin_moderate on public.mira_car_direct_listings
 for update to authenticated
 using((select public.mira_is_content_admin()))
 with check((select public.mira_is_content_admin()));
create policy mira_friday_admin_moderate on public.mira_friday_listings
 for update to authenticated
 using((select public.mira_is_content_admin()))
 with check((select public.mira_is_content_admin()));

-- Merchant offer submission must be owned by an assigned store and reviewed by admin.
create or replace function public.mira_guard_record_write()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if not coalesce((select public.mira_is_content_admin()),false) then
  if new.kind<>'offer' then raise exception 'Only administrators can change stores';end if;
  if not exists(select 1 from public.mira_merchants m where m.user_id=(select auth.uid())
    and m.store_id=new.data->>'storeId') then
    raise exception 'Not an assigned merchant';end if;
  if tg_op='UPDATE' and (new.kind<>old.kind
    or new.data->>'storeId' is distinct from old.data->>'storeId') then
    raise exception 'Cannot transfer offer ownership';end if;
  new.data:=jsonb_set(new.data,'{status}','"pending"'::jsonb,true);
 end if;
 return new;
end $$;
drop trigger if exists mira_catalog_review_guard on public.mira_records;
create trigger mira_catalog_review_guard before insert or update
 on public.mira_records for each row execute function public.mira_guard_record_write();

drop policy if exists "MIRA admin insert" on public.mira_records;
drop policy if exists "MIRA admin update" on public.mira_records;
drop policy if exists "MIRA admin delete" on public.mira_records;
drop policy if exists "MIRA public read" on public.mira_records;
create policy "MIRA approved catalog read" on public.mira_records
 for select to anon,authenticated
 using((coalesce(data->>'status','')='active')
  or (select public.mira_is_content_admin())
  or (kind='offer' and exists(
     select 1 from public.mira_merchants m where m.user_id=(select auth.uid())
       and m.store_id=mira_records.data->>'storeId')));
create policy "MIRA authorized catalog insert" on public.mira_records
 for insert to authenticated with check(
  (select public.mira_is_content_admin())
  or (kind='offer' and exists(
      select 1 from public.mira_merchants m where m.user_id=(select auth.uid())
      and m.store_id=mira_records.data->>'storeId'))
 );
create policy "MIRA authorized catalog update" on public.mira_records
 for update to authenticated using(
   (select public.mira_is_content_admin())
   or (kind='offer' and exists(select 1 from public.mira_merchants m
     where m.user_id=(select auth.uid()) and m.store_id=mira_records.data->>'storeId'))
 ) with check(
   (select public.mira_is_content_admin())
   or (kind='offer' and exists(select 1 from public.mira_merchants m
     where m.user_id=(select auth.uid()) and m.store_id=mira_records.data->>'storeId'))
 );
create policy "MIRA authorized catalog delete" on public.mira_records
 for delete to authenticated using(
   (select public.mira_is_content_admin())
   or (kind='offer' and exists(select 1 from public.mira_merchants m
     where m.user_id=(select auth.uid()) and m.store_id=mira_records.data->>'storeId'))
 );

-- Reports: customer identity + structured reason + free text; private to reporter and moderation.
create table if not exists public.mira_listing_reports(
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references auth.users(id) on delete cascade,
 target_type text not null check(target_type in ('friday','car')),
 target_id uuid not null,
 reason text not null check(reason in ('fraud','prohibited','misleading','duplicate','harassment','other')),
 details text not null default '' check(char_length(details)<=1000),
 status text not null default 'open' check(status in ('open','reviewed','actioned','dismissed')),
 admin_note text not null default '' check(char_length(admin_note)<=1000),
 resolved_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists mira_listing_reports_status_idx on public.mira_listing_reports(status,created_at desc);
create index if not exists mira_listing_reports_target_idx on public.mira_listing_reports(target_type,target_id);
alter table public.mira_listing_reports enable row level security;
revoke all on public.mira_listing_reports from anon;
grant select,insert,update on public.mira_listing_reports to authenticated;
create policy mira_report_read on public.mira_listing_reports
 for select to authenticated using(
 reporter_id=(select auth.uid()) or (select public.mira_is_content_admin())
);
create policy mira_report_insert on public.mira_listing_reports
 for insert to authenticated with check(
 reporter_id=(select auth.uid()) and status='open' and admin_note=''
 and resolved_at is null and exists(
   select 1 from public.mira_friday_listings f
   where target_type='friday' and f.id=target_id and f.status='active'
   union all
   select 1 from public.mira_car_direct_listings c
   where target_type='car' and c.id=target_id and c.status='active'
 )
);
create policy mira_report_admin_update on public.mira_listing_reports
 for update to authenticated using((select public.mira_is_content_admin()))
 with check((select public.mira_is_content_admin()));

-- Private customer notifications for moderation decisions, separate from payment.
create table if not exists public.mira_listing_review_events(
 id uuid primary key default gen_random_uuid(),
 recipient_user_id uuid not null references auth.users(id) on delete cascade,
 listing_type text not null check(listing_type in ('friday','car','offer')),
 listing_id text not null,
 event_type text not null check(event_type in ('approved','rejected','hidden')),
 note text not null default '',
 created_at timestamptz not null default now()
);
create index if not exists mira_listing_review_events_recipient_idx
 on public.mira_listing_review_events(recipient_user_id,created_at desc);
alter table public.mira_listing_review_events enable row level security;
revoke all on public.mira_listing_review_events from anon;
grant select,insert on public.mira_listing_review_events to authenticated;
create policy mira_listing_review_events_read on public.mira_listing_review_events
 for select to authenticated using(recipient_user_id=(select auth.uid()) or (select public.mira_is_content_admin()));
create policy mira_listing_review_events_insert on public.mira_listing_review_events
 for insert to authenticated with check((select public.mira_is_content_admin()));

notify pgrst,'reload schema';

