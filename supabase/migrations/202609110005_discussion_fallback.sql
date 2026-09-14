alter table public.discussions drop constraint discussions_source_check;
alter table public.discussions add constraint discussions_source_check check(source in ('ai','admin','user','fallback'));
