-- =====================================================================
-- Étape 10 : Création des buckets Supabase Storage
-- • store-assets  → images produits, logos (ImageUploader.tsx)
-- • store-images  → images sections éditeur de boutique (ImageUploadField.tsx)
-- =====================================================================

-- ── Bucket store-assets ──────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-assets',
  'store-assets',
  true,
  10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/avif','video/mp4','video/webm','video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- ── Bucket store-images ──────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-images',
  'store-images',
  true,
  10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/avif','image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- ── Policies store-assets ────────────────────────────────────────────
DROP POLICY IF EXISTS "store-assets public read"           ON storage.objects;
DROP POLICY IF EXISTS "store-assets authenticated upload"  ON storage.objects;
DROP POLICY IF EXISTS "store-assets authenticated update"  ON storage.objects;
DROP POLICY IF EXISTS "store-assets owner delete"          ON storage.objects;

CREATE POLICY "store-assets public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-assets');

CREATE POLICY "store-assets authenticated upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'store-assets');

CREATE POLICY "store-assets authenticated update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'store-assets');

CREATE POLICY "store-assets owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'store-assets');

-- ── Policies store-images ────────────────────────────────────────────
DROP POLICY IF EXISTS "store-images public read"           ON storage.objects;
DROP POLICY IF EXISTS "store-images authenticated upload"  ON storage.objects;
DROP POLICY IF EXISTS "store-images authenticated update"  ON storage.objects;
DROP POLICY IF EXISTS "store-images owner delete"          ON storage.objects;

CREATE POLICY "store-images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-images');

CREATE POLICY "store-images authenticated upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'store-images');

CREATE POLICY "store-images authenticated update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'store-images');

CREATE POLICY "store-images owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'store-images');
