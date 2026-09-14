do $$ declare t record; begin
 for t in select unnest(array['rank_tiers','rating_rules','user_ratings','rating_events','seasons','season_rankings','category_rankings','badges','user_badges','user_equipped_badges','streaks']) as tablename loop
  execute format('alter table public.%I enable row level security',t.tablename);
 end loop;
end $$;
revoke all on public.rank_tiers,public.rating_rules,public.user_ratings,public.rating_events,public.seasons,public.season_rankings,public.category_rankings,public.badges,public.user_badges,public.user_equipped_badges,public.streaks from anon,authenticated;
grant all on public.rank_tiers,public.rating_rules,public.user_ratings,public.rating_events,public.seasons,public.season_rankings,public.category_rankings,public.badges,public.user_badges,public.user_equipped_badges,public.streaks to service_role;
grant select on public.rank_tiers,public.seasons,public.season_rankings,public.category_rankings,public.badges to anon,authenticated;
grant select on public.user_ratings,public.rating_events,public.user_badges,public.user_equipped_badges,public.streaks to authenticated;

create policy rank_tiers_read on public.rank_tiers for select using(true);
create policy seasons_read on public.seasons for select using(status in ('active','completed'));
create policy season_rankings_read on public.season_rankings for select using(true);
create policy category_rankings_read on public.category_rankings for select using(true);
create policy badges_read on public.badges for select using(is_active);
create policy ratings_own on public.user_ratings for select using(user_id=auth.uid());
create policy rating_events_own on public.rating_events for select using(user_id=auth.uid());
create policy user_badges_own on public.user_badges for select using(user_id=auth.uid());
create policy equipped_badges_own on public.user_equipped_badges for select using(user_id=auth.uid());
create policy streaks_own on public.streaks for select using(user_id=auth.uid());

create or replace function public.equip_badges(p_user uuid,p_items jsonb) returns void language plpgsql security definer set search_path='' as $$
declare item jsonb; v_count integer;
begin
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)>3 then raise exception 'INVALID_EQUIPPED_BADGES'; end if;
 select count(distinct (value->>'slot')::int) into v_count from jsonb_array_elements(p_items);
 if v_count<>jsonb_array_length(p_items) then raise exception 'INVALID_EQUIPPED_BADGES'; end if;
 if exists(select 1 from jsonb_array_elements(p_items) value where (value->>'slot')::int not between 1 and 3) then raise exception 'INVALID_EQUIPPED_BADGES'; end if;
 if exists(select 1 from jsonb_array_elements(p_items) value where not exists(select 1 from public.user_badges ub where ub.id=(value->>'userBadgeId')::uuid and ub.user_id=p_user)) then raise exception 'BADGE_NOT_OWNED'; end if;
 delete from public.user_equipped_badges where user_id=p_user;
 for item in select * from jsonb_array_elements(p_items) loop
  insert into public.user_equipped_badges(user_id,slot,user_badge_id) values(p_user,(item->>'slot')::int,(item->>'userBadgeId')::uuid);
 end loop;
end $$;

revoke all on function public.record_reward(uuid,text,text,uuid,text) from public,anon,authenticated;
revoke all on function public.refresh_season_rankings(uuid) from public,anon,authenticated;
grant execute on function public.record_reward(uuid,text,text,uuid,text) to service_role;
grant execute on function public.refresh_season_rankings(uuid) to service_role;
grant execute on function public.award_criteria_badges(uuid) to service_role;
grant execute on function public.record_streak_activity(uuid) to service_role;
grant execute on function public.equip_badges(uuid,jsonb) to service_role;

insert into public.rank_tiers(key,name,division,min_rating,sort_order,icon_key) values
 ('reader_1','Reader I','Reader',0,1,'reader'),('reader_2','Reader II','Reader',40,2,'reader'),('reader_3','Reader III','Reader',90,3,'reader'),
 ('explorer_1','Explorer I','Explorer',170,4,'explorer'),('explorer_2','Explorer II','Explorer',270,5,'explorer'),('explorer_3','Explorer III','Explorer',400,6,'explorer'),
 ('scholar_1','Scholar I','Scholar',580,7,'scholar'),('scholar_2','Scholar II','Scholar',800,8,'scholar'),('scholar_3','Scholar III','Scholar',1080,9,'scholar'),
 ('expert_1','Expert I','Expert',1300,10,'expert'),('expert_2','Expert II','Expert',1600,11,'expert'),('expert_3','Expert III','Expert',2000,12,'expert'),
 ('master_1','Master I','Master',2300,13,'master'),('master_2','Master II','Master',2500,14,'master'),('master_3','Master III','Master',3200,15,'master'),
 ('grandmaster','Grandmaster','Grandmaster',4800,16,'grandmaster'),('challenger','Challenger','Challenger',0,17,'challenger')
on conflict(key) do update set name=excluded.name,division=excluded.division,min_rating=excluded.min_rating,sort_order=excluded.sort_order,icon_key=excluded.icon_key;

insert into public.rating_rules(event_type,points,daily_cap,reduced_rewards,quality_required,unique_only) values
 ('book_saved',2,10,2,false,true),('book_started',3,3,3,false,true),('book_completed',20,3,3,false,true),('assessment_completed',10,3,0,false,true),
 ('review_created',10,3,2,true,true),('review_helpful_milestone',5,1,0,true,true),('discussion_joined',8,3,2,true,true),('discussion_reply',3,5,2,true,false),
 ('essay_submitted',15,2,1,true,true),('essay_evaluated_high',10,2,0,true,true),('rewrite_completed',12,2,1,true,true),('rewrite_improved',10,2,0,true,true),('streak_7',15,1,0,false,true),('streak_30',50,1,0,false,true)
on conflict(event_type) do update set points=excluded.points,daily_cap=excluded.daily_cap,reduced_rewards=excluded.reduced_rewards,quality_required=excluded.quality_required,unique_only=excluded.unique_only,is_active=true;

insert into public.badges(key,name,description,family,rarity,icon_key,series_key,series_order,criteria) values
 ('first_book','First Book','첫 번째 책을 완독했습니다.','reading','common','book','reading_books',1,'{"event_type":"book_completed","count":1}'),
 ('books_10','10 Books','열 권의 책을 완독했습니다.','reading','uncommon','book-laurel','reading_books',2,'{"event_type":"book_completed","count":10}'),
 ('essay_10','Essay Practice','논술 답안 열 편을 제출했습니다.','essay','rare','quill','essay_practice',1,'{"event_type":"essay_submitted","count":10}'),
 ('rewrite_5','Revision Scholar','Rewrite 다섯 편으로 생각을 다듬었습니다.','essay','epic','manuscript','essay_practice',2,'{"event_type":"rewrite_completed","count":5}'),
 ('scholar_rank','Scholar Mark','Scholar Tier에 도달했습니다.','ranking','rare','laurel-star',null,null,'{"rating_gte":580}'),
 ('master_rank','Master Mark','Master Tier에 도달했습니다.','ranking','epic','layered-crest',null,null,'{"rating_gte":2300}'),
 ('grandmaster_rank','Grandmaster','Grandmaster Tier에 도달했습니다.','ranking','legendary','grandmaster',null,null,'{"rating_gte":4800}'),
 ('season_challenger','Season Challenger','시즌 상위 100명으로 마무리했습니다.','seasonal','legendary','challenger',null,null,'{"type":"season_top100"}')
on conflict(key) do update set name=excluded.name,description=excluded.description,criteria=excluded.criteria,is_active=true;
