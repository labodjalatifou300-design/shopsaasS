-- Web Push endpoints are private credentials. Only server-side service_role
-- handlers may read or modify them.
CREATE TABLE IF NOT EXISTS public.web_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS web_push_subscriptions_store_idx
  ON public.web_push_subscriptions(store_id);

ALTER TABLE public.web_push_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.web_push_subscriptions FROM anon, authenticated;
GRANT ALL ON public.web_push_subscriptions TO service_role;
