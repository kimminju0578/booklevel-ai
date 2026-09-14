# BOOKLEVEL Gamification, Rank & Collectible Badge Design

## Goal

독서량 경쟁이 아니라 읽기·이해·토론·논술·피드백·Rewrite의 균형 있는 성장을 서버 검증 RP와 수집 가능한 Digital Medal로 보여준다.

## Product rules

- 분야별 Knowledge Level과 global/seasonal game Rank는 별도 데이터와 별도 UI로 유지한다.
- RP는 client가 보내는 점수가 아니라 서버가 확인한 activity에서만 생성한다.
- 하루 cap, diminishing returns, quality threshold, unique activity bonus로 반복 파밍을 제한한다.
- Challenger는 active season Top 100만 획득하며 RP만으로 승급할 수 없다.
- 결제는 RP를 직접 제공하지 않는다.
- public profile과 leaderboard에는 username, avatar, rank, public badges만 노출한다.

## Rank model

Tier 순서는 Reader I–III, Explorer I–III, Scholar I–III, Expert I–III, Master I–III, Grandmaster, Challenger다. 초기 Reader 구간은 빠른 첫 승급을 허용하고 상위 구간은 threshold가 기하급수적으로 증가한다. Challenger 표시는 tier label이 아니라 시즌 Top 100 qualification의 server projection이다.

Rating은 `reading 20%`, `assessment 20%`, `essay 25%`, `rewrite 15%`, `community 10%`, `consistency 10%`의 config로 관리한다. 실제 보상은 활동별 rule config와 사용자별 daily usage로 계산하며, RP event는 append-only 감사 기록으로 남긴다.

## Activity rewards

기본 rule은 저장 +2, 독서 시작 +3, 완독 +20, 리뷰 +10, 리뷰 도움됨 milestone +5, 토론 참여 +8, 유의미한 답글 +3, 논술 제출 +15, AI 평가 80점 이상 +10, Rewrite 완료 +12, Rewrite 10점 이상 개선 +10, 7일 streak +15, 30일 streak +50이다. rule은 DB config로 조정하며 event별 cap과 cooldown을 적용한다.

## Data flow

```text
verified activity
  → server reward rule
  → rating_event (idempotency key)
  → user_rating aggregate
  → tier projection
  → active season ranking
  → profile / leaderboard / badge unlock
```

Rewrite bonus는 동일 essay의 이전 평가와 새 평가를 비교하되 최대 15 RP로 제한한다. quality score는 작성 시간과 독립적이다.

## Collectible visual system

Rank Mark와 Full Badge를 분리한다. Rank Mark는 16–32px에서 식별되는 layered SVG crest이고, Full Badge는 64–256px에서 medal/insignia detail을 보여준다. Emoji, 단일 icon, neon/cyberpunk/gacha style은 사용하지 않는다.

공통 silhouette은 medal/crest frame으로 통일한다. Reader는 open book, Explorer는 book+compass, Scholar는 book+laurel, Expert는 book+laurel+star, Master는 layered heraldic crest, Grandmaster는 완성형 crest, Challenger는 crown/laurel/star와 season mark를 사용한다. Challenger만 제한적으로 antique gold를 사용한다.

Badge family는 reading, essay, discussion, knowledge, ranking, seasonal이며 rarity는 common, uncommon, rare, epic, legendary다. Category Top 100은 같은 frame에 category motif만 바꾼다. Book Mastery는 저작권 표지를 복제하지 않고 verified topic 기반 추상 symbol을 사용한다.

## UX

- Profile: rank mark, tier, RP, next tier progress, global/category/season rank, equipped badges 3개, Trophy Cabinet.
- Activity surfaces: username 옆에는 equipped badge가 아니라 Rank Mark 하나만 표시한다.
- Badge detail: artwork, name, rarity, description, criteria, earned date, season/final rank, acquisition rate.
- Unlock celebration: 획득 순간 2초 이내 muted reveal, 반복 animation 없음.
- Challenger: season/year, final rank, Top 100 문구를 포함한 희소 medal.

## Security and operations

모든 gamification mutation은 authenticated server route/RPC로 처리한다. RLS는 user-owned rating/events/badges를 보호하고 public projection은 제한 컬럼만 반환한다. admin route는 role을 DB에서 재확인한다. event source와 idempotency key를 검증해 client가 임의 RP를 제출할 수 없게 한다.

## Verification

순수 unit test는 reward, cap, diminishing, tier, rewrite bonus, Top 100, badge criteria를 검증한다. PGlite integration은 activity→event→aggregate→tier와 cross-user RLS를 검증한다. Playwright는 Profile rank/cabinet, leaderboard, badge detail, equip, activity reward projection을 확인한다.
