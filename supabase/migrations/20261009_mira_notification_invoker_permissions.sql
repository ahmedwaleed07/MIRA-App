-- The notification publisher membership table already has authenticated
-- SELECT limited by user_id=auth.uid() through RLS.
-- SECURITY INVOKER therefore safely checks only the caller's own membership.
-- This removes the unnecessary privileged RPC surface.
create or replace function public.mira_can_publish_notification()
returns boolean language sql stable security invoker
set search_path=pg_catalog,public
as $$
 select exists(
  select 1 from public.mira_notification_admins m
  where m.user_id=auth.uid()
 );
$$;
revoke execute on function public.mira_can_publish_notification() from public,anon;
grant execute on function public.mira_can_publish_notification() to authenticated;
