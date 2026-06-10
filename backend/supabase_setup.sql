-- ============================================================
-- Hampious Database Setup — Run this in Supabase SQL Editor
-- ============================================================

-- 1. CATEGORIES
create table if not exists categories (
  id          serial primary key,
  name        text not null,
  slug        text unique not null,
  description text,
  icon        text default '🛍️',
  created_at  timestamptz default now()
);

-- 2. PRODUCTS
create table if not exists products (
  id             serial primary key,
  name           text not null,
  price          numeric(10,2) not null default 0,
  original_price numeric(10,2),
  category       text,
  description    text,
  images         text[] default '{}',
  stock          integer default 0,
  tags           text[] default '{}',
  is_featured    boolean default false,
  created_at     timestamptz default now()
);

-- 3. CUSTOMERS (users who place orders)
create table if not exists customers (
  id           serial primary key,
  email        text unique not null,
  name         text,
  phone        text,
  password     text,
  total_orders integer default 0,
  total_spent  numeric(10,2) default 0,
  created_at   timestamptz default now()
);

-- 4. ORDERS
create table if not exists orders (
  id               text primary key default ('ORD-' || extract(epoch from now())::bigint::text),
  customer_name    text,
  customer_email   text,
  customer_phone   text,
  items            jsonb default '[]',
  total_amount     numeric(10,2) default 0,
  discount_amount  numeric(10,2) default 0,
  final_amount     numeric(10,2) default 0,
  shipping_address jsonb default '{}',
  payment_method   text default 'razorpay',
  payment_id       text,
  payment_status   text default 'pending',
  status           text default 'pending',
  tracking_number  text,
  courier          text,
  notes            text,
  gift_message     text,
  spotify_link     text,
  qr_code          text,
  coupon_code      text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- 5. CART
create table if not exists cart (
  id         serial primary key,
  email      text not null,
  product_id text not null,
  quantity   integer default 1,
  price      numeric(10,2) default 0,
  added_at   timestamptz default now(),
  unique(email, product_id)
);

-- ── Seed default categories ──────────────────────────────────────────────────
insert into categories (name, slug, description, icon) values
  ('Birthday',    'birthday',  'Birthday hampers',        '🎂'),
  ('Love',        'love',      'Love & romance hampers',  '❤️'),
  ('Period Care', 'period',    'Period care & wellness',  '🌸'),
  ('Sorry',       'sorry',     'Apology hampers',         '💔'),
  ('Festive',     'festive',   'Festive & celebration',   '🎉'),
  ('Self Care',   'self-care', 'Self care hampers',       '💆')
on conflict (slug) do nothing;

-- ── Enable Row Level Security (optional but recommended) ─────────────────────
-- alter table products  enable row level security;
-- alter table orders    enable row level security;
-- alter table customers enable row level security;
-- alter table cart      enable row level security;
-- alter table categories enable row level security;

-- 6. OTPs (persistent across restarts)
create table if not exists otps (
  email       text primary key,
  otp_code    text not null,
  expires_at  timestamptz not null,
  created_at  timestamptz default now()
);

-- 7. COUPONS
create table if not exists coupons (
  id               serial primary key,
  code             text unique not null,
  discount_percent numeric(5,2) not null default 0,
  min_order_amount numeric(10,2) default 0,
  max_uses         integer,
  times_used       integer default 0,
  is_active        boolean default true,
  description      text,
  expires_at       timestamptz,
  created_at       timestamptz default now()
);
