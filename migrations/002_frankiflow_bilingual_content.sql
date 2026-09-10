-- FrankiFlow bilingual website content fields (German remains the existing/default content).
alter table public.frankiflow_site_settings
  add column if not exists hero_eyebrow_en text not null default 'More than cleaning.',
  add column if not exists hero_title_en text not null default 'Cleaning services that simply work.',
  add column if not exists hero_subtitle_en text not null default 'Professional cleaning and property care for offices, homes, stairwells and holiday rentals in Frankfurt am Main and surrounding areas.',
  add column if not exists offer_title_en text not null default '25% new-customer discount in the first month',
  add column if not exists offer_text_en text not null default 'A free trial cleaning can also be arranged.',
  add column if not exists service_area_en text not null default 'Frankfurt am Main & surrounding areas',
  add column if not exists primary_cta_label_en text not null default 'Calculate price now',
  add column if not exists secondary_cta_label_en text not null default 'Request a quote';

update public.frankiflow_site_settings
set hero_eyebrow_en = coalesce(nullif(hero_eyebrow_en,''),'More than cleaning.'),
    hero_title_en = coalesce(nullif(hero_title_en,''),'Cleaning services that simply work.'),
    hero_subtitle_en = coalesce(nullif(hero_subtitle_en,''),'Professional cleaning and property care for offices, homes, stairwells and holiday rentals in Frankfurt am Main and surrounding areas.'),
    offer_title_en = coalesce(nullif(offer_title_en,''),'25% new-customer discount in the first month'),
    offer_text_en = coalesce(nullif(offer_text_en,''),'A free trial cleaning can also be arranged.'),
    service_area_en = coalesce(nullif(service_area_en,''),'Frankfurt am Main & surrounding areas'),
    primary_cta_label_en = coalesce(nullif(primary_cta_label_en,''),'Calculate price now'),
    secondary_cta_label_en = coalesce(nullif(secondary_cta_label_en,''),'Request a quote')
where id=1;
