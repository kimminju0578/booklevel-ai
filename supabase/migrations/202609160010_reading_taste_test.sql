-- Reading Taste Test has a separate data model from BookLevel assessment.
create table public.taste_test_questions (
  id uuid primary key,
  version int not null check (version > 0),
  prompt text not null check (char_length(prompt) between 1 and 500),
  dimension text not null check (dimension in ('pace','ambiguity','realism','emotionality','intellectual_depth','practical_vs_conceptual','breadth_vs_depth','plot_vs_character')),
  direction smallint not null check (direction in (-1,1)),
  weight numeric not null check (weight > 0),
  left_label text not null,
  right_label text not null,
  display_order int not null,
  active boolean not null default true,
  unique(version, display_order)
);
create table public.reader_archetypes (
  key text primary key,
  name text not null,
  short_description text not null,
  long_description text not null,
  keywords jsonb not null check (jsonb_typeof(keywords) = 'array'),
  recommended_reading_style text not null,
  centroid jsonb not null,
  dimension_weights jsonb not null,
  priority int not null,
  active boolean not null default true
);
create table public.taste_test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  question_version int not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz not null default now()
);
create table public.taste_test_answers (
  attempt_id uuid not null references public.taste_test_attempts on delete cascade,
  question_id uuid not null references public.taste_test_questions,
  value int not null check (value between 1 and 5),
  primary key(attempt_id, question_id)
);
create table public.user_taste_profiles (
  user_id uuid primary key references public.profiles on delete cascade,
  source_attempt_id uuid not null references public.taste_test_attempts,
  archetype_key text not null references public.reader_archetypes,
  dimensions jsonb not null check (jsonb_typeof(dimensions) = 'object' and dimensions ?& array['pace','ambiguity','realism','emotionality','intellectual_depth','practical_vs_conceptual','breadth_vs_depth','plot_vs_character']),
  calculated_at timestamptz not null default now()
);
create table public.book_taste_profiles (
  book_id uuid primary key references public.books on delete cascade,
  dimensions jsonb not null check (jsonb_typeof(dimensions) = 'object' and dimensions ?& array['pace','ambiguity','realism','emotionality','intellectual_depth','practical_vs_conceptual','breadth_vs_depth','plot_vs_character']),
  source text not null,
  confidence numeric not null check (confidence between 0 and 1),
  review_status text not null check (review_status in ('generated','verified','rejected')),
  model_version text,
  updated_at timestamptz not null default now()
);
create index taste_attempts_user on public.taste_test_attempts(user_id, completed_at desc);

alter table public.recommendations add column if not exists base_score numeric;
alter table public.recommendations add column if not exists taste_match numeric check (taste_match is null or taste_match between 0 and 1);

alter table public.taste_test_questions enable row level security;
alter table public.reader_archetypes enable row level security;
alter table public.book_taste_profiles enable row level security;
alter table public.taste_test_attempts enable row level security;
alter table public.taste_test_answers enable row level security;
alter table public.user_taste_profiles enable row level security;
create policy taste_questions_public_read on public.taste_test_questions for select using (active);
create policy reader_archetypes_public_read on public.reader_archetypes for select using (active);
create policy book_taste_profiles_public_read on public.book_taste_profiles for select using (review_status = 'verified');
create policy taste_attempts_owner_read on public.taste_test_attempts for select using (auth.uid() = user_id);
create policy taste_answers_owner_read on public.taste_test_answers for select using (exists (select 1 from public.taste_test_attempts a where a.id = attempt_id and a.user_id = auth.uid()));
create policy user_taste_profiles_owner_read on public.user_taste_profiles for select using (auth.uid() = user_id);
grant select on public.taste_test_questions, public.reader_archetypes, public.book_taste_profiles to anon, authenticated;
grant select on public.taste_test_attempts, public.taste_test_answers, public.user_taste_profiles to authenticated;

