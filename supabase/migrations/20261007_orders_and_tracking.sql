-- MIRA customer orders and merchant tracking
-- One order belongs to one merchant. Multi-merchant carts should be split into one order per merchant.

create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default (
    'MIRA-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))
  ),
  customer_id uuid not null references auth.users(id) on delete restrict,
  merchant_id uuid references auth.users(id) on delete restrict,
  market text not null default 'Iraq',
  currency text not null default 'IQD',
  status text not null default 'received'
    check (status in ('received','confirmed','preparing','shipped','out_for_delivery','delivered','cancelled')),
  customer_name text not null,
  phone_primary text not null,
  phone_secondary text,
  governorate text not null,
  area text not null,
  address text not null,
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  delivery_fee numeric(14,2) not null default 0 check (delivery_fee >= 0),
  total numeric(14,2) generated always as (subtotal + delivery_fee) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid,
  product_ref text,
  product_title text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
  currency text not null default 'IQD',
  attributes jsonb not null default '{}'::jsonb,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null
    check (status in ('received','confirmed','preparing','shipped','out_for_delivery','delivered','cancelled')),
  changed_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists orders_customer_id_idx on public.orders(customer_id,created_at desc);
create index if not exists orders_merchant_id_idx on public.orders(merchant_id,created_at desc);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists order_status_history_order_id_idx on public.order_status_history(order_id,created_at);

create or replace function public.mira_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists mira_orders_set_updated_at on public.orders;
create trigger mira_orders_set_updated_at
before update on public.orders
for each row execute function public.mira_set_updated_at();

create or replace function public.mira_log_order_status()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history(order_id,status,changed_by)
    values (new.id,new.status,auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.order_status_history(order_id,status,changed_by)
    values (new.id,new.status,auth.uid());
  end if;
  return new;
end $$;

drop trigger if exists mira_orders_log_status on public.orders;
create trigger mira_orders_log_status
after insert or update of status on public.orders
for each row execute function public.mira_log_order_status();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;

drop policy if exists "customers read own orders" on public.orders;
create policy "customers read own orders" on public.orders
for select using (customer_id = auth.uid());

drop policy if exists "customers create own orders" on public.orders;
create policy "customers create own orders" on public.orders
for insert with check (customer_id = auth.uid());

drop policy if exists "merchants read assigned orders" on public.orders;
create policy "merchants read assigned orders" on public.orders
for select using (merchant_id = auth.uid());

drop policy if exists "merchants update assigned orders" on public.orders;
create policy "merchants update assigned orders" on public.orders
for update using (merchant_id = auth.uid())
with check (merchant_id = auth.uid());

drop policy if exists "order parties read items" on public.order_items;
create policy "order parties read items" on public.order_items
for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.customer_id = auth.uid() or o.merchant_id = auth.uid())
  )
);

drop policy if exists "customers add own order items" on public.order_items;
create policy "customers add own order items" on public.order_items
for insert with check (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.customer_id = auth.uid()
  )
);

drop policy if exists "order parties read status history" on public.order_status_history;
create policy "order parties read status history" on public.order_status_history
for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_status_history.order_id
      and (o.customer_id = auth.uid() or o.merchant_id = auth.uid())
  )
);
