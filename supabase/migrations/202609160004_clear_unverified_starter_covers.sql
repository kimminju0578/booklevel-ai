-- Do not show a cover unless it has been verified against the exact edition.
update public.books
set cover_url = null, updated_at = now()
where source_provider = 'editorial'
  and source_id in ('psychology-of-money', 'zero-to-one');
