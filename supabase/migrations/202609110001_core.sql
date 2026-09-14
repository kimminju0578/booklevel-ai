-- All mutations go through authenticated Route Handlers. Never grant clients
-- service_role. This migration is forward-only and contains no real user data.
create extension if not exists pg_trgm with schema extensions;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '독자' check(char_length(display_name) between 1 and 30),
 avatar_url text,
 role text not null default 'user' check(role in ('user','admin')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function public.create_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles(id,display_name) values(new.id,coalesce(nullif(left(new.raw_user_meta_data->>'display_name',30),''),'독자')); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_profile();

create table public.categories(id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null, is_active boolean not null default true);
create table public.user_interests(user_id uuid references public.profiles on delete cascade, category_id uuid references public.categories on delete cascade, priority int not null check(priority between 1 and 3), primary key(user_id,category_id), unique(user_id,priority));
create table public.books(
 id uuid primary key default gen_random_uuid(), isbn10 text, isbn13 text unique,
 title text not null, subtitle text, authors jsonb not null default '[]' check(jsonb_typeof(authors)='array'),
 publisher text, published_date date, description text, cover_url text, language text, page_count int check(page_count>0),
 difficulty_level numeric(2,1) check(difficulty_level between 1 and 5),
 source_provider text, source_id text, metadata_quality text not null default 'provider' check(metadata_quality in ('provider','verified')),
 metadata_updated_at timestamptz, is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(source_provider,source_id)
);
create index books_title on public.books using gin(lower(title) extensions.gin_trgm_ops);
create index books_authors on public.books using gin(authors);
create index books_isbn10 on public.books(isbn10);
create table public.book_categories(book_id uuid references public.books on delete cascade, category_id uuid references public.categories on delete cascade, primary key(book_id,category_id));
create index book_categories_category on public.book_categories(category_id,book_id);
create table public.book_topics(book_id uuid references public.books on delete cascade, topic text not null, importance numeric not null default 1 check(importance>0), verified boolean not null default false, primary key(book_id,topic));
create table public.book_external_ids(book_id uuid not null references public.books on delete cascade, provider text not null, external_id text not null, primary key(provider,external_id));

create table public.assessment_questions(
 id uuid primary key default gen_random_uuid(), category_id uuid not null references public.categories,
 level int not null check(level between 1 and 5), topic text not null, question text not null,
 options jsonb not null check(jsonb_array_length(options)=4), correct_option text not null check(correct_option in ('A','B','C','D')), explanation text not null,
 is_active boolean not null default false, created_at timestamptz not null default now()
);
create index question_sampling on public.assessment_questions(category_id,level) where is_active;
create table public.assessment_attempts(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles on delete cascade,
 category_id uuid not null references public.categories, question_snapshot jsonb not null,
 started_at timestamptz not null default now(), completed_at timestamptz, score numeric, calculated_level numeric(2,1), topic_scores jsonb
);
create index assessment_user on public.assessment_attempts(user_id,started_at desc);
create table public.assessment_answers(attempt_id uuid references public.assessment_attempts on delete cascade, question_id uuid not null, selected_option text not null check(selected_option in ('A','B','C','D')), is_correct boolean not null, primary key(attempt_id,question_id));
create table public.user_category_levels(user_id uuid references public.profiles on delete cascade, category_id uuid references public.categories, level numeric(2,1) not null check(level between 1 and 5), attempt_id uuid references public.assessment_attempts on delete cascade, topic_scores jsonb not null, updated_at timestamptz not null default now(), primary key(user_id,category_id));
create table public.recommendations(id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles on delete cascade, book_id uuid not null references public.books, category_id uuid not null references public.categories, level numeric(2,1) not null, score numeric not null check(score between 0 and 1), ai_reason text not null, reading_focus jsonb not null default '[]', source text not null, rank int not null check(rank between 1 and 5), generated_at timestamptz not null default now(), unique(user_id,book_id,category_id));
create index recommendations_user on public.recommendations(user_id,category_id,rank);
create table public.user_books(user_id uuid references public.profiles on delete cascade, book_id uuid references public.books on delete cascade, status text not null check(status in ('want_to_read','reading','completed','paused')), started_at timestamptz, completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), primary key(user_id,book_id));

create table public.reviews(id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles on delete cascade, book_id uuid not null references public.books on delete cascade, rating int not null check(rating between 1 and 5), short_review text check(char_length(short_review)<=140), content text not null check(char_length(content) between 1 and 5000), perceived_difficulty text, recommended_for text, contains_spoiler boolean not null default false, hidden boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,book_id));
create index reviews_book on public.reviews(book_id,created_at desc);
create table public.review_comments(id uuid primary key default gen_random_uuid(), review_id uuid not null references public.reviews on delete cascade, user_id uuid not null references public.profiles on delete cascade, content text not null check(char_length(content) between 1 and 5000), hidden boolean not null default false, created_at timestamptz not null default now());
create index review_comments_parent on public.review_comments(review_id,created_at);
create table public.discussions(id uuid primary key default gen_random_uuid(), book_id uuid not null references public.books on delete cascade, title text not null check(char_length(title) between 1 and 160), question text not null check(char_length(question) between 1 and 5000), source text not null check(source in ('ai','admin','user')), created_by uuid references public.profiles on delete set null, hidden boolean not null default false, created_at timestamptz not null default now());
create index discussions_book on public.discussions(book_id,created_at desc);
create table public.discussion_posts(id uuid primary key default gen_random_uuid(), discussion_id uuid not null references public.discussions on delete cascade, user_id uuid not null references public.profiles on delete cascade, stance text not null check(stance in ('agree','disagree','neutral')), content text not null check(char_length(content) between 1 and 5000), parent_id uuid references public.discussion_posts on delete cascade, hidden boolean not null default false, created_at timestamptz not null default now());
create index discussion_posts_parent on public.discussion_posts(discussion_id,parent_id,created_at);
create function public.check_reply_depth() returns trigger language plpgsql set search_path='' as $$
declare p public.discussion_posts;
begin if new.parent_id is not null then select * into p from public.discussion_posts where id=new.parent_id;
 if p.id is null or p.discussion_id<>new.discussion_id or p.parent_id is not null then raise exception 'INVALID_REPLY_PARENT'; end if;
