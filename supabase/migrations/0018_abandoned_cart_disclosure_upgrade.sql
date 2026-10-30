-- Upgrade stores that already ran the earlier 0016 migration, where this
-- timestamp was named contact_consent_at. It now records when the notice was
-- displayed, not an affirmative checkbox.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'abandoned_carts'
      AND column_name = 'contact_consent_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'abandoned_carts'
      AND column_name = 'contact_disclosure_at'
  ) THEN
    ALTER TABLE public.abandoned_carts
      RENAME COLUMN contact_consent_at TO contact_disclosure_at;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'abandoned_carts'
      AND column_name = 'contact_disclosure_at'
  ) THEN
    ALTER TABLE public.abandoned_carts
      ADD COLUMN contact_disclosure_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;
