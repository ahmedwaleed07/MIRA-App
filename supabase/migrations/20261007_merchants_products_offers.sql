-- MIRA merchant storefront, products and offers

create extension if not exists pgcrypto;

create table if not exists public.merchant_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null,
  phone text,
  email text,
  country text not null default 'Iraq',
  city text,
  address text,
  is_verified boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchant_profiles(id) on delete cascade,
  category_id uuid references public.categories(id),
  subcategory_id uuid references public.subcategories(id),
  product_type_id uuid references public.product_types(id),
  title text not null,
  description text,
  sku text,
  price numeric(14,2) not null default 0 check (price >= 0),
  currency text not null default 'IQD',
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  attributes jsonb not null default '{}'::jsonb,
  image_urls jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchant_profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  category_id uuid references public.categories(id),
  subcategory_id uuid references public.subcategories(id),
  product_type_id uuid references public.product_types(id),
  title text not null,
  description text,
  original_price numeric(14,2) check (original_price is null or original_price >= 0),
  offer_price numeric(14,2) not null check (offer_price >= 0),
  currency text not null default 'IQD',
  offer_type text not null default 'standard'
    check (offer_type in ('standard','flash','featured')),
  branch_scope text,
  attributes jsonb not null default '{}'::jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (original_price is null or original_price >= offer_price)
);

create index if not exists products_merchant_id_idx on public.products(merchant_id);
create index if not exists products_category_idx on public.products(category_id,subcategory_id,product_type_id);
create index if not exists offers_merchant_id_idx on public.offers(merchant_id);
create index if not exists offers_taxonomy_idx on public.offers(category_id,subcategory_id,product_type_id);
create index if not exists offers_active_dates_idx on public.offers(is_active,starts_at,ends_at);

drop trigger if exists mira_merchant_profiles_set_updated_at on public.merchant_profiles;
create trigger mira_merchant_profiles_set_updated_at
before update on public.merchant_profiles
for each row execute function public.mira_set_updated_at();

drop trigger if exists mira_products_set_updated_at on public.products;
create trigger mira_products_set_updated_at
before update on public.products
for each row execute function public.mira_set_updated_at();

drop trigger if exists mira_offers_set_updated_at on public.offers;
create trigger mira_offers_set_updated_at
before update on public.offers
for each row execute function public.mira_set_updated_at();

alter table public.merchant_profiles enable row level security;
alter table public.products enable row level security;
alter table public.offers enable row level security;

drop policy if exists "public read active merchants" on public.merchant_profiles;
create policy "public read active merchants" on public.merchant_profiles
for select using (is_active = true);

drop policy if exists "merchant insert own profile" on public.merchant_profiles;
create policy "merchant insert own profile" on public.merchant_profiles
for insert with check (id = auth.uid());

drop policy if exists "merchant update own profile" on public.merchant_profiles;
create policy "merchant update own profile" on public.merchant_profiles
for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "public read active products" on public.products;
create policy "public read active products" on public.products
for select using (is_active = true);

drop policy if exists "merchant insert own products" on public.products;
create policy "merchant insert own products" on public.products
for insert with check (merchant_id = auth.uid());

drop policy if exists "merchant update own products" on public.products;
create policy "merchant update own products" on public.products
for update using (merchant_id = auth.uid()) with check (merchant_id = auth.uid());

drop policy if exists "merchant delete own products" on public.products;
create policy "merchant delete own products" on public.products
for delete using (merchant_id = auth.uid());

drop policy if exists "public read active offers" on public.offers;
create policy "public read active offers" on public.offers
for select using (
  is_active = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

drop policy if exists "merchant insert own offers" on public.offers;
create policy "merchant insert own offers" on public.offers
for insert with check (merchant_id = auth.uid());

drop policy if exists "merchant update own offers" on public.offers;
create policy "merchant update own offers" on public.offers
for update using (merchant_id = auth.uid()) with check (merchant_id = auth.uid());

drop policy if exists "merchant delete own offers" on public.offers;
create policy "merchant delete own offers" on public.offers
for delete using (merchant_id = auth.uid());
