-- =====================================================================
-- Étape 1 : Fondations
-- Boutiques, équipe et rôles, invitations, marchés, produits, variantes,
-- prix par marché, historique. Sécurité par Row Level Security.
-- À exécuter dans Supabase > SQL Editor (une seule fois).
-- =====================================================================

-- ---------- Tables ----------------------------------------------------

create table public.stores (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id),
  name          text not null check (char_length(name) between 2 and 80),
  slug          text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$'),
  logo_url      text,
  primary_color text not null default '#7c3aed' check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  whatsapp      text,
  settings      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create table public.roles (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  key         text,               -- owner | admin | agent | catalog | logistics | null = rôle personnalisé
  name        text not null check (char_length(name) between 2 and 40),
  description text,
  permissions text[] not null default '{}',
  created_at  timestamptz not null default now(),
  unique (store_id, name),
  unique (store_id, key),
  unique (id, store_id)
);

create table public.store_members (
  store_id      uuid not null references public.stores(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role_id       uuid not null,
  email         text not null,
  full_name     text,
  market_ids    uuid[],            -- null = tous les marchés
  only_assigned boolean not null default false,  -- ne voit que les commandes qui lui sont assignées
  mask_phones   boolean not null default false,  -- numéros clients masqués
  created_at    timestamptz not null default now(),
  primary key (store_id, user_id),
  foreign key (role_id, store_id) references public.roles(id, store_id)
);
create index store_members_user_idx on public.store_members(user_id);

create table public.invitations (
  id            uuid primary key default gen_random_uuid(),
  store_id      uuid not null references public.stores(id) on delete cascade,
  email         text not null,
  role_id       uuid not null,
  market_ids    uuid[],
  only_assigned boolean not null default false,
  mask_phones   boolean not null default false,
  token         text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  invited_by    uuid references auth.users(id) on delete set null,
  expires_at    timestamptz not null default now() + interval '7 days',
  accepted_at   timestamptz,
  created_at    timestamptz not null default now(),
  foreign key (role_id, store_id) references public.roles(id, store_id) on delete cascade
);

create table public.markets (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores(id) on delete cascade,
  name         text not null,
  country_code char(2) not null,
  currency     char(3) not null,
  phone_prefix text not null,
  shipping_fee numeric(12,2) not null default 0 check (shipping_fee >= 0),
  cities       text[] not null default '{}',
  language     text not null default 'fr',
  is_default   boolean not null default false,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (store_id, country_code),
  unique (id, store_id)
);
create unique index markets_one_default_idx on public.markets(store_id) where is_default;

create table public.products (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 200),
  slug        text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  images      text[] not null default '{}',
  options     jsonb not null default '[]'::jsonb,   -- [{ "name": "Taille", "values": ["S","M"] }]
  status      text not null default 'draft' check (status in ('draft','active','archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (store_id, slug),
  unique (id, store_id)
);

create table public.variants (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null,
  store_id      uuid not null,
  title         text not null default 'Défaut',
  option_values text[] not null default '{}',
  sku           text,
  stock         integer check (stock is null or stock >= 0),   -- null = illimité
  position      integer not null default 0,
  created_at    timestamptz not null default now(),
  foreign key (product_id, store_id) references public.products(id, store_id) on delete cascade,
  unique (id, store_id)
);
create index variants_product_idx on public.variants(product_id);

create table public.variant_prices (
  variant_id       uuid not null,
  market_id        uuid not null,
  store_id         uuid not null,
  price            numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= 0),
  primary key (variant_id, market_id),
  foreign key (variant_id, store_id) references public.variants(id, store_id) on delete cascade,
  foreign key (market_id, store_id)  references public.markets(id, store_id)  on delete cascade
);

create table public.activity_log (
  id         bigint generated always as identity primary key,
  store_id   uuid not null references public.stores(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete set null,
  action     text not null,
  details    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activity_log_store_idx on public.activity_log(store_id, created_at desc);

-- ---------- Triggers --------------------------------------------------

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

create trigger products_touch before update on public.products
for each row execute function public.touch_updated_at();

-- Le propriétaire d'une boutique ne peut pas être changé par une simple mise à jour
create or replace function public.lock_store_owner() returns trigger
language plpgsql as $$
begin
  if new.owner_id <> old.owner_id then raise exception 'owner_locked'; end if;
  return new;
end; $$;

create trigger stores_lock_owner before update on public.stores
for each row execute function public.lock_store_owner();

-- ---------- Fonctions de permission ----------------------------------

create or replace function public.is_member(p_store uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from store_members where store_id = p_store and user_id = auth.uid());
$$;

create or replace function public.has_perm(p_store uuid, p_perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from store_members m join roles r on r.id = m.role_id
    where m.store_id = p_store and m.user_id = auth.uid()
      and ('*' = any(r.permissions) or p_perm = any(r.permissions))
  );
$$;

create or replace function public.role_key(p_role uuid) returns text
language sql stable security definer set search_path = public as $$
  select key from roles where id = p_role;
$$;

-- ---------- Création de boutique (rôles système + propriétaire) -------

create or replace function public.create_store(p_name text, p_slug text, p_market jsonb default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_store uuid; v_owner_role uuid; v_email text; v_name text;
  v_slug text := lower(trim(p_slug));
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if v_slug in ('app','www','api','admin','dashboard','mail','support','help','blog','static','assets','cdn','status','docs')
    then raise exception 'slug_reserved'; end if;

  select email, raw_user_meta_data->>'full_name' into v_email, v_name from auth.users where id = auth.uid();

  insert into stores (owner_id, name, slug) values (auth.uid(), trim(p_name), v_slug) returning id into v_store;

  insert into roles (store_id, key, name, description, permissions)
  values (v_store, 'owner', 'Propriétaire', 'Accès total. Ne peut pas être modifié.', array['*'])
  returning id into v_owner_role;

  insert into roles (store_id, key, name, description, permissions) values
    (v_store, 'admin', 'Admin', 'Gère tout au quotidien, y compris l''équipe.',
      array['orders.read','orders.write','orders.ship','products.read','products.write','pages.write',
            'markets.read','markets.write','analytics.read','export.read','settings.write','team.write']),
    (v_store, 'agent', 'Agent commandes', 'Appelle les clients et confirme. Ne voit que les commandes.',
      array['orders.read','orders.write']),
    (v_store, 'catalog', 'Gestionnaire catalogue', 'Crée les produits et les pages produits.',
      array['products.read','products.write','pages.write','markets.read']),
    (v_store, 'logistics', 'Logistique', 'Expédie et suit les livraisons.',
      array['orders.read','orders.ship']);

  insert into store_members (store_id, user_id, role_id, email, full_name)
  values (v_store, auth.uid(), v_owner_role, coalesce(v_email, ''), v_name);

  if p_market is not null then
    insert into markets (store_id, name, country_code, currency, phone_prefix, shipping_fee, cities, is_default)
    values (
      v_store, p_market->>'name', upper(p_market->>'country_code'), upper(p_market->>'currency'),
      p_market->>'phone_prefix', coalesce((p_market->>'shipping_fee')::numeric, 0),
      coalesce(array(select jsonb_array_elements_text(p_market->'cities')), '{}'), true
    );
  end if;

  insert into activity_log (store_id, user_id, action) values (v_store, auth.uid(), 'store.created');
  return v_store;
end; $$;

-- ---------- Invitations ----------------------------------------------

create or replace function public.get_invitation(p_token text)
returns table (store_name text, role_name text, email text, expired boolean, accepted boolean)
language sql stable security definer set search_path = public as $$
  select s.name, r.name, i.email, i.expires_at < now(), i.accepted_at is not null
  from invitations i join stores s on s.id = i.store_id join roles r on r.id = i.role_id
  where i.token = p_token;
$$;

create or replace function public.accept_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_inv invitations%rowtype; v_email text; v_name text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into v_inv from invitations where token = p_token for update;
  if not found then raise exception 'invitation_not_found'; end if;
  if v_inv.accepted_at is not null then raise exception 'invitation_used'; end if;
  if v_inv.expires_at < now() then raise exception 'invitation_expired'; end if;

  select email, raw_user_meta_data->>'full_name' into v_email, v_name from auth.users where id = auth.uid();
  if lower(v_email) <> lower(v_inv.email) then raise exception 'invitation_email_mismatch'; end if;

  insert into store_members (store_id, user_id, role_id, email, full_name, market_ids, only_assigned, mask_phones)
  values (v_inv.store_id, auth.uid(), v_inv.role_id, v_email, v_name, v_inv.market_ids, v_inv.only_assigned, v_inv.mask_phones)
  on conflict (store_id, user_id) do nothing;

  update invitations set accepted_at = now() where id = v_inv.id;
  insert into activity_log (store_id, user_id, action, details)
  values (v_inv.store_id, auth.uid(), 'member.joined', jsonb_build_object('email', v_email));
  return v_inv.store_id;
end; $$;

revoke all on function public.create_store(text, text, jsonb) from public, anon;
grant execute on function public.create_store(text, text, jsonb) to authenticated;
revoke all on function public.accept_invitation(text) from public, anon;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.get_invitation(text) to anon, authenticated;

-- ---------- Row Level Security ---------------------------------------

alter table public.stores          enable row level security;
alter table public.roles           enable row level security;
alter table public.store_members   enable row level security;
alter table public.invitations     enable row level security;
alter table public.markets         enable row level security;
alter table public.products        enable row level security;
alter table public.variants        enable row level security;
alter table public.variant_prices  enable row level security;
alter table public.activity_log    enable row level security;

-- Boutiques : lecture publique (nécessaire pour la vitrine), création via create_store()
create policy stores_read   on public.stores for select using (true);
create policy stores_update on public.stores for update
  using (public.has_perm(id, 'settings.write')) with check (public.has_perm(id, 'settings.write'));
create policy stores_delete on public.stores for delete using (owner_id = auth.uid());

-- Rôles : le rôle Propriétaire est intouchable, personne ne peut créer un rôle "*"
create policy roles_read   on public.roles for select using (public.is_member(store_id));
create policy roles_insert on public.roles for insert with check (
  public.has_perm(store_id, 'team.write') and key is null and not ('*' = any(permissions)));
create policy roles_update on public.roles for update
  using (public.has_perm(store_id, 'team.write') and key is distinct from 'owner')
  with check (public.has_perm(store_id, 'team.write') and key is distinct from 'owner' and not ('*' = any(permissions)));
create policy roles_delete on public.roles for delete
  using (public.has_perm(store_id, 'team.write') and key is null);

-- Membres : on ne peut ni modifier le propriétaire, ni nommer quelqu'un propriétaire
create policy members_read on public.store_members for select using (public.is_member(store_id));
create policy members_update on public.store_members for update
  using (public.has_perm(store_id, 'team.write') and public.role_key(role_id) is distinct from 'owner')
  with check (public.has_perm(store_id, 'team.write') and public.role_key(role_id) is distinct from 'owner');
create policy members_delete on public.store_members for delete using (
  public.role_key(role_id) is distinct from 'owner'
  and (public.has_perm(store_id, 'team.write') or user_id = auth.uid()));

create policy invitations_read   on public.invitations for select using (public.has_perm(store_id, 'team.write'));
create policy invitations_insert on public.invitations for insert with check (
  public.has_perm(store_id, 'team.write') and public.role_key(role_id) is distinct from 'owner');
create policy invitations_delete on public.invitations for delete using (public.has_perm(store_id, 'team.write'));

-- Marchés : les marchés actifs sont publics (vitrine)
create policy markets_read  on public.markets for select using (active or public.is_member(store_id));
create policy markets_write on public.markets for all
  using (public.has_perm(store_id, 'markets.write')) with check (public.has_perm(store_id, 'markets.write'));

-- Produits : les produits actifs sont publics (vitrine)
create policy products_read  on public.products for select
  using (status = 'active' or public.has_perm(store_id, 'products.read'));
create policy products_write on public.products for all
  using (public.has_perm(store_id, 'products.write')) with check (public.has_perm(store_id, 'products.write'));

create policy variants_read on public.variants for select using (
  public.has_perm(store_id, 'products.read')
  or exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
create policy variants_write on public.variants for all
  using (public.has_perm(store_id, 'products.write')) with check (public.has_perm(store_id, 'products.write'));

create policy prices_read on public.variant_prices for select using (
  public.has_perm(store_id, 'products.read')
  or exists (select 1 from public.variants v join public.products p on p.id = v.product_id
             where v.id = variant_id and p.status = 'active'));
create policy prices_write on public.variant_prices for all
  using (public.has_perm(store_id, 'products.write')) with check (public.has_perm(store_id, 'products.write'));

create policy activity_read   on public.activity_log for select using (public.has_perm(store_id, 'team.write'));
create policy activity_insert on public.activity_log for insert
  with check (public.is_member(store_id) and user_id = auth.uid());

-- ---------- Stockage des images --------------------------------------

insert into storage.buckets (id, name, public) values ('store-assets', 'store-assets', true)
on conflict (id) do nothing;

create policy store_assets_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'store-assets' and (
    public.has_perm(((storage.foldername(name))[1])::uuid, 'products.write')
    or public.has_perm(((storage.foldername(name))[1])::uuid, 'settings.write')));

create policy store_assets_delete on storage.objects for delete to authenticated using (
  bucket_id = 'store-assets' and (
    public.has_perm(((storage.foldername(name))[1])::uuid, 'products.write')
    or public.has_perm(((storage.foldername(name))[1])::uuid, 'settings.write')));
