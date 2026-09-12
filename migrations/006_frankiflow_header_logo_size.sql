alter table public.frankiflow_site_settings
  add column if not exists header_logo_width_px integer not null default 260;

update public.frankiflow_site_settings
set header_logo_width_px = 260
where id = 1;
