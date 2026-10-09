-- MIRA manually curated customer notifications (in-app inbox).
-- DEPLOYMENT REQUIRED: committing this file DOES NOT apply SQL to Supabase.
-- Allow-list a trusted Auth UUID via Supabase SQL Editor, never from browser:
-- insert into public.mira_notification_admins (user_id) values ('<trusted-admin-auth-uuid>');
-- This is separate from any prototype Admin UI credentials.
create extension if not exists pgcrypto;

create table if not exists public.mira_notification_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);
alter table public.mira_notification_admins enable row level security;
revoke all on public.mira_notification_admins from anon;
grant select on public.mira_notification_admins to authenticated;
drop policy if exists "notification admins may check own membership" on public.mira_notification_admins;
create policy "notification admins may check own membership"
on public.mira_notification_admins for select to authenticated
using (user_id=auth.uid());

create or replace function public.mira_can_publish_notification()
returns boolean language sql stable security definer set search_path=public
as $$
 select exists(select 1 from public.mira_notification_admins where user_id=auth.uid());
$$;
revoke all on function public.mira_can_publish_notification() from public;
grant execute on function public.mira_can_publish_notification() to authenticated;

create table if not exists public.mira_manual_notifications (
 id uuid primary key default gen_random_uuid(),
 title text not null check(length(trim(title)) between 1 and 120),
 body text not null check(length(trim(body)) between 1 and 700),
 audience text not null check (audience in ('all','market','user')),
 market_code text check (market_code is null or market_code ~ '^[A-Z]{2}$'),
 recipient_user_id uuid references auth.users(id) on delete cascade,
 destination text not null default 'home.html' check (
  destination ~ '^(home|orders|offer|categories|saved|profile)\.html(\?[a-zA-Z0-9_%=&.+-]{1,250})?$'
 ),
 created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
 published_at timestamptz not null default now(),
 expires_at timestamptz,
 check (
  (audience='all' and market_code is null and recipient_user_id is null)
  or (audience='market' and market_code is not null and recipient_user_id is null)
  or (audience='user' and market_code is null and recipient_user_id is not null)
 ),
 check (expires_at is null or expires_at>published_at)
);
create index if not exists mira_manual_notifications_live_idx
 on public.mira_manual_notifications(published_at desc);
create index if not exists mira_manual_notifications_target_idx
 on public.mira_manual_notifications(recipient_user_id,published_at desc);

-- The author cannot be impersonated by a client request.
create or replace function public.mira_manual_notification_author()
returns trigger language plpgsql set search_path=public as $$
begin
 if not public.mira_can_publish_notification() then
  raise exception 'Not authorized to publish MIRA notifications';
 end if;
 new.created_by=auth.uid();
 new.published_at=now();
 return new;
end;
$$;
drop trigger if exists mira_manual_notification_author_trigger on public.mira_manual_notifications;
create trigger mira_manual_notification_author_trigger before insert
on public.mira_manual_notifications for each row execute function public.mira_manual_notification_author();

alter table public.mira_manual_notifications enable row level security;
revoke all on public.mira_manual_notifications from anon;
grant select,insert on public.mira_manual_notifications to authenticated;

drop policy if exists "MIRA customers view addressed manual notifications" on public.mira_manual_notifications;
create policy "MIRA customers view addressed manual notifications"
on public.mira_manual_notifications for select to authenticated using (
 public.mira_can_publish_notification()
 or (
  published_at<=now()
  and (expires_at is null or expires_at>now())
  and (audience in ('all','market') or (audience='user' and recipient_user_id=auth.uid()))
 )
);
drop policy if exists "MIRA notification admins publish manual notifications" on public.mira_manual_notifications;
create policy "MIRA notification admins publish manual notifications"
on public.mira_manual_notifications for insert to authenticated
with check (
 public.mira_can_publish_notification() and created_by=auth.uid()
);
-- Published notices intentionally cannot be edited or deleted from an ordinary
-- browser client. Future moderation/retraction requires privileged backend actions.
-- The market filter is delivered client-side from the selected MIRA shopping country;
-- do not use country-targeted messages for confidential content.