insert into public.taste_test_questions(id,version,prompt,dimension,direction,weight,left_label,right_label,display_order,active) values
('70000000-0000-4000-8000-000000000001',1,'빠르게 사건이 전개되는 책이 좋다','pace',1,1,'빠른 전개','느리고 깊은 전개',1,true),
('70000000-0000-4000-8000-000000000002',1,'읽은 뒤 여러 해석이 가능한 책이 좋다','ambiguity',1,1,'명확한 결론','열린 해석',2,true),
('70000000-0000-4000-8000-000000000003',1,'현실과 밀접한 이야기가 좋다','realism',1,1,'상상·가상 세계','현실 기반',3,true),
('70000000-0000-4000-8000-000000000004',1,'감정적으로 깊게 몰입되는 책이 좋다','emotionality',1,1,'분석적 독서','감정 몰입',4,true),
('70000000-0000-4000-8000-000000000005',1,'조금 어렵더라도 오래 생각하게 하는 책이 좋다','intellectual_depth',1,1.2,'편안한 독서','깊은 사고',5,true),
('70000000-0000-4000-8000-000000000006',1,'새로운 개념이나 관점을 발견하는 것을 좋아한다','practical_vs_conceptual',1,1,'실용적 정보','개념적 관점',6,true),
('70000000-0000-4000-8000-000000000007',1,'하나의 주제를 깊게 파고드는 책이 좋다','breadth_vs_depth',1,1,'여러 분야 연결','한 분야 심화',7,true),
('70000000-0000-4000-8000-000000000008',1,'인물의 내면을 깊게 따라가는 이야기가 좋다','plot_vs_character',1,1,'사건 중심','인물·심리 중심',8,true),
('70000000-0000-4000-8000-000000000009',1,'빠르게 다음 장면으로 넘어가는 책이 좋다','pace',-1,1,'느린 전개','빠른 전개',9,true),
('70000000-0000-4000-8000-000000000010',1,'작가가 모든 의미를 설명하지 않는 책이 좋다','ambiguity',1,1,'친절한 설명','독자의 해석',10,true),
('70000000-0000-4000-8000-000000000011',1,'실제 삶의 문제를 다루는 책에 더 끌린다','realism',1,1,'낯선 세계','현실의 문제',11,true),
('70000000-0000-4000-8000-000000000012',1,'읽고 난 뒤 다른 생각으로 이어지는 책을 좋아한다','intellectual_depth',1,1.2,'가벼운 읽기','생각이 이어지는 읽기',12,true)
on conflict (id) do update set prompt=excluded.prompt,dimension=excluded.dimension,direction=excluded.direction,weight=excluded.weight,left_label=excluded.left_label,right_label=excluded.right_label,display_order=excluded.display_order,active=excluded.active;

