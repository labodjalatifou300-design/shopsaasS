create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  market_id uuid not null references public.markets(id),
  order_number text not null,
  customer_name text not null,
  customer_phone text not null,
  customer_city text,
  customer_address text not null,
  note text,
  lines jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0,
  shipping_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null default 'new' check (status in ('new','confirmed','unreachable','scheduled','shipped','delivered','cancelled','returned')),
  assigned_to uuid references auth.users(id) on delete set null,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_store_created_idx on public.orders(store_id, created_at desc);
create index if not exists orders_store_status_idx on public.orders(store_id, status);
create table if not exists public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  note text,
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;
alter table public.order_events enable row level security;
create policy "orders_staff_read" on public.orders for select using (public.has_perm(store_id, 'orders.read'));
create policy "orders_staff_update" on public.orders for update using (public.has_perm(store_id, 'orders.write') or public.has_perm(store_id, 'orders.ship'));
create policy "order_events_staff" on public.order_events for all using (public.has_perm(store_id, 'orders.read')) with check (public.has_perm(store_id, 'orders.write'));

create or replace function public.create_public_order(
  p_store_id uuid, p_market_id uuid, p_name text, p_phone text, p_city text, p_address text,
  p_note text, p_lines jsonb, p_subtotal numeric, p_shipping numeric, p_total numeric
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_number text;
begin
  if length(trim(p_name)) < 2 or length(trim(p_phone)) < 6 or length(trim(p_address)) < 3 then raise exception 'invalid_customer'; end if;
  if exists (select 1 from orders where store_id=p_store_id and customer_phone=trim(p_phone) and created_at > now() - interval '24 hours' and status not in ('cancelled','returned')) then raise exception 'duplicate_order'; end if;
  v_number := 'CMD-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into orders(store_id, market_id, order_number, customer_name, customer_phone, customer_city, customer_address, note, lines, subtotal, shipping_fee, total)
  values(p_store_id,p_market_id,v_number,trim(p_name),trim(p_phone),trim(p_city),trim(p_address),nullif(trim(p_note),''),p_lines,p_subtotal,p_shipping,p_total)
  returning id into v_id;
  insert into order_events(order_id, store_id, event_type) values(v_id,p_store_id,'created');
  return v_id;
end; $$;
revoke all on function public.create_public_order(uuid,uuid,text,text,text,text,text,jsonb,numeric,numeric,numeric) from public, anon;
grant execute on function public.create_public_order(uuid,uuid,text,text,text,text,text,jsonb,numeric,numeric,numeric) to anon, authenticated;
