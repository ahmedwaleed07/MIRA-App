-- MIRA: additive live migration on the existing public.mira_orders table.
-- Do not recreate/alter existing order columns or change its existing RLS policies.
-- Record every new order and each order status transition on the server.
create table if not exists public.mira_order_status_history (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.mira_orders(id) on delete cascade,
 status text not null check(status in ('new','accepted','preparing','ready','out_for_delivery','completed','cancelled')),
 changed_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now()
);
create index if not exists mira_order_status_history_order_idx
 on public.mira_order_status_history(order_id,created_at desc);

alter table public.mira_order_status_history enable row level security;
revoke all on public.mira_order_status_history from anon, authenticated;
grant select on public.mira_order_status_history to authenticated;

drop policy if exists "mira history visible to order participants" on public.mira_order_status_history;
create policy "mira history visible to order participants"
on public.mira_order_status_history for select to authenticated
using (
 exists(select 1 from public.mira_orders o
        where o.id=mira_order_status_history.order_id)
);

create or replace function public.mira_record_order_status_change()
returns trigger language plpgsql security definer
set search_path=pg_catalog,public
as $$
begin
 if tg_op='INSERT' or new.status is distinct from old.status then
  insert into public.mira_order_status_history(order_id,status,changed_by,created_at)
  values (new.id,new.status,auth.uid(),case when tg_op='INSERT' then new.created_at else now() end);
 end if;
 return new;
end
$$;
revoke all on function public.mira_record_order_status_change() from public;

drop trigger if exists mira_record_order_status_change on public.mira_orders;
create trigger mira_record_order_status_change
after insert or update of status on public.mira_orders
for each row execute function public.mira_record_order_status_change();

-- Preserve old orders by adding a single initial state event only where absent.
insert into public.mira_order_status_history(order_id,status,changed_by,created_at)
select o.id,o.status,null,o.created_at
from public.mira_orders o
where not exists (
 select 1 from public.mira_order_status_history h where h.order_id=o.id
);
