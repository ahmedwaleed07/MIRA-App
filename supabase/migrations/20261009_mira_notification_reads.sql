-- Cross-device read receipts for customer notifications.
-- Apply to MIRA Supabase only after reviewing existing policies; GitHub commits
-- do not execute SQL. Notifications are still in-app until push transport is configured.
create table if not exists public.mira_notification_reads (
 user_id uuid not null references auth.users(id) on delete cascade,
 event_key text not null check (length(event_key) between 1 and 180),
 read_at timestamptz not null default now(),
 primary key (user_id,event_key)
);
create index if not exists mira_notification_reads_latest_idx
 on public.mira_notification_reads(user_id,read_at desc);

alter table public.mira_notification_reads enable row level security;
revoke all on public.mira_notification_reads from anon;
grant select,insert,update on public.mira_notification_reads to authenticated;

drop policy if exists "customer reads own notification receipts" on public.mira_notification_reads;
create policy "customer reads own notification receipts"
on public.mira_notification_reads for select to authenticated
using (user_id=auth.uid());

drop policy if exists "customer marks own notifications read" on public.mira_notification_reads;
create policy "customer marks own notifications read"
on public.mira_notification_reads for insert to authenticated
with check (user_id=auth.uid());

drop policy if exists "customer updates own notification receipts" on public.mira_notification_reads;
create policy "customer updates own notification receipts"
on public.mira_notification_reads for update to authenticated
using (user_id=auth.uid()) with check (user_id=auth.uid());

-- A read receipt can only ever mark an event as read; it cannot modify
-- any MIRA notification, order or another customer's record.
-- Automatic events are created by the order-status trigger configured in
-- supabase/migrations/20261009_mira_web_orders_contract.sql.
