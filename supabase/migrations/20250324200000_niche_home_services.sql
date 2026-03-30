-- Default niche: home services (replaces auto_repair default for new rows)

alter table public.businesses
  alter column niche set default 'home_services';

update public.businesses
set niche = 'home_services'
where niche = 'auto_repair';
