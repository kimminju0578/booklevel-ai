-- Verified starter catalog for the live economics recommendation flow.
-- ISBNs are intentionally omitted until they are imported from an approved provider.
insert into public.books(
  title, authors, description, cover_url, language, difficulty_level,
  source_provider, source_id, metadata_quality, metadata_updated_at
)
values
  ('돈의 심리학', '["모건 하우절"]'::jsonb, '돈을 대하는 태도와 선택을 돌아보며 나만의 경제적 판단 기준을 생각해보는 책입니다.', 'https://image.yes24.com/goods/97059791/XL', 'ko', 2.5, 'editorial', 'psychology-of-money', 'verified', now()),
  ('제로 투 원', '["피터 틸", "블레이크 마스터스"]'::jsonb, '이미 있는 것을 반복하는 대신 새로운 가치를 만드는 방법을 질문하는 책입니다.', 'https://image.yes24.com/goods/7426254/XL', 'ko', 3.5, 'editorial', 'zero-to-one', 'verified', now())
on conflict (source_provider, source_id) do update set
  title = excluded.title,
  authors = excluded.authors,
  description = excluded.description,
  cover_url = excluded.cover_url,
  language = excluded.language,
  difficulty_level = excluded.difficulty_level,
  metadata_quality = 'verified',
  metadata_updated_at = now(),
  updated_at = now();

insert into public.book_categories(book_id, category_id)
select b.id, c.id
from public.books b
join public.categories c on c.slug = 'economics'
where b.source_provider = 'editorial'
  and b.source_id in ('psychology-of-money', 'zero-to-one')
on conflict do nothing;

insert into public.book_topics(book_id, topic, importance, verified)
select b.id, topic.topic, topic.importance, true
from public.books b
join (values
  ('psychology-of-money', '기회비용과 의사결정', 1.0),
  ('psychology-of-money', '위험과 불확실성', 0.9),
  ('psychology-of-money', '행동경제학', 0.8),
  ('zero-to-one', '혁신과 생산성', 1.0),
  ('zero-to-one', '시장 구조와 경쟁', 0.9),
  ('zero-to-one', '기업가정신', 0.8)
) as topic(source_id, topic, importance) on topic.source_id = b.source_id
where b.source_provider = 'editorial'
on conflict (book_id, topic) do update set
  importance = excluded.importance,
  verified = true;
