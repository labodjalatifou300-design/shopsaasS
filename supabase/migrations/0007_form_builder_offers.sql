-- Ajoute les réglages du créateur de formulaire sans casser les configurations existantes.
alter table public.form_configs add column if not exists upsells jsonb not null default '[]'::jsonb;
alter table public.form_configs add column if not exists quantity_offers jsonb not null default '[]'::jsonb;