end if; return new; end $$;
create trigger validate_reply before insert or update on public.discussion_posts for each row execute function public.check_reply_depth();
create table public.likes(user_id uuid references public.profiles on delete cascade, target_type text check(target_type in ('review','discussion_post','essay')), target_id uuid not null, created_at timestamptz not null default now(), primary key(user_id,target_type,target_id));
create table public.reports(id uuid primary key default gen_random_uuid(), reporter_id uuid not null references public.profiles on delete cascade, target_type text not null check(target_type in ('review','review_comment','discussion','discussion_post','essay')), target_id uuid not null, reason text not null, details text check(char_length(details)<=2000), status text not null default 'pending' check(status in ('pending','dismissed','hidden','deleted')), created_at timestamptz not null default now(), unique(reporter_id,target_type,target_id));
create index reports_status on public.reports(status,created_at);
create table public.user_blocks(user_id uuid references public.profiles on delete cascade, blocked_id uuid references public.profiles on delete cascade, primary key(user_id,blocked_id), check(user_id<>blocked_id));
create table public.moderation_logs(id uuid primary key default gen_random_uuid(), admin_id uuid references public.profiles on delete set null, report_id uuid references public.reports on delete set null, action text not null, created_at timestamptz not null default now());

create table public.essay_questions(id uuid primary key default gen_random_uuid(), book_id uuid references public.books on delete cascade, category_id uuid references public.categories, question text not null check(char_length(question) between 1 and 2000), difficulty int not null check(difficulty between 1 and 5), source text not null check(source in ('ai','admin')), practice_type text not null, target_skill text, created_by uuid references public.profiles on delete set null, is_active boolean not null default true, created_at timestamptz not null default now());
create table public.essay_attempts(id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles on delete cascade, essay_question_id uuid not null references public.essay_questions, book_id uuid references public.books, category_id uuid references public.categories, practice_type text not null check(practice_type in ('book_based','topic_based','weakness_training','random','timed_exam')), target_skill text, difficulty int not null check(difficulty between 1 and 5), mode text not null check(mode in ('practice','timed')), time_limit_seconds int, started_at timestamptz not null default now(), submitted_at timestamptz, elapsed_seconds int, overtime_seconds int not null default 0, character_count int, created_at timestamptz not null default now(), check((mode='practice' and time_limit_seconds is null) or (mode='timed' and time_limit_seconds in (600,1200,1800))));
create index essay_attempts_user on public.essay_attempts(user_id,created_at desc);
create table public.essays(id uuid primary key default gen_random_uuid(), attempt_id uuid not null unique references public.essay_attempts on delete cascade, user_id uuid not null references public.profiles on delete cascade, content text not null default '' check(char_length(content)<=10000), version int not null default 1 check(version>0), revision int not null default 0, previous_essay_id uuid references public.essays on delete set null, is_public boolean not null default false, show_score_publicly boolean not null default false, hidden boolean not null default false, evaluation_state text not null default 'pending' check(evaluation_state in ('pending','running','failed','complete')), evaluation_started_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(not show_score_publicly or is_public));
create index essays_user on public.essays(user_id,created_at desc);
create table public.essay_evaluations(id uuid primary key default gen_random_uuid(), essay_id uuid not null unique references public.essays on delete cascade, understanding_score int not null check(understanding_score between 0 and 15), thesis_score int not null check(thesis_score between 0 and 15), reasoning_score int not null check(reasoning_score between 0 and 20), evidence_score int not null check(evidence_score between 0 and 15), counterargument_score int not null check(counterargument_score between 0 and 15), structure_score int not null check(structure_score between 0 and 10), expression_score int not null check(expression_score between 0 and 10), total_score int not null, strengths jsonb not null, weaknesses jsonb not null, rewrite_goal text not null, guiding_question text not null, time_feedback text not null, model text not null, prompt_version text not null, created_at timestamptz not null default now(), check(total_score=understanding_score+thesis_score+reasoning_score+evidence_score+counterargument_score+structure_score+expression_score));

create table public.ai_usage_logs(id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles on delete set null, feature text not null, model text, input_tokens int, output_tokens int, latency_ms int, success boolean not null, created_at timestamptz not null default now());
create table public.event_logs(id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles on delete set null, event_name text not null, metadata jsonb not null default '{}', created_at timestamptz not null default now());
create index events_name_time on public.event_logs(event_name,created_at);
create table public.rate_limits(key text primary key, count int not null, expires_at timestamptz not null);
create table public.ai_cache(key text primary key, user_id uuid references public.profiles on delete cascade, value jsonb not null, created_at timestamptz not null default now(), expires_at timestamptz not null);
