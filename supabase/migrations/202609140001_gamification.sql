create table public.rank_tiers(
 id uuid primary key default gen_random_uuid(),
 key text not null unique,
 name text not null,
 division text not null,
 min_rating integer not null check(min_rating>=0),
 sort_order integer not null unique,
 icon_key text not null,
 created_at timestamptz not null default now()
);

create table public.rating_rules(
 id uuid primary key default gen_random_uuid(),
 event_type text not null unique,
 points integer not null check(points>=0),
 daily_cap integer not null check(daily_cap>=0),
 reduced_rewards integer not null default 0 check(reduced_rewards>=0),
 quality_required boolean not null default false,
 unique_only boolean not null default false,
 is_active boolean not null default true,
 updated_at timestamptz not null default now()
);

create table public.user_ratings(
 user_id uuid primary key references public.profiles(id) on delete cascade,
 rating integer not null default 0 check(rating>=0),
 tier_key text not null references public.rank_tiers(key),
 current_season_rank integer check(current_season_rank is null or current_season_rank>0),
 updated_at timestamptz not null default now()
);

create table public.rating_events(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 event_type text not null references public.rating_rules(event_type),
 source_type text not null check(char_length(source_type) between 1 and 40),
 source_id uuid,
 points integer not null check(points>=0),
 idempotency_key text not null check(char_length(idempotency_key) between 1 and 160),
 metadata jsonb not null default '{}',
 created_at timestamptz not null default now(),
 unique(user_id,idempotency_key)
);
create index rating_events_daily on public.rating_events(user_id,event_type,created_at desc);
create index rating_events_source on public.rating_events(user_id,event_type,source_id);

create table public.seasons(
 id uuid primary key default gen_random_uuid(),
 name text not null,
 starts_at timestamptz not null,
 ends_at timestamptz not null check(ends_at>starts_at),
 status text not null check(status in ('upcoming','active','completed')),
 created_at timestamptz not null default now()
);
create unique index one_active_season on public.seasons(status) where status='active';

