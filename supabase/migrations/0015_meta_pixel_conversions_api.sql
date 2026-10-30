-- Private, per-store Meta Pixel / Conversions API settings.
-- The access token is stored in Supabase Vault, never in the public page JSON.

DO $$
BEGIN
  IF to_regclass('vault.secrets') IS NULL OR to_regclass('vault.decrypted_secrets') IS NULL THEN
    RAISE EXCEPTION 'Supabase Vault is unavailable. Enable Vault before running migration 0015.';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.store_meta_integrations (
  store_id uuid PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  pixel_id text NOT NULL,
  access_token_secret_id uuid,
  test_event_code text,
  test_mode boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_meta_integrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_meta_integrations FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_meta_integrations TO service_role;

-- Move the old theme fields into a private row and encrypted Vault secret.
DO $$
DECLARE
  old_config record;
  new_secret_id uuid;
BEGIN
  FOR old_config IN
    SELECT DISTINCT ON (store_id)
      store_id,
      nullif(btrim(builder_json #>> '{themeSettings,meta_pixel_id}'), '') AS pixel_id,
      nullif(btrim(builder_json #>> '{themeSettings,meta_capi_token}'), '') AS access_token
    FROM public.store_pages
    WHERE jsonb_typeof(builder_json #> '{themeSettings}') = 'object'
      AND (
        nullif(btrim(builder_json #>> '{themeSettings,meta_pixel_id}'), '') IS NOT NULL
        OR nullif(btrim(builder_json #>> '{themeSettings,meta_capi_token}'), '') IS NOT NULL
      )
    ORDER BY store_id, updated_at DESC
  LOOP
    new_secret_id := NULL;
    IF old_config.access_token IS NOT NULL THEN
      SELECT vault.create_secret(
        old_config.access_token,
        'meta-capi-' || old_config.store_id::text,
        'Meta Conversions API token for one ShopSaaS store'
      ) INTO new_secret_id;
    END IF;

    INSERT INTO public.store_meta_integrations (
      store_id, pixel_id, access_token_secret_id, test_mode, updated_at
    )
    VALUES (
      old_config.store_id,
      coalesce(old_config.pixel_id, ''),
      new_secret_id,
      false,
      now()
    )
    ON CONFLICT (store_id) DO NOTHING;
  END LOOP;
END $$;

-- Remove the legacy token and Pixel ID from JSON that is sent to public pages.
UPDATE public.store_pages
SET builder_json = jsonb_set(
  builder_json,
  '{themeSettings}',
  (builder_json -> 'themeSettings') - 'meta_capi_token' - 'meta_pixel_id',
  true
)
WHERE jsonb_typeof(builder_json -> 'themeSettings') = 'object'
  AND (
    builder_json #> '{themeSettings,meta_capi_token}' IS NOT NULL
    OR builder_json #> '{themeSettings,meta_pixel_id}' IS NOT NULL
  );

CREATE OR REPLACE FUNCTION public.save_store_meta_integration(
  p_store_id uuid,
  p_pixel_id text,
  p_access_token text,
  p_test_event_code text,
  p_test_mode boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
DECLARE
  current_secret_id uuid;
  next_secret_id uuid;
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'service_role required';
  END IF;

  SELECT access_token_secret_id
    INTO current_secret_id
    FROM public.store_meta_integrations
    WHERE store_id = p_store_id;

  next_secret_id := current_secret_id;
  IF nullif(btrim(p_access_token), '') IS NOT NULL THEN
    IF current_secret_id IS NULL THEN
      SELECT vault.create_secret(
        btrim(p_access_token),
        'meta-capi-' || p_store_id::text,
        'Meta Conversions API token for one ShopSaaS store'
      ) INTO next_secret_id;
    ELSE
      PERFORM vault.update_secret(current_secret_id, btrim(p_access_token), NULL, NULL);
    END IF;
  END IF;

  INSERT INTO public.store_meta_integrations (
    store_id, pixel_id, access_token_secret_id, test_event_code, test_mode, updated_at
  )
  VALUES (
    p_store_id, btrim(p_pixel_id), next_secret_id,
    nullif(btrim(p_test_event_code), ''), coalesce(p_test_mode, false), now()
  )
  ON CONFLICT (store_id) DO UPDATE
    SET pixel_id = EXCLUDED.pixel_id,
        access_token_secret_id = EXCLUDED.access_token_secret_id,
        test_event_code = EXCLUDED.test_event_code,
        test_mode = EXCLUDED.test_mode,
        updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.read_store_meta_access_token(p_store_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
DECLARE
  result text;
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'service_role required';
  END IF;

  SELECT decrypted.decrypted_secret
    INTO result
    FROM public.store_meta_integrations AS integration
    JOIN vault.decrypted_secrets AS decrypted
      ON decrypted.id = integration.access_token_secret_id
    WHERE integration.store_id = p_store_id;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_store_meta_integration(p_store_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
DECLARE
  current_secret_id uuid;
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'service_role required';
  END IF;

  SELECT access_token_secret_id
    INTO current_secret_id
    FROM public.store_meta_integrations
    WHERE store_id = p_store_id;

  DELETE FROM public.store_meta_integrations WHERE store_id = p_store_id;
  IF current_secret_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = current_secret_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.save_store_meta_integration(uuid, text, text, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_store_meta_access_token(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_store_meta_integration(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_store_meta_integration(uuid, text, text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_store_meta_access_token(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_store_meta_integration(uuid) TO service_role;
