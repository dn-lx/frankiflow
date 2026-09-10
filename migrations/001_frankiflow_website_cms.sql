-- FrankiFlow website CMS migration
-- Target: existing Supabase project "FrankiFlow Pricing"
-- Safe naming: all new business tables use frankiflow_* and reuse pricing_config/pricing_admin_users.

create schema if not exists private;

create or replace function private.frankiflow_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.pricing_admin_users a
    where a.user_id = (select auth.uid())
      and a.active = true
      and a.role = 'admin'
  );
$$;
revoke all on function private.frankiflow_is_admin() from public;
grant execute on function private.frankiflow_is_admin() to authenticated;

create table public.frankiflow_site_settings (
  id smallint primary key default 1 check (id = 1),
  hero_eyebrow text not null default 'Mehr als Reinigung.',
  hero_title text not null default 'Gebäudereinigung & Objektbetreuung in Frankfurt am Main',
  hero_subtitle text not null default 'Professionelle Reinigung für Wohnungen, Büros, Ferienwohnungen und Gewerbe – zuverlässig, flexibel und persönlich.',
  hero_image_path text,
  offer_title text not null default '25% Neukundenrabatt im ersten Monat',
  offer_text text not null default 'Zusätzlich ist eine kostenlose Probereinigung nach Absprache möglich.',
  email text not null default 'info@frankiflow.de',
  phone text not null default '+49 176 62493041',
  whatsapp_url text not null default 'https://wa.link/9knp7y',
  service_area text not null default 'Frankfurt am Main & Umgebung',
  calculator_url text not null default '/preisrechner',
  primary_cta_label text not null default 'Preis sofort berechnen',
  secondary_cta_label text not null default 'Angebot anfragen',
  legal_owner text not null default 'Inura Devasurendra',
  legal_street text not null default '',
  legal_postcode_city text not null default 'Frankfurt am Main',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table public.frankiflow_gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  alt_text text not null default '',
  storage_path text not null unique,
  category text not null default 'general' check (category in ('hero','general','office','home','airbnb','staircase','commercial')),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table public.frankiflow_testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_context text not null default '',
  quote text not null,
  rating smallint not null default 5 check (rating between 1 and 5),
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.frankiflow_quote_requests (
  id uuid primary key default gen_random_uuid(),
  service_key text not null,
  frequency_key text,
  area_sqm numeric check (area_sqm is null or area_sqm > 0),
  contract_months integer,
  window_sqm numeric check (window_sqm is null or window_sqm >= 0),
  equipment_by_frankiflow boolean not null default false,
  deep_cleaning boolean not null default false,
  estimated_monthly numeric check (estimated_monthly is null or estimated_monthly >= 0),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null default '',
  postcode text not null default '',
  company_name text not null default '',
  message text not null default '',
  privacy_accepted boolean not null default false,
  status text not null default 'new' check (status in ('new','contacted','quoted','won','lost','archived')),
  internal_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.frankiflow_payments (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid references public.frankiflow_quote_requests(id) on delete set null,
  description text not null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'eur' check (char_length(currency) = 3),
  customer_email text not null,
  status text not null default 'created' check (status in ('created','checkout_open','paid','expired','failed','refunded')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  checkout_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.frankiflow_site_settings enable row level security;
alter table public.frankiflow_gallery enable row level security;
alter table public.frankiflow_testimonials enable row level security;
alter table public.frankiflow_quote_requests enable row level security;
alter table public.frankiflow_payments enable row level security;

create policy frankiflow_public_site_settings_read on public.frankiflow_site_settings for select to anon, authenticated using (true);
create policy frankiflow_public_gallery_read on public.frankiflow_gallery for select to anon, authenticated using (active = true);
create policy frankiflow_public_testimonials_read on public.frankiflow_testimonials for select to anon, authenticated using (published = true);

create policy frankiflow_admin_site_settings_all on public.frankiflow_site_settings for all to authenticated using (private.frankiflow_is_admin()) with check (private.frankiflow_is_admin());
create policy frankiflow_admin_gallery_all on public.frankiflow_gallery for all to authenticated using (private.frankiflow_is_admin()) with check (private.frankiflow_is_admin());
create policy frankiflow_admin_testimonials_all on public.frankiflow_testimonials for all to authenticated using (private.frankiflow_is_admin()) with check (private.frankiflow_is_admin());
create policy frankiflow_admin_quotes_all on public.frankiflow_quote_requests for all to authenticated using (private.frankiflow_is_admin()) with check (private.frankiflow_is_admin());
create policy frankiflow_admin_payments_all on public.frankiflow_payments for all to authenticated using (private.frankiflow_is_admin()) with check (private.frankiflow_is_admin());

create policy frankiflow_public_quote_insert on public.frankiflow_quote_requests for insert to anon, authenticated with check (status='new' and privacy_accepted=true);

-- Let the authenticated FrankiFlow admin read their own admin record and manage pricing.
create policy frankiflow_admin_users_self_read on public.pricing_admin_users for select to authenticated using (user_id=(select auth.uid()) and active=true);
create policy frankiflow_admin_pricing_config_all on public.pricing_config for all to authenticated using (private.frankiflow_is_admin()) with check (private.frankiflow_is_admin());

grant select on public.frankiflow_site_settings, public.frankiflow_gallery, public.frankiflow_testimonials to anon, authenticated;
grant insert on public.frankiflow_quote_requests to anon, authenticated;
grant select, insert, update, delete on public.frankiflow_site_settings, public.frankiflow_gallery, public.frankiflow_testimonials, public.frankiflow_quote_requests, public.frankiflow_payments to authenticated;
grant select on public.pricing_admin_users to authenticated;
grant select, insert, update, delete on public.pricing_config to authenticated;

insert into public.frankiflow_site_settings (id) values (1);

-- Public bucket for website photos. Public download; admin-only write policies below.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('frankiflow-media','frankiflow-media',true,8388608,array['image/jpeg','image/png','image/webp','image/avif']::text[]);

create policy frankiflow_admin_media_select on storage.objects for select to authenticated using (bucket_id='frankiflow-media' and private.frankiflow_is_admin());
create policy frankiflow_admin_media_insert on storage.objects for insert to authenticated with check (bucket_id='frankiflow-media' and private.frankiflow_is_admin());
create policy frankiflow_admin_media_update on storage.objects for update to authenticated using (bucket_id='frankiflow-media' and private.frankiflow_is_admin()) with check (bucket_id='frankiflow-media' and private.frankiflow_is_admin());
create policy frankiflow_admin_media_delete on storage.objects for delete to authenticated using (bucket_id='frankiflow-media' and private.frankiflow_is_admin());