insert into public.reader_archetypes(key,name,short_description,long_description,keywords,recommended_reading_style,centroid,dimension_weights,priority) values
('reflective_explorer','사유하는 탐험가','복잡한 질문을 오래 생각하고 읽은 뒤에도 생각이 이어지는 독자입니다.','새로운 관점을 탐험하면서도 한 번 만난 질문을 쉽게 놓지 않습니다.','["사유적","열린 해석","관점 탐험"]','여백을 두고 질문을 메모하며 읽어보세요.','{"pace":70,"ambiguity":78,"realism":45,"emotionality":52,"intellectual_depth":82,"practical_vs_conceptual":76,"breadth_vs_depth":48,"plot_vs_character":58}','{"pace":1,"ambiguity":1,"realism":1,"emotionality":1,"intellectual_depth":1,"practical_vs_conceptual":1,"breadth_vs_depth":1,"plot_vs_character":1}',1),
('knowledge_seeker','지식 탐구자','새로운 사실과 개념을 연결하며 배우는 즐거움을 아는 독자입니다.','한 권에서 얻은 지식을 다른 분야와 연결해 더 넓은 이해를 만듭니다.','["호기심","개념 중심","폭넓은 연결"]','핵심 개념과 관련 분야를 함께 찾아보세요.','{"pace":48,"ambiguity":45,"realism":55,"emotionality":35,"intellectual_depth":72,"practical_vs_conceptual":68,"breadth_vs_depth":22,"plot_vs_character":32}','{"pace":1,"ambiguity":1,"realism":1,"emotionality":1,"intellectual_depth":1,"practical_vs_conceptual":1,"breadth_vs_depth":1,"plot_vs_character":1}',2),
('realist_analyst','현실주의 분석가','현실의 문제를 차분하게 분석하고 쓸모 있는 통찰을 찾는 독자입니다.','구체적인 사례와 근거를 통해 세상을 더 정확하게 이해하려 합니다.','["현실 기반","분석적","실용적"]','사례와 근거를 중심으로 읽고 적용점을 적어보세요.','{"pace":48,"ambiguity":28,"realism":88,"emotionality":28,"intellectual_depth":62,"practical_vs_conceptual":25,"breadth_vs_depth":54,"plot_vs_character":28}','{"pace":1,"ambiguity":1,"realism":1,"emotionality":1,"intellectual_depth":1,"practical_vs_conceptual":1,"breadth_vs_depth":1,"plot_vs_character":1}',3),
('emotional_immersive','감정 몰입형 독자','인물의 감정과 관계를 따라가며 책 속 세계를 깊이 경험하는 독자입니다.','이야기의 정서와 인물의 마음을 자신의 경험과 연결해 읽습니다.','["감정 몰입","인물 중심","공감"]','마음에 남은 장면과 감정을 천천히 기록해보세요.','{"pace":48,"ambiguity":58,"realism":52,"emotionality":90,"intellectual_depth":48,"practical_vs_conceptual":42,"breadth_vs_depth":52,"plot_vs_character":88}','{"pace":1,"ambiguity":1,"realism":1,"emotionality":1,"intellectual_depth":1,"practical_vs_conceptual":1,"breadth_vs_depth":1,"plot_vs_character":1}',4),
('story_collector','이야기 수집가','끊임없이 펼쳐지는 사건과 생생한 세계를 사랑하는 독자입니다.','새로운 이야기의 흐름에 몸을 맡기고 다음 장면을 기대하며 읽습니다.','["빠른 전개","상상력","사건 중심"]','인상적인 장면과 이야기의 전환점을 표시해보세요.','{"pace":18,"ambiguity":38,"realism":38,"emotionality":62,"intellectual_depth":35,"practical_vs_conceptual":32,"breadth_vs_depth":42,"plot_vs_character":12}','{"pace":1,"ambiguity":1,"realism":1,"emotionality":1,"intellectual_depth":1,"practical_vs_conceptual":1,"breadth_vs_depth":1,"plot_vs_character":1}',5),
('intellectual_adventurer','지적 모험가','익숙한 답보다 낯선 질문과 어려운 생각에 끌리는 독자입니다.','조금 불편하고 낯선 관점도 끝까지 따라가며 사고의 경계를 넓힙니다.','["도전적","낯선 관점","깊은 사고"]','이해되지 않는 대목을 질문으로 바꾸어 읽어보세요.','{"pace":58,"ambiguity":72,"realism":42,"emotionality":42,"intellectual_depth":92,"practical_vs_conceptual":88,"breadth_vs_depth":64,"plot_vs_character":48}','{"pace":1,"ambiguity":1,"realism":1,"emotionality":1,"intellectual_depth":1,"practical_vs_conceptual":1,"breadth_vs_depth":1,"plot_vs_character":1}',6),
('deep_reader','깊이 읽는 연구자','한 주제를 오래 파고들며 맥락과 구조를 꼼꼼히 살피는 독자입니다.','빠른 결론보다 충분한 근거와 맥락을 통해 자신의 이해를 단단하게 만듭니다.','["집중","맥락","정밀한 독해"]','한 주제를 여러 자료와 비교하며 읽어보세요.','{"pace":86,"ambiguity":62,"realism":62,"emotionality":32,"intellectual_depth":88,"practical_vs_conceptual":72,"breadth_vs_depth":92,"plot_vs_character":42}','{"pace":1,"ambiguity":1,"realism":1,"emotionality":1,"intellectual_depth":1,"practical_vs_conceptual":1,"breadth_vs_depth":1,"plot_vs_character":1}',7),
('perspective_connector','관점 확장형 독자','서로 다른 사람과 분야의 시선을 이어 새로운 그림을 만드는 독자입니다.','한 가지 답에 머물기보다 여러 관점을 연결해 더 입체적으로 이해합니다.','["연결","다중 관점","유연한 사고"]','책의 주장과 다른 관점을 함께 비교해보세요.','{"pace":52,"ambiguity":68,"realism":58,"emotionality":58,"intellectual_depth":68,"practical_vs_conceptual":62,"breadth_vs_depth":12,"plot_vs_character":62}','{"pace":1,"ambiguity":1,"realism":1,"emotionality":1,"intellectual_depth":1,"practical_vs_conceptual":1,"breadth_vs_depth":1,"plot_vs_character":1}',8)
on conflict(key) do update set name=excluded.name,short_description=excluded.short_description,long_description=excluded.long_description,keywords=excluded.keywords,recommended_reading_style=excluded.recommended_reading_style,centroid=excluded.centroid,dimension_weights=excluded.dimension_weights,priority=excluded.priority,active=true;

