# BOOKLEVEL 데이터베이스

Supabase PostgreSQL migration은 `supabase/migrations/`의 여덟 파일입니다.

1. `202609110001_core.sql`: 29개 테이블, FK, check, index, 프로필 trigger
2. `202609110002_security_and_transactions.sql`: RLS, column grant, rate limit과 평가/논술 transaction RPC
3. `202609110003_catalog.sql`: escaped local 검색과 advisory lock 기반 idempotent import
4. `202609110004_essay_fallback.sql`: 논술 질문 fallback 출처와 정책
5. `202609110005_discussion_fallback.sql`: 토론 질문 fallback 출처
6. `202609140001_gamification.sql`: Rank/Tier, RP 이벤트, 시즌/분야 랭킹, 훈장, streak 및 집계 RPC
7. `202609140002_gamification_security.sql`: 게임화 테이블 RLS/권한, Tier·rule·badge catalog seed, 장착 RPC
8. `202609140003_initial_season.sql`: 기존 활성 시즌이 없을 때 90일짜리 초기 활성 시즌 생성

## 주요 무결성

- `profiles.id → auth.users.id`, 모든 본인 데이터는 사용자 삭제 시 cascade
- ISBN-13 unique + provider/external ID unique + transaction advisory lock
- 활성 진단 attempt는 사용자/분야당 하나, 질문 snapshot은 서버 전용
- 추천은 사용자/책/분야 unique, 서재는 사용자/책 unique
- 리뷰는 사용자/책 unique, likes/reports도 사용자/대상 unique
- 토론 답글은 같은 토론 원글 아래 한 단계만 trigger가 허용
- 논술 attempt의 `started_at/submitted_at/elapsed/overtime`은 DB clock으로 계산
- autosave는 client revision과 일치할 때만 증가, 충돌 시 `REVISION_CONFLICT`
- rewrite는 단일 이전 버전에서 하나의 다음 버전만 생성
- 공개 논술은 service-role projection API가 허용 필드만 반환
- `user_ratings`는 분야 Level과 분리된 전역 RP aggregate이며, Tier는 서버 rule threshold로 계산
- `rating_events`는 `(user_id, idempotency_key)` unique로 중복 보상·새로고침 파밍을 차단
- 시즌 Challenger는 RP만으로 승급하지 않고 active season Top 100에만 부여
- `equip_badges`는 소유한 훈장만 최대 3개 슬롯에 장착하도록 검증

## RLS

모든 public table에 RLS를 켭니다. 익명/인증 사용자는 활성 카테고리·책·검증 주제와 숨김 처리되지 않은 커뮤니티만 읽습니다. 관심사, 평가, 추천, 서재, private 논술과 AI 평가는 `auth.uid()` 소유자만 읽습니다. 쓰기는 Route Handler가 인증/ownership을 확인한 후 service role로 수행하며 privileged RPC는 client role에서 revoke했습니다.

`supabase/seed.sql`은 카테고리만 idempotent하게 넣습니다. 실제 책·ISBN·진단 문항은 provider import 또는 관리자 검수를 통해 등록해야 합니다.
