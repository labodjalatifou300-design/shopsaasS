alter table public.stores add column if not exists country_code char(2);
alter table public.stores add column if not exists currency char(3);
alter table public.stores add column if not exists phone_prefix text;

create or replace function public.create_store(p_name text, p_slug text, p_market jsonb default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_store uuid; v_owner_role uuid; v_email text; v_name text;
  v_slug text := lower(trim(p_slug));
  v_country text := upper(coalesce(p_market->>'country_code', ''));
  v_currency text := upper(coalesce(p_market->>'currency', ''));
  v_prefix text := coalesce(p_market->>'phone_prefix', '');
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if v_slug in ('app','www','api','admin','dashboard','mail','support','help','blog','static','assets','cdn','status','docs')
    then raise exception 'slug_reserved'; end if;
  select email, raw_user_meta_data->>'full_name' into v_email, v_name from auth.users where id = auth.uid();

  insert into stores (owner_id, name, slug, country_code, currency, phone_prefix)
  values (auth.uid(), trim(p_name), v_slug, nullif(v_country, ''), nullif(v_currency, ''), nullif(v_prefix, ''))
  returning id into v_store;

  insert into roles (store_id, key, name, description, permissions)
  values (v_store, 'owner', 'Propriétaire', 'Accès total. Ne peut pas être modifié.', array['*'])
  returning id into v_owner_role;
  insert into roles (store_id, key, name, description, permissions) values
    (v_store, 'admin', 'Admin', 'Gère tout au quotidien, y compris l''équipe.',
      array['orders.read','orders.write','orders.ship','products.read','products.write','pages.write','markets.read','markets.write','analytics.read','export.read','settings.write','team.write']),
    (v_store, 'agent', 'Agent commandes', 'Appelle les clients et confirme.', array['orders.read','orders.write']),
    (v_store, 'catalog', 'Gestionnaire catalogue', 'Crée les produits et les pages produits.', array['products.read','products.write','pages.write','markets.read']),
    (v_store, 'logistics', 'Logistique', 'Expédie et suit les livraisons.', array['orders.read','orders.ship']);
  insert into store_members (store_id, user_id, role_id, email, full_name)
  values (v_store, auth.uid(), v_owner_role, coalesce(v_email, ''), v_name);
  if p_market is not null then
    insert into markets (store_id, name, country_code, currency, phone_prefix, shipping_fee, cities, is_default)
    values (v_store, p_market->>'name', v_country, v_currency, v_prefix, coalesce((p_market->>'shipping_fee')::numeric, 0),
      coalesce(array(select jsonb_array_elements_text(p_market->'cities')), '{}'), true);
  end if;
  insert into activity_log (store_id, user_id, action) values (v_store, auth.uid(), 'store.created');
  return v_store;
end; $$;
