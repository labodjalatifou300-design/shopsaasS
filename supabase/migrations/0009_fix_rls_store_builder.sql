-- =====================================================================
-- Étape 9 : Correction RLS store_builder
-- Remplace les policies write qui bloquaient les propriétaires
-- qui n'ont pas de store_members (boutiques créées via INSERT direct).
-- =====================================================================

-- Fonction utilitaire : vérifie si l'user est owner OU has_perm
CREATE OR REPLACE FUNCTION public.can_write_store(p_store uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    -- Owner direct de la boutique
    EXISTS (SELECT 1 FROM stores WHERE id = p_store AND owner_id = auth.uid())
    OR
    -- Membre avec la permission requise
    public.has_perm(p_store, 'pages.write');
$$;

CREATE OR REPLACE FUNCTION public.can_manage_store(p_store uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    EXISTS (SELECT 1 FROM stores WHERE id = p_store AND owner_id = auth.uid())
    OR
    public.has_perm(p_store, 'settings.write');
$$;

-- ── store_pages ──────────────────────────────────────────────────────

-- Supprimer les anciennes policies conflictuelles
DROP POLICY IF EXISTS store_pages_write          ON public.store_pages;
DROP POLICY IF EXISTS store_pages_owner_insert   ON public.store_pages;
DROP POLICY IF EXISTS store_pages_read           ON public.store_pages;

-- Lecture : pages publiées = publiques ; draft = owner ou membre
CREATE POLICY store_pages_read ON public.store_pages
  FOR SELECT USING (
    is_published
    OR public.can_write_store(store_id)
  );

-- Écriture (INSERT / UPDATE / DELETE) : owner OU membre pages.write
CREATE POLICY store_pages_write ON public.store_pages
  FOR ALL
  USING (public.can_write_store(store_id))
  WITH CHECK (public.can_write_store(store_id));

-- ── store_settings ───────────────────────────────────────────────────

DROP POLICY IF EXISTS store_settings_write         ON public.store_settings;
DROP POLICY IF EXISTS store_settings_owner_insert  ON public.store_settings;

CREATE POLICY store_settings_write ON public.store_settings
  FOR ALL
  USING (public.can_manage_store(store_id))
  WITH CHECK (public.can_manage_store(store_id));

-- ── stores ───────────────────────────────────────────────────────────

-- Permettre la mise à jour du status par l'owner (pour publier/dépublier)
DROP POLICY IF EXISTS stores_owner_update ON public.stores;
CREATE POLICY stores_owner_update ON public.stores
  FOR UPDATE
  USING (owner_id = auth.uid() OR public.has_perm(id, 'settings.write'))
  WITH CHECK (owner_id = auth.uid() OR public.has_perm(id, 'settings.write'));
