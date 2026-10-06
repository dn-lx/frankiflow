-- Keep the clean public Calculator route aligned with Admin-managed settings
-- and allow public surfaces to receive Admin content changes through Supabase Realtime.

update public.frankiflow_site_settings
set calculator_url = '/calculator/',
    updated_at = now()
where id = 1
  and calculator_url is distinct from '/calculator/';

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'frankiflow_site_settings'
  ) then
    execute 'alter publication supabase_realtime add table public.frankiflow_site_settings';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'frankiflow_checklists'
  ) then
    execute 'alter publication supabase_realtime add table public.frankiflow_checklists';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'frankiflow_gallery'
  ) then
    execute 'alter publication supabase_realtime add table public.frankiflow_gallery';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'frankiflow_copy'
  ) then
    execute 'alter publication supabase_realtime add table public.frankiflow_copy';
  end if;
end
$$;
