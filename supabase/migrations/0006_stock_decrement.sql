-- Décrémente le stock de façon atomique lors de la création d'une commande.
-- À exécuter après 0005_orders.sql dans Supabase SQL Editor.
create or replace function public.create_public_order(
  p_store_id uuid, p_market_id uuid, p_name text, p_phone text, p_city text, p_address text,
  p_note text, p_lines jsonb, p_subtotal numeric, p_shipping numeric, p_total numeric
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_number text;
  v_line jsonb;
  v_variant uuid;
  v_quantity integer;
  v_stock integer;
  v_price numeric;
  v_title text;
  v_subtotal numeric := 0;
  v_shipping numeric := 0;
  v_lines jsonb := '[]'::jsonb;
  v_address text;
begin
  v_address := coalesce(nullif(trim(p_address), ''), nullif(trim(p_city), ''));
  if length(trim(p_name)) < 2 or length(trim(p_phone)) < 6 or length(coalesce(v_address, '')) < 2 then
    raise exception 'invalid_customer';
  end if;
  if coalesce(jsonb_typeof(p_lines), '') <> 'array' then
    raise exception 'invalid_lines';
  end if;
  if jsonb_array_length(p_lines) < 1 then
    raise exception 'invalid_lines';
  end if;
  if not exists (
    select 1 from markets
    where id = p_market_id and store_id = p_store_id and active = true
  ) then
    raise exception 'invalid_market';
  end if;
  select shipping_fee into v_shipping
  from markets where id = p_market_id and store_id = p_store_id;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_variant := nullif(v_line->>'variant_id', '')::uuid;
    v_quantity := (v_line->>'quantity')::integer;
    if v_variant is null or v_quantity is null or v_quantity < 1 or v_quantity > 99 then
      raise exception 'invalid_line';
    end if;
    select v.stock, vp.price, p.title
      into v_stock, v_price, v_title
      from variants v
      join products p on p.id = v.product_id and p.store_id = v.store_id
      join variant_prices vp on vp.variant_id = v.id and vp.store_id = v.store_id
     where v.id = v_variant
       and v.store_id = p_store_id
       and p.status = 'active'
       and vp.market_id = p_market_id
     for update of v;
    if not found then raise exception 'invalid_variant'; end if;
    if v_stock is not null and v_stock < v_quantity then raise exception 'out_of_stock'; end if;
    if v_stock is not null then update variants set stock = stock - v_quantity where id = v_variant and store_id = p_store_id; end if;
    v_subtotal := v_subtotal + (v_price * v_quantity);
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'variant_id', v_variant,
      'quantity', v_quantity,
      'price', v_price,
      'title', v_title
    ));
  end loop;

  v_number := 'CMD-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into orders(store_id, market_id, order_number, customer_name, customer_phone, customer_city, customer_address, note, lines, subtotal, shipping_fee, total)
  values(p_store_id,p_market_id,v_number,trim(p_name),trim(p_phone),trim(p_city),v_address,nullif(trim(p_note),''),v_lines,v_subtotal,v_shipping,v_subtotal+v_shipping)
  returning id into v_id;
  insert into order_events(order_id, store_id, event_type) values(v_id,p_store_id,'created');
  return v_id;
end; $$;

revoke all on function public.create_public_order(uuid,uuid,text,text,text,text,text,jsonb,numeric,numeric,numeric) from public, anon;
grant execute on function public.create_public_order(uuid,uuid,text,text,text,text,text,jsonb,numeric,numeric,numeric) to anon, authenticated;
