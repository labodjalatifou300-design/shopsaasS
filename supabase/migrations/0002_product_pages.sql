-- Étape 2 : sections de page produit, dans l'esprit des templates Shopify.
create table if not exists public.product_pages (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  store_id uuid not null,
  market_id uuid,
  sections jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (product_id, market_id),
  foreign key (product_id, store_id) references public.products(id, store_id) on delete cascade,
  foreign key (market_id, store_id) references public.markets(id, store_id) on delete cascade
);

alter table public.product_pages enable row level security;
create policy "product_pages_read" on public.product_pages for select using (public.has_perm(store_id, 'pages.write') or public.has_perm(store_id, 'products.read'));
create policy "product_pages_write" on public.product_pages for all using (public.has_perm(store_id, 'pages.write')) with check (public.has_perm(store_id, 'pages.write'));
