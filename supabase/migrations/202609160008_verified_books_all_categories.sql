-- Add a small verified starter catalog for every seeded assessment category.
-- Recommendations require verified books linked to the assessed category.
with catalog(slug, title, authors, description, difficulty_level, source_id) as (
  values
    ('philosophy', '소크라테스의 변명', '["플라톤"]'::jsonb, '질문과 성찰을 통해 자신의 삶을 돌아보게 하는 철학의 고전입니다.', 2.5, 'apology-of-socrates'),
    ('philosophy', '정의란 무엇인가', '["마이클 샌델"]'::jsonb, '정의와 공동체의 문제를 여러 관점에서 토론하게 하는 입문서입니다.', 3.0, 'justice-philosophy'),
    ('philosophy', '철학의 위안', '["알랭 드 보통"]'::jsonb, '철학적 사유가 일상적인 불안과 선택을 어떻게 바라보는지 살펴봅니다.', 3.0, 'consolations-of-philosophy'),
    ('psychology', '생각에 관한 생각', '["대니얼 카너먼"]'::jsonb, '판단과 의사결정에서 작동하는 사고의 특징을 설명합니다.', 3.5, 'thinking-fast-and-slow'),
    ('psychology', '몰입', '["미하이 칙센트미하이"]'::jsonb, '주의와 동기의 관점에서 깊이 있는 활동 경험을 탐구합니다.', 3.0, 'flow-psychology'),
    ('psychology', '아내를 모자로 착각한 남자', '["올리버 색스"]'::jsonb, '신경심리 사례를 통해 지각과 자아의 관계를 생각하게 합니다.', 3.5, 'man-who-mistook-wife'),
    ('society', '총, 균, 쇠', '["재레드 다이아몬드"]'::jsonb, '문명과 사회의 차이를 환경·제도·역사의 상호작용으로 설명합니다.', 4.0, 'guns-germs-steel'),
    ('society', '사피엔스', '["유발 하라리"]'::jsonb, '인류 사회의 형성과 변화를 큰 흐름으로 조망합니다.', 3.5, 'sapiens-society'),
    ('society', '나 홀로 볼링', '["로버트 퍼트넘"]'::jsonb, '공동체 참여와 사회적 신뢰의 변화를 사회 자본의 관점에서 다룹니다.', 4.0, 'bowling-alone'),
    ('history', '역사란 무엇인가', '["에드워드 카"]'::jsonb, '사실과 해석의 관계를 통해 역사 연구의 기본 관점을 소개합니다.', 3.0, 'what-is-history'),
    ('history', '지중해', '["페르낭 브로델"]'::jsonb, '장기적인 환경과 경제, 사회의 흐름으로 역사를 바라봅니다.', 4.5, 'mediterranean-history'),
    ('history', '한국사 편지', '["박은봉"]'::jsonb, '한국사의 주요 흐름을 사건과 사람의 이야기로 이해하도록 돕습니다.', 2.5, 'letters-korean-history'),
    ('literature', '문학이란 무엇인가', '["테리 이글턴"]'::jsonb, '문학의 형식과 가치, 사회적 맥락을 비판적으로 살펴봅니다.', 3.5, 'literary-theory-intro'),
    ('literature', '위대한 개츠비', '["F. 스콧 피츠제럴드"]'::jsonb, '서술과 상징, 욕망의 문제를 읽어볼 수 있는 소설입니다.', 3.0, 'great-gatsby'),
    ('literature', '오만과 편견', '["제인 오스틴"]'::jsonb, '인물과 사회 규범, 아이러니한 서술을 함께 살펴보는 고전입니다.', 3.0, 'pride-and-prejudice'),
    ('science', '코스모스', '["칼 세이건"]'::jsonb, '우주와 과학의 발전을 증거와 탐구의 관점에서 설명합니다.', 3.0, 'cosmos-science'),
    ('science', '이기적 유전자', '["리처드 도킨스"]'::jsonb, '진화와 생명 현상을 유전자 중심의 관점에서 논의합니다.', 4.0, 'selfish-gene'),
    ('science', '침묵의 봄', '["레이철 카슨"]'::jsonb, '과학적 근거와 환경 문제, 사회적 책임의 관계를 보여줍니다.', 3.5, 'silent-spring'),
    ('ai-tech', '클린 코드', '["로버트 C. 마틴"]'::jsonb, '소프트웨어를 읽기 쉽고 유지보수 가능하게 만드는 원칙을 다룹니다.', 3.5, 'clean-code'),
    ('ai-tech', 'AI 2041', '["카이푸 리", "천치우판"]'::jsonb, '인공지능 기술이 사회와 일상에 미칠 가능성을 여러 이야기로 탐색합니다.', 3.0, 'ai-2041'),
    ('ai-tech', '인공지능 시대의 인간', '["헨리 키신저", "에릭 슈밋", "대니얼 허텐로커"]'::jsonb, 'AI의 발전이 지식과 의사결정, 사회 제도에 던지는 질문을 다룹니다.', 4.0, 'age-of-ai')
)
insert into public.books(
  title, authors, description, language, difficulty_level,
  source_provider, source_id, metadata_quality, metadata_updated_at
)
select title, authors, description, 'ko', difficulty_level,
  'editorial', source_id, 'verified', now()
