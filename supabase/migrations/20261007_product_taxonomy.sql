-- MIRA dynamic product taxonomy
-- Category -> Subcategory -> Product Type -> Attributes

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ar text not null,
  name_en text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  slug text not null,
  name_ar text not null,
  name_en text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(category_id, slug)
);

create table if not exists public.product_types (
  id uuid primary key default gen_random_uuid(),
  subcategory_id uuid not null references public.subcategories(id) on delete cascade,
  slug text not null,
  name_ar text not null,
  name_en text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(subcategory_id, slug)
);

create table if not exists public.product_attributes (
  id uuid primary key default gen_random_uuid(),
  product_type_id uuid not null references public.product_types(id) on delete cascade,
  key text not null,
  label_ar text not null,
  label_en text not null,
  input_type text not null default 'text' check (input_type in ('text','number','select','multiselect','boolean')),
  options jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  is_filterable boolean not null default true,
  is_required boolean not null default false,
  unique(product_type_id, key)
);

create index if not exists subcategories_category_id_idx on public.subcategories(category_id);
create index if not exists product_types_subcategory_id_idx on public.product_types(subcategory_id);
create index if not exists product_attributes_product_type_id_idx on public.product_attributes(product_type_id);

-- Seed initial MIRA categories and audience subcategories.
insert into public.categories (slug,name_ar,name_en,sort_order) values
('clothing','الملابس','Clothing',10),
('shoes','الأحذية','Shoes',20),
('perfumes','العطور','Perfumes',30),
('accessories','الإكسسوارات','Accessories',40),
('bags','الحقائب','Bags',50),
('watches','الساعات','Watches',60)
on conflict (slug) do nothing;

insert into public.subcategories(category_id,slug,name_ar,name_en,sort_order)
select c.id,v.slug,v.ar,v.en,v.ord
from public.categories c
join (values
('clothing','men','رجالي','Men',10),('clothing','women','نسائي','Women',20),('clothing','boys','ولادي','Boys',30),('clothing','girls','بناتي','Girls',40),('clothing','kids','أطفال','Kids',50),
('shoes','men','رجالي','Men',10),('shoes','women','نسائي','Women',20),('shoes','boys','ولادي','Boys',30),('shoes','girls','بناتي','Girls',40),('shoes','kids','أطفال','Kids',50),
('perfumes','men','رجالي','Men',10),('perfumes','women','نسائي','Women',20),('perfumes','unisex','للجنسين','Unisex',30),
('accessories','men','رجالي','Men',10),('accessories','women','نسائي','Women',20),
('bags','men','رجالي','Men',10),('bags','women','نسائي','Women',20),('bags','boys','ولادي','Boys',30),('bags','girls','بناتي','Girls',40),
('watches','men','رجالي','Men',10),('watches','women','نسائي','Women',20),('watches','kids','أطفال','Kids',30)
) as v(cat,slug,ar,en,ord) on c.slug=v.cat
on conflict (category_id,slug) do nothing;

-- Product types for the first agreed categories.
insert into public.product_types(subcategory_id,slug,name_ar,name_en,sort_order)
select s.id,v.slug,v.ar,v.en,v.ord
from public.subcategories s
join public.categories c on c.id=s.category_id
join (values
('clothing','men','tshirts','تيشيرتات','T-Shirts',10),('clothing','men','shirts','قمصان','Shirts',20),('clothing','men','pants','بناطيل','Pants',30),('clothing','men','jeans','جينز','Jeans',40),('clothing','men','suits','بدلات','Suits',50),('clothing','men','jackets','جاكيتات ومعاطف','Jackets & Coats',60),
('clothing','women','dresses','فساتين','Dresses',10),('clothing','women','tops','بلوزات وقمصان','Tops & Shirts',20),('clothing','women','pants','بناطيل','Pants',30),('clothing','women','jeans','جينز','Jeans',40),('clothing','women','skirts','تنانير','Skirts',50),('clothing','women','abayas','عبايات','Abayas',60),
('shoes','men','sports','رياضية','Sports',10),('shoes','men','casual','كاجوال','Casual',20),('shoes','men','formal','رسمية','Formal',30),('shoes','men','boots','بوت','Boots',40),
('shoes','women','heels','كعب','Heels',10),('shoes','women','sports','رياضية','Sports',20),('shoes','women','casual','كاجوال','Casual',30),('shoes','women','flats','فلات','Flats',40),('shoes','women','boots','بوت','Boots',50),
('perfumes','men','perfume','عطور','Perfumes',10),('perfumes','women','perfume','عطور','Perfumes',10),('perfumes','unisex','perfume','عطور','Perfumes',10),
('accessories','men','wallets','محافظ','Wallets',10),('accessories','men','belts','أحزمة','Belts',20),('accessories','women','wallets','محافظ','Wallets',10),('accessories','women','scarves','أوشحة','Scarves',20)
) as v(cat,sub,slug,ar,en,ord) on c.slug=v.cat and s.slug=v.sub
on conflict (subcategory_id,slug) do nothing;

-- Safe optional linkage for an existing products table.
do $$
begin
  if to_regclass('public.products') is not null then
    alter table public.products add column if not exists category_id uuid references public.categories(id);
    alter table public.products add column if not exists subcategory_id uuid references public.subcategories(id);
    alter table public.products add column if not exists product_type_id uuid references public.product_types(id);
    alter table public.products add column if not exists attributes jsonb not null default '{}'::jsonb;
  end if;
end $$;
