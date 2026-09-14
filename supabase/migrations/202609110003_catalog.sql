create function public.search_books(p_query text,p_page int default 1) returns setof public.books language sql stable security invoker set search_path='' as $$
 select * from public.books where is_active and (lower(title) like '%'||lower(replace(replace(replace(p_query,'\','\\'),'%','\%'),'_','\_'))||'%' or authors::text ilike '%'||replace(replace(replace(p_query,'\','\\'),'%','\%'),'_','\_')||'%' or isbn13=p_query or isbn10=p_query)
 order by lower(title),id limit 20 offset (greatest(1,least(100,p_page))-1)*20
$$;
grant execute on function public.search_books(text,int) to anon,authenticated,service_role;
create function public.import_book(p_book jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare
 b uuid;
 v_provider text := p_book->>'source_provider';
 v_external_id text := p_book->>'source_id';
begin
 if nullif(v_provider,'') is null or nullif(v_external_id,'') is null then raise exception 'INVALID_PROVIDER_ID'; end if;
 perform pg_advisory_xact_lock(hashtextextended(coalesce(p_book->>'isbn13',v_provider||v_external_id),0));
 select book_id into b from public.book_external_ids where provider=v_provider and external_id=v_external_id;
 if b is not null then return b; end if;
 if p_book->>'isbn13' is not null then select id into b from public.books where isbn13=p_book->>'isbn13';
 elsif p_book->>'isbn10' is not null then select id into b from public.books where isbn10=p_book->>'isbn10' limit 1;
 end if;
 if b is null then
  insert into public.books(isbn10,isbn13,title,subtitle,authors,publisher,published_date,description,cover_url,language,page_count,source_provider,source_id,metadata_updated_at)
  values(p_book->>'isbn10',p_book->>'isbn13',p_book->>'title',p_book->>'subtitle',p_book->'authors',p_book->>'publisher',nullif(p_book->>'published_date','')::date,p_book->>'description',p_book->>'cover_url',p_book->>'language',nullif(p_book->>'page_count','')::int,v_provider,v_external_id,now()) returning id into b;
 end if;
 insert into public.book_external_ids values(b,v_provider,v_external_id) on conflict do nothing;
 return b;
end $$;
revoke all on function public.import_book(jsonb) from public,anon,authenticated;
grant execute on function public.import_book(jsonb) to service_role;
