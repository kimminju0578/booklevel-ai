insert into public.seasons(name,starts_at,ends_at,status)
select '2026 가을 시즌',date_trunc('day',now()),date_trunc('day',now())+interval '90 days','active'
where not exists(select 1 from public.seasons where status='active');