from catalog
on conflict (source_provider, source_id) do update set
  title = excluded.title,
  authors = excluded.authors,
  description = excluded.description,
  language = excluded.language,
  difficulty_level = excluded.difficulty_level,
  metadata_quality = 'verified',
  metadata_updated_at = now();

with links(source_id, slug) as (
  values
    ('apology-of-socrates', 'philosophy'), ('justice-philosophy', 'philosophy'), ('consolations-of-philosophy', 'philosophy'),
    ('flow-psychology', 'psychology'), ('man-who-mistook-wife', 'psychology'),
    ('guns-germs-steel', 'society'), ('sapiens-society', 'society'), ('bowling-alone', 'society'),
    ('what-is-history', 'history'), ('mediterranean-history', 'history'), ('letters-korean-history', 'history'),
    ('literary-theory-intro', 'literature'), ('great-gatsby', 'literature'), ('pride-and-prejudice', 'literature'),
    ('cosmos-science', 'science'), ('selfish-gene', 'science'), ('silent-spring', 'science'),
    ('clean-code', 'ai-tech'), ('ai-2041', 'ai-tech'), ('age-of-ai', 'ai-tech')
)
insert into public.book_categories(book_id, category_id)
select b.id, c.id
from links
join public.books b on b.source_provider = 'editorial' and b.source_id = links.source_id
join public.categories c on c.slug = links.slug
on conflict do nothing;

with topics(source_id, topic) as (
  values
    ('apology-of-socrates', '철학적 질문'), ('apology-of-socrates', '논증'),
    ('justice-philosophy', '정의'), ('justice-philosophy', '윤리'),
    ('consolations-of-philosophy', '윤리적 딜레마'), ('consolations-of-philosophy', '정당화'),
    ('flow-psychology', '동기'), ('flow-psychology', '정서'),
    ('man-who-mistook-wife', '인지'), ('man-who-mistook-wife', '지각'),
    ('guns-germs-steel', '사회 구조'), ('guns-germs-steel', '불평등'),
    ('sapiens-society', '사회 변화'), ('sapiens-society', '사회화'),
    ('bowling-alone', '사회 자본'), ('bowling-alone', '공동체'),
    ('what-is-history', '사료'), ('what-is-history', '기억과 서술'),
    ('mediterranean-history', '역사적 인과'), ('mediterranean-history', '비교사'),
    ('letters-korean-history', '연대'), ('letters-korean-history', '산업화'),
    ('literary-theory-intro', '문학과 사회'), ('literary-theory-intro', '해석'),
    ('great-gatsby', '서술의 신뢰성'), ('great-gatsby', '상징'),
    ('pride-and-prejudice', '장르'), ('pride-and-prejudice', '인물'),
    ('cosmos-science', '관찰과 가설'), ('cosmos-science', '과학적 모델'),
    ('selfish-gene', '생명과학'), ('selfish-gene', '인과 추론'),
    ('silent-spring', '불확실성'), ('silent-spring', '과학과 사회'),
    ('clean-code', '알고리즘'), ('clean-code', '소프트웨어'),
    ('ai-2041', '머신러닝'), ('ai-2041', '기술과 사회'),
    ('age-of-ai', 'AI 편향'), ('age-of-ai', '보안')
)
insert into public.book_topics(book_id, topic, importance, verified)
select b.id, topics.topic, 1, true
from topics
join public.books b on b.source_provider = 'editorial' and b.source_id = topics.source_id
on conflict (book_id, topic) do update set
  importance = excluded.importance,
  verified = true;
