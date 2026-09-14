-- Explicit read policies; all writes run through authorized server endpoints.
do $$ declare t record; begin for t in select tablename from pg_tables where schemaname='public' loop execute format('alter table public.%I enable row level security',t.tablename); end loop; end $$;
revoke all on all tables in schema public from anon, authenticated;
grant all on all tables in schema public to service_role;
grant usage on schema public to anon, authenticated, service_role;

create function public.is_blocked(actor uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.user_blocks where user_id=auth.uid() and blocked_id=actor)
$$;
create policy profiles_read on public.profiles for select using(true);
grant select(id,display_name,avatar_url,created_at) on public.profiles to anon,authenticated;
create policy categories_read on public.categories for select using(is_active);
create policy books_read on public.books for select using(is_active);
create policy book_categories_read on public.book_categories for select using(exists(select 1 from public.books where id=book_id and is_active));
create policy book_topics_read on public.book_topics for select using(verified and exists(select 1 from public.books where id=book_id and is_active));
grant select on public.categories,public.books,public.book_categories,public.book_topics to anon,authenticated;

create policy interests_own on public.user_interests for select using(user_id=auth.uid());
create policy attempts_own on public.assessment_attempts for select using(user_id=auth.uid());
-- No snapshot/correct answer access from the client, even after completion.
grant select(id,user_id,category_id,started_at,completed_at,score,calculated_level,topic_scores) on public.assessment_attempts to authenticated;
create policy levels_own on public.user_category_levels for select using(user_id=auth.uid());
create policy recommendations_own on public.recommendations for select using(user_id=auth.uid());
create policy library_own on public.user_books for select using(user_id=auth.uid());
create policy blocks_own on public.user_blocks for select using(user_id=auth.uid());
create policy reports_own on public.reports for select using(reporter_id=auth.uid());
grant select on public.user_interests,public.user_category_levels,public.recommendations,public.user_books,public.user_blocks,public.reports to authenticated;
create policy reviews_visible on public.reviews for select using(not hidden and not public.is_blocked(user_id));
create policy review_comments_visible on public.review_comments for select using(not hidden and not public.is_blocked(user_id) and exists(select 1 from public.reviews r where r.id=review_id));
create policy discussions_visible on public.discussions for select using(not hidden and not public.is_blocked(created_by));
create policy discussion_posts_visible on public.discussion_posts for select using(not hidden and not public.is_blocked(user_id) and exists(select 1 from public.discussions d where d.id=discussion_id));
grant select on public.reviews,public.review_comments,public.discussions,public.discussion_posts to anon,authenticated;
create policy likes_read on public.likes for select using(user_id=auth.uid());
grant select on public.likes to authenticated;
create policy essay_questions_read on public.essay_questions for select using(is_active and (created_by=auth.uid() or source='admin'));
create policy essay_attempts_own on public.essay_attempts for select using(user_id=auth.uid());
create policy essays_visible on public.essays for select using(user_id=auth.uid() or (is_public and not hidden and not public.is_blocked(user_id) and exists(select 1 from public.essay_attempts a where a.id=attempt_id and a.submitted_at is not null)));
-- Public essays are served by a restricted projection endpoint; owner-only direct
-- access avoids revealing attempt timestamps or private feedback via joins.
drop policy essays_visible on public.essays;
create policy essays_own on public.essays for select using(user_id=auth.uid());
create policy evaluations_own on public.essay_evaluations for select using(exists(select 1 from public.essays e where e.id=essay_id and e.user_id=auth.uid()));
grant select on public.essay_questions,public.essay_attempts,public.essays,public.essay_evaluations to authenticated;

create function public.consume_rate(p_key text,p_limit int,p_window int) returns boolean language plpgsql security definer set search_path='' as $$
declare v_count int;
begin
 insert into public.rate_limits(key,count,expires_at) values(p_key,1,now()+make_interval(secs=>p_window))
 on conflict(key) do update set count=case when public.rate_limits.expires_at<=now() then 1 else public.rate_limits.count+1 end, expires_at=case when public.rate_limits.expires_at<=now() then now()+make_interval(secs=>p_window) else public.rate_limits.expires_at end returning count into v_count;
 return v_count<=p_limit;
end $$;

