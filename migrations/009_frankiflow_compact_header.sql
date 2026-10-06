-- Correct the oversized legacy header values now that the public shell respects Admin settings.
update public.frankiflow_site_settings
set header_logo_width_px = 90,
    header_height_px = 100,
    updated_at = now()
where id = 1
  and header_logo_width_px = 120
  and header_height_px = 150;