create or replace function public.complete_taste_test(p_user uuid,p_question_version int,p_answers jsonb,p_archetype_key text) returns uuid language plpgsql security definer set search_path='' as $$
declare
  v_attempt uuid := gen_random_uuid();
  v_expected int;
  v_dimensions jsonb;
begin
  if p_user is null or p_question_version < 1 or jsonb_typeof(p_answers) <> 'object' or not exists (select 1 from public.reader_archetypes where key=p_archetype_key and active) then raise exception 'INVALID_TASTE_PAYLOAD'; end if;
  select count(*) into v_expected from public.taste_test_questions where version=p_question_version and active;
  if (select count(*) from jsonb_each(p_answers)) <> v_expected or exists (
    select 1 from jsonb_each(p_answers) answer where not exists (select 1 from public.taste_test_questions q where q.id=answer.key::uuid and q.version=p_question_version and q.active)
  ) then raise exception 'INVALID_TASTE_ANSWERS'; end if;
  if exists (select 1 from jsonb_each_text(p_answers) a where a.value !~ '^[1-5]$') then raise exception 'INVALID_TASTE_VALUE'; end if;
  insert into public.taste_test_attempts(id,user_id,question_version) values(v_attempt,p_user,p_question_version);
  insert into public.taste_test_answers(attempt_id,question_id,value) select v_attempt,answer.key::uuid,answer.value::int from jsonb_each_text(p_answers) answer;
  select jsonb_object_agg(scores.dimension,scores.value) into v_dimensions
  from (
    select d.dimension, round(((sum((((a.value::int)-3)::numeric/2)*d.direction*d.weight)/sum(d.weight))/2+0.5)*100) as value
    from jsonb_each_text(p_answers) a
    join public.taste_test_questions d on d.id=a.key::uuid and d.version=p_question_version and d.active
    group by d.dimension
  ) scores;
  -- The API calculates the archetype from the same versioned config and writes it below.
  insert into public.user_taste_profiles(user_id,source_attempt_id,archetype_key,dimensions)
  values(p_user,v_attempt,p_archetype_key,v_dimensions)
  on conflict (user_id) do update set source_attempt_id=excluded.source_attempt_id,archetype_key=excluded.archetype_key,dimensions=excluded.dimensions,calculated_at=now();
  return v_attempt;
end $$;
revoke all on function public.complete_taste_test(uuid,int,jsonb,text) from public, anon, authenticated;
grant execute on function public.complete_taste_test(uuid,int,jsonb,text) to service_role;