create function public.set_interests(p_user uuid,p_categories uuid[]) returns void language plpgsql security definer set search_path='' as $$
begin
 if cardinality(p_categories) not between 1 and 3 or (select count(distinct x) from unnest(p_categories) x)<>cardinality(p_categories) then raise exception 'INVALID_INTERESTS'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 if (select count(*) from public.categories where id=any(p_categories) and is_active)<>cardinality(p_categories) then raise exception 'INVALID_CATEGORY'; end if;
 delete from public.user_interests where user_id=p_user;
 insert into public.user_interests select p_user,x,n from unnest(p_categories) with ordinality as t(x,n);
end $$;

create unique index one_active_assessment on public.assessment_attempts(user_id,category_id) where completed_at is null;
create function public.start_assessment(p_user uuid,p_category uuid) returns public.assessment_attempts language plpgsql security definer set search_path='' as $$
declare a public.assessment_attempts; snapshot jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text||p_category::text,0));
 select * into a from public.assessment_attempts where user_id=p_user and category_id=p_category and completed_at is null;
 if found then return a; end if;
 select jsonb_agg(to_jsonb(q) - 'rn' order by level,id) into snapshot from (select *,row_number() over(partition by level order by random()) rn from public.assessment_questions where category_id=p_category and is_active) q where rn<=2;
 if snapshot is null or jsonb_array_length(snapshot)<>10 then raise exception 'QUESTION_BANK_INCOMPLETE'; end if;
 insert into public.assessment_attempts(user_id,category_id,question_snapshot) values(p_user,p_category,snapshot) returning * into a;
 insert into public.event_logs(user_id,event_name) values(p_user,'assessment_started');
 return a;
end $$;

create function public.submit_assessment(p_user uuid,p_attempt uuid,p_answers jsonb) returns public.assessment_attempts language plpgsql security definer set search_path='' as $$
declare a public.assessment_attempts; q jsonb; selected text; weight int:=0; total int:=0; ratio numeric; lvl numeric; topics jsonb;
begin
 select * into a from public.assessment_attempts where id=p_attempt and user_id=p_user for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if a.completed_at is not null then return a; end if;
 if jsonb_array_length(p_answers)<>10 or (select count(distinct x->>'questionId') from jsonb_array_elements(p_answers)x)<>10 then raise exception 'INVALID_ANSWERS'; end if;
 for q in select * from jsonb_array_elements(a.question_snapshot) loop
  select x->>'selectedOption' into selected from jsonb_array_elements(p_answers)x where x->>'questionId'=q->>'id';
  if selected is null or selected not in ('A','B','C','D') then raise exception 'INVALID_ANSWERS'; end if;
  total:=total+(q->>'level')::int;
  if selected=q->>'correct_option' then weight:=weight+(q->>'level')::int; end if;
  insert into public.assessment_answers values(a.id,(q->>'id')::uuid,selected,selected=q->>'correct_option');
 end loop;
 ratio:=weight::numeric/total;
 lvl:=case when ratio<.25 then 1 when ratio<.45 then 2 when ratio<.65 then 3 when ratio<.82 then 4 else 5 end;
 select jsonb_object_agg(topic,accuracy) into topics from (
  select snapshot_question->>'topic' topic,avg(case when an.is_correct then 1.0 else 0 end) accuracy
  from jsonb_array_elements(a.question_snapshot) snapshot_question join public.assessment_answers an on an.attempt_id=a.id and an.question_id=(snapshot_question->>'id')::uuid group by snapshot_question->>'topic'
 ) s;
 update public.assessment_attempts set completed_at=clock_timestamp(),score=ratio,calculated_level=lvl,topic_scores=topics where id=a.id returning * into a;
 insert into public.user_category_levels(user_id,category_id,level,attempt_id,topic_scores) values(p_user,a.category_id,lvl,a.id,topics) on conflict(user_id,category_id) do update set level=excluded.level,attempt_id=excluded.attempt_id,topic_scores=excluded.topic_scores,updated_at=now();
 insert into public.event_logs(user_id,event_name) values(p_user,'assessment_completed');
 return a;
end $$;

