create table if not exists public.form_configs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null default 'Formulaire principal',
  mode text not null default 'inline' check (mode in ('inline','popup')),
  fields jsonb not null default '[]'::jsonb,
  bundle jsonb not null default '{"enabled":true,"offers":[]}'::jsonb,
  styles jsonb not null default '{"accent":"#2563eb","buttonText":"Je valide ma commande"}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (store_id, name)
);
alter table public.form_configs enable row level security;
create policy "form_configs_read" on public.form_configs for select using (public.has_perm(store_id, 'pages.write'));
create policy "form_configs_write" on public.form_configs for all using (public.has_perm(store_id, 'pages.write')) with check (public.has_perm(store_id, 'pages.write'));
