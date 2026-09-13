create table if not exists harmony_orders (
  id serial primary key,
  result_id text not null,
  product text not null check (product in ('tips', 'pdf')),
  paypal_order_id text not null unique,
  status text not null default 'created',
  created_at timestamptz not null default now()
);

create table if not exists harmony_results (
  result_id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists harmony_unlocks (
  id serial primary key,
  result_id text not null,
  product text not null check (product in ('tips', 'pdf')),
  paypal_order_id text not null unique,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (result_id, product)
);

create unique index if not exists harmony_unlocks_result_product_idx
  on harmony_unlocks (result_id, product);