create function public.start_essay(p_user uuid,p_question uuid,p_mode text,p_limit int) returns uuid language plpgsql security definer set search_path='' as $$
declare q public.essay_questions; a uuid;
begin
 select * into q from public.essay_questions where id=p_question and is_active and (created_by=p_user or source='admin');
 if not found then raise exception 'NOT_FOUND'; end if;
 insert into public.essay_attempts(user_id,essay_question_id,book_id,category_id,practice_type,target_skill,difficulty,mode,time_limit_seconds) values(p_user,q.id,q.book_id,q.category_id,q.practice_type,q.target_skill,q.difficulty,p_mode,p_limit) returning id into a;
 insert into public.essays(user_id,attempt_id) values(p_user,a);
 insert into public.event_logs(user_id,event_name,metadata) values(p_user,'essay_started',jsonb_build_object('attemptId',a)),(p_user,'essay_timer_started',jsonb_build_object('attemptId',a));
 return a;
end $$;

create function public.autosave_essay(p_user uuid,p_attempt uuid,p_content text,p_revision int) returns public.essays language plpgsql security definer set search_path='' as $$
declare a public.essay_attempts; e public.essays;
begin
 select * into a from public.essay_attempts where id=p_attempt and user_id=p_user for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if a.submitted_at is not null then raise exception 'ALREADY_SUBMITTED'; end if;
 update public.essays set content=p_content,revision=revision+1,updated_at=clock_timestamp() where attempt_id=a.id and user_id=p_user and revision=p_revision returning * into e;
 if not found then raise exception 'REVISION_CONFLICT'; end if;
 insert into public.event_logs(user_id,event_name) values(p_user,'essay_autosaved');
 return e;
end $$;

create function public.submit_essay(p_user uuid,p_attempt uuid,p_content text,p_revision int) returns public.essays language plpgsql security definer set search_path='' as $$
declare a public.essay_attempts; e public.essays; elapsed int;
begin
 select * into a from public.essay_attempts where id=p_attempt and user_id=p_user for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if a.submitted_at is not null then select * into e from public.essays where attempt_id=a.id; return e; end if;
 if char_length(trim(p_content))<20 then raise exception 'ESSAY_TOO_SHORT'; end if;
 update public.essays set content=p_content,revision=revision+1,updated_at=clock_timestamp() where attempt_id=a.id and revision=p_revision returning * into e;
 if not found then raise exception 'REVISION_CONFLICT'; end if;
 elapsed:=greatest(0,floor(extract(epoch from (clock_timestamp()-a.started_at)))::int);
 update public.essay_attempts set submitted_at=clock_timestamp(),elapsed_seconds=elapsed,overtime_seconds=case when mode='timed' then greatest(0,elapsed-time_limit_seconds) else 0 end,character_count=char_length(p_content) where id=a.id;
 insert into public.event_logs(user_id,event_name,metadata) values(p_user,'essay_submitted',jsonb_build_object('essayId',e.id));
 return e;
end $$;

create unique index essay_linear_rewrite on public.essays(previous_essay_id) where previous_essay_id is not null;
create function public.rewrite_essay(p_user uuid,p_essay uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare e public.essays; a public.essay_attempts; next_attempt uuid;
begin
 select * into e from public.essays where id=p_essay and user_id=p_user for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 select attempt_id into next_attempt from public.essays where previous_essay_id=e.id;
 if found then return next_attempt; end if;
 select * into a from public.essay_attempts where id=e.attempt_id and submitted_at is not null;
 if not found then raise exception 'NOT_SUBMITTED'; end if;
 if not exists(select 1 from public.essay_evaluations where essay_id=e.id) then raise exception 'EVALUATION_REQUIRED'; end if;
 insert into public.essay_attempts(user_id,essay_question_id,book_id,category_id,practice_type,target_skill,difficulty,mode,time_limit_seconds) values(p_user,a.essay_question_id,a.book_id,a.category_id,a.practice_type,a.target_skill,a.difficulty,a.mode,a.time_limit_seconds) returning id into next_attempt;
 insert into public.essays(user_id,attempt_id,content,version,previous_essay_id) values(p_user,next_attempt,e.content,e.version+1,e.id);
 insert into public.event_logs(user_id,event_name) values(p_user,'essay_rewrite_started');
 return next_attempt;
end $$;

-- Grant only server use of privileged functions. Trigger execution is unaffected.
revoke all on all functions in schema public from public,anon,authenticated;
grant execute on all functions in schema public to service_role;
grant execute on function public.is_blocked(uuid) to anon,authenticated;
