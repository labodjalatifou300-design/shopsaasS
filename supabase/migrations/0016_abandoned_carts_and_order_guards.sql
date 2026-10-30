-- Abandoned cart records are kept only after the shopper explicitly agrees
-- to be contacted about an unfinished order.
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  variant_id uuid NOT NULL,
  market_id uuid NOT NULL,
  session_id uuid NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  customer_city text,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  currency char(3) NOT NULL,
  estimated_total numeric(12,2) NOT NULL DEFAULT 0 CHECK (estimated_total >= 0),
  contact_consent_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'contacted', 'converted', 'dismissed')),
  converted_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  CONSTRAINT abandoned_carts_product_store_fk
    FOREIGN KEY (product_id, store_id) REFERENCES public.products(id, store_id) ON DELETE CASCADE,
  CONSTRAINT abandoned_carts_variant_store_fk
    FOREIGN KEY (variant_id, store_id) REFERENCES public.variants(id, store_id) ON DELETE CASCADE,
  CONSTRAINT abandoned_carts_market_store_fk
    FOREIGN KEY (market_id, store_id) REFERENCES public.markets(id, store_id) ON DELETE CASCADE,
  UNIQUE (store_id, session_id, product_id)
);

CREATE INDEX IF NOT EXISTS abandoned_carts_store_active_idx
  ON public.abandoned_carts(store_id, status, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS abandoned_carts_expiry_idx
  ON public.abandoned_carts(expires_at);

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.abandoned_carts FROM anon;
REVOKE ALL ON public.abandoned_carts FROM authenticated;
GRANT SELECT, UPDATE, DELETE ON public.abandoned_carts TO authenticated;
GRANT ALL ON public.abandoned_carts TO service_role;

DROP POLICY IF EXISTS abandoned_carts_read_team ON public.abandoned_carts;
CREATE POLICY abandoned_carts_read_team ON public.abandoned_carts
  FOR SELECT TO authenticated
  USING (public.has_perm(store_id, 'orders.read') AND expires_at > now());

DROP POLICY IF EXISTS abandoned_carts_update_team ON public.abandoned_carts;
CREATE POLICY abandoned_carts_update_team ON public.abandoned_carts
  FOR UPDATE TO authenticated
  USING (public.has_perm(store_id, 'orders.write') AND expires_at > now())
  WITH CHECK (public.has_perm(store_id, 'orders.write'));

DROP POLICY IF EXISTS abandoned_carts_delete_team ON public.abandoned_carts;
CREATE POLICY abandoned_carts_delete_team ON public.abandoned_carts
  FOR DELETE TO authenticated
  USING (public.has_perm(store_id, 'orders.write'));

-- If the project's pg_cron extension is available and permitted, purge expired
-- customer contact data daily. Expired rows are hidden by RLS even when cron
-- is unavailable.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    BEGIN
      EXECUTE 'CREATE EXTENSION IF NOT EXISTS pg_cron';
      PERFORM cron.schedule(
        'shopsaas-purge-abandoned-carts',
        '15 3 * * *',
        'DELETE FROM public.abandoned_carts WHERE expires_at <= now()'
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not schedule automatic abandoned-cart cleanup. Expired rows remain hidden, but arrange a daily DELETE for expired rows: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'pg_cron is not available. Expired abandoned carts are hidden; enable a scheduled daily purge before production.';
  END IF;
END $$;
