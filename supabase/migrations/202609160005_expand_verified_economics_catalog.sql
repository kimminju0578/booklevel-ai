-- Expand the starter catalog without inventing cover images.
-- Covers stay NULL until an approved provider confirms the exact edition.

insert into public.books(
  title, authors, description, cover_url, language, difficulty_level,
  source_provider, source_id, metadata_quality, metadata_updated_at
)
values
  ('돈의 심리학', '["모건 하우절"]'::jsonb, '돈을 대하는 태도와 선택을 돌아보며 나만의 경제적 판단 기준을 생각해보는 책입니다.', null, 'ko', 2.5, 'editorial', 'psychology-of-money', 'verified', now()),
  ('제로 투 원', '["피터 틸", "블레이크 마스터스"]'::jsonb, '이미 있는 것을 반복하는 대신 새로운 가치를 만드는 방법을 질문하는 책입니다.', null, 'ko', 3.5, 'editorial', 'zero-to-one', 'verified', now()),
  ('경제학 콘서트', '["팀 하포드"]'::jsonb, '일상에서 만나는 선택과 가격을 경제학의 핵심 개념으로 해석해보는 책입니다.', null, 'ko', 2.5, 'editorial', 'undercover-economist', 'verified', now()),
  ('장하준의 경제학 강의', '["장하준"]'::jsonb, '경제학의 주요 관점과 현실의 경제 문제를 균형 있게 살펴보는 입문서입니다.', null, 'ko', 3.0, 'editorial', 'economics-the-users-guide', 'verified', now()),
  ('넛지', '["리처드 H. 탈러", "캐스 R. 선스타인"]'::jsonb, '사람의 판단과 행동에 영향을 주는 선택 설계의 원리를 살펴보는 책입니다.', null, 'ko', 3.0, 'editorial', 'nudge', 'verified', now()),
  ('부의 인문학', '["브라운스톤"]'::jsonb, '경제 원리와 역사적 사례를 연결해 자산과 선택을 바라보는 관점을 제안하는 책입니다.', null, 'ko', 3.5, 'editorial', 'humanities-of-wealth', 'verified', now())
on conflict (source_provider, source_id) do update set
  title = excluded.title,
  authors = excluded.authors,
  description = excluded.description,
  cover_url = null,
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
  and b.source_id in (
    'psychology-of-money', 'zero-to-one', 'undercover-economist',
    'economics-the-users-guide', 'nudge', 'humanities-of-wealth'
  )
on conflict do nothing;

insert into public.book_topics(book_id, topic, importance, verified)
select b.id, topic.topic, topic.importance, true
from public.books b
join (values
  ('undercover-economist', '수요와 공급', 1.0),
  ('undercover-economist', '가격과 시장', 0.9),
  ('economics-the-users-guide', '경제 체제와 정책', 1.0),
  ('economics-the-users-guide', '성장과 불평등', 0.9),
  ('nudge', '행동경제학', 1.0),
  ('nudge', '의사결정과 선택 설계', 0.9),
  ('humanities-of-wealth', '자산과 투자', 1.0),
  ('humanities-of-wealth', '경제적 사고', 0.9)
) as topic(source_id, topic, importance) on topic.source_id = b.source_id
where b.source_provider = 'editorial'
on conflict (book_id, topic) do update set
  importance = excluded.importance,
  verified = true;

-- Remove every starter cover that was not confirmed for the exact title.
update public.books
set cover_url = null, updated_at = now()
where title in (
  '돈의 심리학', '제로 투 원', '경제학 콘서트',
  '장하준의 경제학 강의', '넛지', '부의 인문학'
);
