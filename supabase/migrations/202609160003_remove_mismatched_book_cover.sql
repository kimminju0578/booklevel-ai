-- Remove a cover that does not match the verified book metadata.
-- The UI intentionally renders a title/author fallback when cover_url is null.
update public.books
set cover_url = null, updated_at = now()
where source_provider = 'editorial'
  and source_id = 'zero-to-one';
