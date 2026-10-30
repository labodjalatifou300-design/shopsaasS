-- =====================================================================
-- Étape 8 : Store Builder — Pages & paramètres de thème
-- Ajoute les tables store_pages, store_settings et adapte stores
-- pour le système de boutiques en ligne (builder visuel).
-- =====================================================================

-- Ajouter la colonne status sur stores si elle n'existe pas
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'paused'));

-- Ajouter user_id comme alias de owner_id (pour compatibilité API)
-- Les APIs boutique utilisent user_id, la table existante a owner_id
-- On crée un index pour la recherche par owner_id
CREATE INDEX IF NOT EXISTS stores_owner_idx ON public.stores(owner_id);

-- Table store_settings : thème sélectionné et paramètres globaux
CREATE TABLE IF NOT EXISTS public.store_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  theme_id    text NOT NULL DEFAULT 'nature-vert',
  custom_css  text,
  custom_head text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id)
);

CREATE TRIGGER store_settings_touch BEFORE UPDATE ON public.store_settings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Table store_pages : contenu du builder (builder_json)
CREATE TABLE IF NOT EXISTS public.store_pages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title        text NOT NULL DEFAULT 'Accueil',
  slug         text NOT NULL DEFAULT 'home',
  builder_json jsonb,
  is_published boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, slug)
);

CREATE TRIGGER store_pages_touch BEFORE UPDATE ON public.store_pages
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_pages    ENABLE ROW LEVEL SECURITY;

-- store_settings
CREATE POLICY store_settings_read ON public.store_settings
  FOR SELECT USING (true);  -- public (pour le renderer landing)
CREATE POLICY store_settings_write ON public.store_settings
  FOR ALL USING (public.has_perm(store_id, 'settings.write'))
  WITH CHECK (public.has_perm(store_id, 'settings.write'));

-- store_pages : lecture publique des pages publiées, écriture restreinte
CREATE POLICY store_pages_read ON public.store_pages
  FOR SELECT USING (is_published OR public.has_perm(store_id, 'pages.write'));
CREATE POLICY store_pages_write ON public.store_pages
  FOR ALL USING (public.has_perm(store_id, 'pages.write'))
  WITH CHECK (public.has_perm(store_id, 'pages.write'));

-- Permettre à l'owner d'insérer via les API routes (service role)
-- Les API routes utilisent le server client avec la session de l'user
CREATE POLICY store_settings_owner_insert ON public.store_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY store_pages_owner_insert ON public.store_pages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()
    )
  );

-- Permettre à l'owner de créer une boutique directement (sans passer par create_store())
-- Les API routes du builder créent la boutique directement avec INSERT
CREATE POLICY stores_owner_insert ON public.stores
  FOR INSERT WITH CHECK (owner_id = auth.uid());