create table public.season_rankings(
 season_id uuid not null references public.seasons(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 rating integer not null check(rating>=0),
 rank integer not null check(rank>0),
 updated_at timestamptz not null default now(),
 primary key(season_id,user_id),
 unique(season_id,rank)
);
create index season_rankings_order on public.season_rankings(season_id,rank);

create table public.category_rankings(
 season_id uuid not null references public.seasons(id) on delete cascade,
 category_id uuid not null references public.categories(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 rating integer not null check(rating>=0),
 rank integer not null check(rank>0),
 updated_at timestamptz not null default now(),
 primary key(season_id,category_id,user_id),
 unique(season_id,category_id,rank)
);
create index category_rankings_order on public.category_rankings(season_id,category_id,rank);

create table public.badges(
 id uuid primary key default gen_random_uuid(),
 key text not null unique,
 name text not null,
 description text not null,
 family text not null check(family in ('reading','essay','discussion','knowledge','streak','ranking','seasonal')),
 rarity text not null check(rarity in ('common','uncommon','rare','epic','legendary')),
 icon_key text not null,
 mark_asset_url text,
 full_asset_url text,
 season_id uuid references public.seasons(id) on delete set null,
 series_key text,
 series_order integer,
 criteria jsonb not null default '{}',
 is_active boolean not null default true,
 created_at timestamptz not null default now()
);
create index badges_collection on public.badges(family,rarity,series_key,series_order);

create table public.user_badges(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 badge_id uuid not null references public.badges(id) on delete cascade,
 earned_at timestamptz not null default now(),
 season_id uuid references public.seasons(id) on delete set null,
 metadata jsonb not null default '{}'
);
create index user_badges_owner on public.user_badges(user_id,earned_at desc);
create index user_badges_dedupe on public.user_badges(user_id,badge_id,season_id);

create table public.user_equipped_badges(
 user_id uuid not null references public.profiles(id) on delete cascade,
 slot integer not null check(slot between 1 and 3),
 user_badge_id uuid not null references public.user_badges(id) on delete cascade,
 primary key(user_id,slot),
 unique(user_id,user_badge_id)
);

create table public.streaks(
 user_id uuid primary key references public.profiles(id) on delete cascade,
 current_streak integer not null default 0 check(current_streak>=0),
 longest_streak integer not null default 0 check(longest_streak>=0),
 last_activity_date date,
 updated_at timestamptz not null default now()
);

create or replace function public.record_streak_activity(p_user uuid) returns integer language plpgsql security definer set search_path='' as $$
declare s public.streaks; v_current integer;
begin
 if p_user is null then raise exception 'INVALID_STREAK_INPUT'; end if;
 insert into public.streaks(user_id) values(p_user) on conflict(user_id) do nothing;
 select * into s from public.streaks where user_id=p_user for update;
 if s.last_activity_date=current_date then return s.current_streak; end if;
 v_current:=case when s.last_activity_date=current_date-1 then s.current_streak+1 else 1 end;
 update public.streaks set current_streak=v_current,longest_streak=greatest(longest_streak,v_current),last_activity_date=current_date,updated_at=now() where user_id=p_user;
 return v_current;
end $$;

create or replace function public.award_criteria_badges(p_user uuid) returns void language plpgsql security definer set search_path='' as $$
declare b record; v_count integer; v_rating integer;
begin
 select rating into v_rating from public.user_ratings where user_id=p_user;
 for b in select * from public.badges where is_active and criteria ? 'event_type' loop
  select count(*) into v_count from public.rating_events where user_id=p_user and event_type=b.criteria->>'event_type';
  if v_count >= coalesce((b.criteria->>'count')::int,1) and not exists(select 1 from public.user_badges where user_id=p_user and badge_id=b.id and season_id is null) then
   insert into public.user_badges(user_id,badge_id,metadata) values(p_user,b.id,jsonb_build_object('trigger','rating_event'));
  end if;
 end loop;
 for b in select * from public.badges where is_active and criteria ? 'rating_gte' loop
  if coalesce(v_rating,0) >= (b.criteria->>'rating_gte')::int and not exists(select 1 from public.user_badges where user_id=p_user and badge_id=b.id and season_id is null) then
   insert into public.user_badges(user_id,badge_id,metadata) values(p_user,b.id,jsonb_build_object('trigger','rating_threshold'));
  end if;
 end loop;
end $$;

create or replace function public.record_reward(p_user uuid,p_event_type text,p_source_type text,p_source_id uuid,p_idempotency_key text) returns table(event_id uuid,rating integer,tier_key text,points integer) language plpgsql security definer set search_path='' as $$
declare r public.rating_rules; u public.user_ratings; previous public.rating_events; v_daily integer; v_source integer; v_points integer; v_tier text; v_season uuid;
begin
 if p_user is null or nullif(p_event_type,'') is null or nullif(p_source_type,'') is null or nullif(p_idempotency_key,'') is null then raise exception 'INVALID_REWARD_INPUT'; end if;
 select * into previous from public.rating_events where user_id=p_user and idempotency_key=p_idempotency_key;
 if previous.id is not null then
  select ur.* into u from public.user_ratings ur where ur.user_id=p_user;
  return query select previous.id,u.rating,u.tier_key,previous.points; return;
 end if;
 select * into r from public.rating_rules where event_type=p_event_type and is_active;
 if not found then raise exception 'INVALID_REWARD_EVENT'; end if;
 insert into public.user_ratings(user_id,rating,tier_key) values(p_user,0,'reader_1') on conflict(user_id) do nothing;
 select ur.* into u from public.user_ratings ur where ur.user_id=p_user for update;
 select count(*) into v_daily from public.rating_events where user_id=p_user and event_type=p_event_type and created_at>=date_trunc('day',now());
 select count(*) into v_source from public.rating_events where user_id=p_user and event_type=p_event_type and source_type=p_source_type and source_id is not distinct from p_source_id;
 if r.unique_only and v_source>0 then v_points:=0;
 elsif v_daily<r.daily_cap then v_points:=r.points;
 elsif v_daily<r.daily_cap+r.reduced_rewards then v_points:=ceil(r.points/2.0)::int;
 else v_points:=0;
 end if;
 insert into public.rating_events(user_id,event_type,source_type,source_id,points,idempotency_key) values(p_user,p_event_type,p_source_type,p_source_id,v_points,p_idempotency_key) returning id into event_id;
 select key into v_tier from public.rank_tiers where key<>'challenger' and min_rating<=u.rating+v_points order by min_rating desc limit 1;
 update public.user_ratings set rating=u.rating+v_points,tier_key=coalesce(v_tier,'reader_1'),updated_at=now() where user_id=p_user returning user_ratings.rating,user_ratings.tier_key into rating,tier_key;
 points:=v_points;
 perform public.award_criteria_badges(p_user);
 select id into v_season from public.seasons where status='active' limit 1;
 if v_season is not null then perform public.refresh_season_rankings(v_season); end if;
 return next;
end $$;

create or replace function public.refresh_season_rankings(p_season uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 delete from public.season_rankings where season_id=p_season;
 insert into public.season_rankings(season_id,user_id,rating,rank)
 select p_season,user_id,rating,row_number() over(order by rating desc,user_id)::int from public.user_ratings;
 update public.user_ratings u set current_season_rank=s.rank,updated_at=now() from public.season_rankings s where s.season_id=p_season and s.user_id=u.user_id;
 insert into public.user_badges(user_id,badge_id,season_id,metadata)
 select ranking.user_id,b.id,p_season,jsonb_build_object('final_rank',ranking.rank)
 from public.season_rankings ranking join public.badges b on b.key='season_challenger'
 where ranking.season_id=p_season and ranking.rank<=100 and b.is_active
 and not exists(select 1 from public.user_badges ub where ub.user_id=ranking.user_id and ub.badge_id=b.id and ub.season_id=p_season);
end $$;
