alter table public.frankiflow_site_settings
  add column if not exists header_height_px integer not null default 170;

update public.frankiflow_site_settings
set header_height_px = 170
where id = 1;
