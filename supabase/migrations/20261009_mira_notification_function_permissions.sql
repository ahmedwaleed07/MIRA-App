-- Limit function calls exposed through Supabase PostgREST.
-- Trigger functions only execute as triggers, not as external RPC calls.
revoke execute on function public.mira_record_order_status_change() from public, anon, authenticated;
revoke execute on function public.mira_manual_notification_author() from public, anon, authenticated;

-- The admin-permission helper is used by authenticated RLS policies and by
-- the insert trigger, so authenticated execution must remain enabled.
revoke execute on function public.mira_can_publish_notification() from public, anon;
grant execute on function public.mira_can_publish_notification() to authenticated;
