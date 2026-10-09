-- MIRA web customer -> merchant -> customer order contract.
-- GitHub migration only: run with Supabase SQL Editor / trusted migration runner.
-- Existing "orders" and "order_items" tables remain untouched.
-- The web screens use "mira_orders"; this migration defines that exact resource.
-- IMPORTANT: inspect and retire any legacy permissive RLS policies on an existing
-- mira_orders table before production. CREATE POLICY does not revoke older policies.

create extension if not exists pgcrypto;

create table if not exists public.mira_orders (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid not null references auth.users(id) on delete restrict,
  store_id text not null check (length(trim(store_id))>0),
  offer_id text,
  customer_name text not null,
  phone_primary text not null,
  phone_secondary text,
  governorate_city text not null,
  full_address text not null,
  landmark text,
  customer_note text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(14,2) not null default 0 check (subtotal>=0),
  total numeric(14,2) not null default 0 check (total>=0),
  currency text not null default 'IQD',
  status text not null default 'new' check (
    status in ('new','accepted','preparing','ready','out_for_delivery','completed','cancelled')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(items)='array')
);

-- The Business page uses mira_merchants for the authenticated user->store link.
do $$
begin
  if to_regclass('public.mira_merchants') is null then
    raise exception 'MIRA merchant assignment table public.mira_merchants is missing. Apply the merchant setup before the web order migration.';
  end if;
end;
$$;

-- Store ids may be UUID or text in existing merchant assignments.
create or replace function public.mira_is_assigned_store(p_store_id text)
returns boolean language sql stable security definer set search_path=public
as $$
 select exists (
   select 1 from public.mira_merchants m
   where m.user_id=auth.uid()
     and m.store_id::text=p_store_id
 );
$$;
revoke all on function public.mira_is_assigned_store(text) from public;
grant execute on function public.mira_is_assigned_store(text) to authenticated;

create index if not exists mira_orders_customer_created_idx
  on public.mira_orders(customer_user_id,created_at desc);
create index if not exists mira_orders_store_created_idx
  on public.mira_orders(store_id,created_at desc);

-- Customer details and ownership are immutable after placement.
-- Only assigned merchants may change status; timestampts come from server.
create or replace function public.mira_order_write_guard()
returns trigger language plpgsql set search_path=public as $$
begin
 if tg_op='INSERT' then
   if new.status is distinct from 'new' then
     raise exception 'New customer orders must start with status new.';
   end if;
 else
   if (new.id,new.customer_user_id,new.store_id,new.offer_id,
       new.customer_name,new.phone_primary,new.phone_secondary,
       new.governorate_city,new.full_address,new.landmark,new.customer_note,
       new.items,new.subtotal,new.total,new.currency,new.created_at)
     is distinct from
      (old.id,old.customer_user_id,old.store_id,old.offer_id,
       old.customer_name,old.phone_primary,old.phone_secondary,
       old.governorate_city,old.full_address,old.landmark,old.customer_note,
       old.items,old.subtotal,old.total,old.currency,old.created_at)
   then
     raise exception 'Customer order details cannot be changed after placement.';
   end if;
 end if;
 if new.total<new.subtotal then raise exception 'Order total cannot be below its subtotal.'; end if;
 if jsonb_typeof(new.items) <> 'array' or jsonb_array_length(new.items)=0 then
   raise exception 'An order must contain at least one item.';
 end if;
 new.updated_at=now();
 return new;
end;
$$;
drop trigger if exists mira_web_order_write_guard on public.mira_orders;
create trigger mira_web_order_write_guard before insert or update on public.mira_orders
for each row execute function public.mira_order_write_guard();

-- An audit trail is independent of the current-state card used by the customer.
create table if not exists public.mira_order_status_history (
 id uuid primary key default gen_random_uuid(),
 order_id text not null,
 status text not null,
 changed_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now()
);
create index if not exists mira_order_history_order_created_idx
 on public.mira_order_status_history(order_id,created_at);

create or replace function public.mira_log_web_order_status()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if tg_op='INSERT' or new.status is distinct from old.status then
   insert into public.mira_order_status_history(order_id,status,changed_by)
   values (new.id::text,new.status,auth.uid());
 end if;
 return new;
end;
$$;
drop trigger if exists mira_web_order_history_trigger on public.mira_orders;
create trigger mira_web_order_history_trigger
after insert or update of status on public.mira_orders
for each row execute function public.mira_log_web_order_status();

-- Public visitors may browse offers, but must not read personal order details.
revoke all on public.mira_orders from anon;
revoke all on public.mira_order_status_history from anon;
grant select,insert,update on public.mira_orders to authenticated;
grant select on public.mira_order_status_history to authenticated;

alter table public.mira_orders enable row level security;
alter table public.mira_order_status_history enable row level security;

drop policy if exists "mira customers select own orders" on public.mira_orders;
create policy "mira customers select own orders" on public.mira_orders
for select to authenticated using (customer_user_id=auth.uid());

drop policy if exists "mira assigned merchants select store orders" on public.mira_orders;
create policy "mira assigned merchants select store orders" on public.mira_orders
for select to authenticated using (public.mira_is_assigned_store(store_id::text));

drop policy if exists "mira customers insert own orders" on public.mira_orders;
create policy "mira customers insert own orders" on public.mira_orders
for insert to authenticated with check (
 customer_user_id=auth.uid() and status='new'
);

drop policy if exists "mira assigned merchants update order status" on public.mira_orders;
create policy "mira assigned merchants update order status" on public.mira_orders
for update to authenticated
using (public.mira_is_assigned_store(store_id::text))
with check (public.mira_is_assigned_store(store_id::text));

drop policy if exists "mira order parties read history" on public.mira_order_status_history;
create policy "mira order parties read history" on public.mira_order_status_history
for select to authenticated using (
 exists (
  select 1 from public.mira_orders o
  where o.id::text=mira_order_status_history.order_id
 )
);

-- Verify backend publication/read policies and actual merchant membership in
-- Supabase before live orders. Existing policies must be audited separately.
-- For payments, prices must be revalidated against a trusted server-side catalog.
