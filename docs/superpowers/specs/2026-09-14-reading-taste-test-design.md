# BOOKLEVEL Reading Taste Test Design

## 목적과 범위

Reading Taste Test는 “나는 어떤 책을 좋아할 가능성이 높은가?”를 측정한다. 분야별 지식·이해 수준을 측정하는 기존 BookLevel Test와 별도 진입점, 별도 데이터 모델, 별도 결과 표현을 사용한다. 두 결과는 추천 단계에서만 결합하며 어느 한쪽도 다른 쪽의 의미나 저장값을 덮어쓰지 않는다.

기존 인증, 진단, 추천, 도서 검색, 프로필, gamification 기능은 유지한다. 추천 후보는 실제 DB 도서와 external provider 결과만 사용하며 LLM은 책을 선택하거나 생성하지 않는다.

## 현재 구현 분석

### Recommendation architecture

`src/lib/server/recommendations.ts`가 인증 사용자와 분야를 기준으로 검수된 도서만 조회한다. `src/lib/domain/scoring.ts`의 현재 점수는 Level Fit 40%, Interest 25%, Knowledge Gap 20%, Novelty 10%, Community 5%의 결정론적 합이다. 상위 5권을 고른 뒤 AI는 추천 이유만 작성하고, AI 실패 시 검증 metadata 기반 문구를 사용한다.

### Assessment / BookLevel architecture

BookLevel 진단은 로그인 사용자만 시작할 수 있다. 서버 RPC가 분야별 검수 문항 10개를 snapshot하고, 제출 시 DB에서 정답을 채점해 `assessment_attempts`, `assessment_answers`, `user_category_levels`에 저장한다. 정답과 채점 규칙은 client에 노출하지 않는다.

### Profile, book metadata, analytics

프로필은 `profiles`, 관심 분야는 `user_interests`, 능력 수준은 `user_category_levels`, 독서 이력은 `user_books`에 분리되어 있다. 도서는 난이도, 카테고리, 검수 topic을 가지지만 취향 dimension은 없다. 이벤트는 `event_logs`와 공통 `event()` helper를 사용한다.

## 선택한 접근

비회원은 브라우저 `localStorage`와 versioned URL payload로 결과를 보존한다. payload에는 답변과 schema version만 포함하며, 화면을 열 때 공유된 archetype이나 점수를 신뢰하지 않고 동일한 deterministic 함수로 다시 계산한다. 취향 데이터는 민감정보로 취급하지 않지만 크기와 범위를 Zod로 제한한다.

로그인 사용자가 결과를 저장할 때 서버는 답변을 다시 검증·계산하고 attempt, answers, latest profile을 transaction으로 저장한다. 가입 전 결과는 로그인 후 같은 payload를 제출해 연결한다. Supabase가 연결되지 않았거나 저장이 실패해도 로컬 결과와 공유 기능은 유지한다.

완전 DB형 익명 token은 짧은 URL과 서버 분석에 유리하지만 현재 Supabase 미연결 상태와 과도한 익명 write surface 때문에 제외한다. 완전 client형은 가입 후 동기화와 추천 통합이 약해 제외한다.

## Routes와 사용자 흐름

- `/taste`: 12문항 테스트 소개, 비회원 시작, 기존 결과 이어보기.
- `/taste/test`: 한 문항씩 표시하는 5점 척도 wizard. 진행률, 이전/다음, 선택 유지, 처음부터 다시 시작을 제공한다.
- `/taste/result`: archetype, 8개 dimension indicator, 키워드, 추천 5권, 공유 카드, 가입/BookLevel CTA를 제공한다.
- `/profile`: BookLevel은 “읽을 수 있는 수준”, Taste는 “선호하는 독서 방식”으로 구획을 분리하고 재테스트 링크를 제공한다.

공개 API는 질문·archetype catalog와 취향 기반 추천 projection만 반환한다. 저장 API는 선택 인증을 사용해 로그인 사용자에게만 DB persistence를 수행한다.

## Taste domain model

### Dimensions

모든 값은 0–100이다.

- `pace`: 빠른 전개 0 ↔ 느리고 깊은 전개 100
- `ambiguity`: 명확한 결론 0 ↔ 열린 해석 100
- `realism`: 상상·가상 0 ↔ 현실 기반 100
- `emotionality`: 분석적 0 ↔ 감정 몰입 100
- `intellectual_depth`: 편안한 독서 0 ↔ 깊은 사고 100
- `practical_vs_conceptual`: 실용적 0 ↔ 개념적·철학적 100
- `breadth_vs_depth`: 분야 연결 0 ↔ 한 분야 심화 100
- `plot_vs_character`: 사건 중심 0 ↔ 인물·심리 중심 100

12개 질문은 dimension, direction(-1 또는 1), weight, 좌우 label을 가진다. 응답 1–5를 -1–1로 변환하고 방향과 weight를 적용한다. dimension별 weighted mean을 0–100으로 정규화한다. 답변 누락, 범위 이탈, 알 수 없는 question ID는 거부한다.

### Reader archetypes

각 archetype은 8차원 중심점과 판별 weight를 가진다. 사용자 profile과 archetype 중심점의 weighted normalized distance가 가장 짧은 유형을 선택하고 동률은 고정 priority와 key 순서로 해결한다.

초기 유형은 다음 8개다.

1. `reflective_explorer` — 사유하는 탐험가
2. `knowledge_seeker` — 지식 탐구자
3. `realist_analyst` — 현실주의 분석가
4. `emotional_immersive` — 감정 몰입형 독자
5. `story_collector` — 이야기 수집가
6. `intellectual_adventurer` — 지적 모험가
7. `deep_reader` — 깊이 읽는 연구자
8. `perspective_connector` — 관점 확장형 독자

이름, 설명, 키워드, 권장 독서 방식은 config와 DB seed가 같은 key를 사용한다. LLM은 유형 결정에 관여하지 않는다.

## Database

새 forward migration은 다음 테이블을 만든다.

- `taste_test_questions`: public active question catalog와 scoring config.
- `reader_archetypes`: public 설명과 deterministic centroid config.
- `taste_test_attempts`: 로그인 사용자의 history-ready attempt와 question version.
- `taste_test_answers`: attempt별 검증 답변.
- `user_taste_profiles`: 사용자당 최신 archetype과 dimension JSONB, source attempt.
- `book_taste_profiles`: 책별 dimension JSONB, source, confidence, 검수 상태.

dimension JSONB는 정확한 8개 key와 0–100 숫자를 DB check 및 서버 Zod로 검증한다. questions/archetypes와 verified book taste metadata는 public read다. attempts/answers/user profile은 owner read만 허용하고 write는 authenticated Route Handler의 service-role transaction RPC만 수행한다. privileged RPC는 anon/authenticated에서 revoke한다.

## Recommendation integration

기존 `recommendationScore()`와 저장 schema를 유지한다. 기본 점수 `baseScore`는 기존 계산 결과와 완전히 동일하다.

사용자 Taste Profile과 verified Book Taste Profile이 모두 있을 때만 다음을 적용한다.

```text
rawTasteMatch = 1 - average(abs(userDimension - bookDimension)) / 100
tasteMatch = 0.5 + confidence × (rawTasteMatch - 0.5)
finalScore = 0.82 × baseScore + 0.18 × tasteMatch
```

confidence는 0–1이다. metadata가 없거나 미검수면 `finalScore = baseScore`다. 이 분기 때문에 기존 사용자, Taste 미완료 사용자, Taste metadata가 없는 책의 추천 순서와 성공 여부는 기존 동작을 유지한다.

`recommendations`에는 기존 `score`를 최종 점수로 저장하고 migration으로 nullable `base_score`, `taste_match`를 추가한다. AI 추천 이유 입력에는 계산된 취향 키워드와 verified dimension 차이만 제공한다.

비회원 결과 추천은 Level을 추측하지 않는다. verified Taste metadata가 있는 실제 active 도서만 TasteMatch로 최대 5권 반환한다. 로그인 사용자에게 BookLevel이 있으면 기존 baseScore와 결합한다. 추천 API 실패 시 결과 화면은 유지하고 추천 영역만 retry 상태가 된다.

## Sharing과 acquisition

결과 카드는 동일한 React projection과 순수 SVG serializer를 공유한다. warm ivory, muted sky blue, navy, sage, dusty teal, lavender, sand, dusty rose 토큰만 사용한다. 카드에는 archetype, 핵심 키워드 3개, 실제 추천 제목 최대 3개, 서비스 URL만 넣는다.

- Web Share API가 파일 공유를 지원하면 생성한 PNG와 링크를 공유한다.
- 링크 공유만 가능하면 versioned result URL을 공유한다.
- 지원하지 않으면 Clipboard API로 링크를 복사한다.
- Canvas 변환이 실패해도 SVG 다운로드와 링크 복사는 유지한다.

결과 URL의 payload는 비권위적이며 서버 저장 권한이나 추천 score를 부여하지 않는다. 서버에 저장할 때는 answers만 받아 재계산한다.

## Analytics

기존 event logging을 재사용한다. 서버가 있는 단계에서 `taste_test_started`, `taste_test_completed`, `taste_result_viewed`, `taste_result_shared`, `taste_book_clicked`, `taste_signup_clicked`, `booklevel_test_started_from_taste`를 best-effort로 기록한다. analytics 실패는 테스트, 저장, 추천, 공유를 실패시키지 않는다. 가입 완료 attribution은 로컬 marker를 로그인 후 서버 이벤트로 전환한다.

## UI states와 접근성

질문, 결과, 추천 영역은 각각 loading, empty, error, retry를 가진다. wizard는 fieldset/legend/radio semantics, 44px 이상 touch target, visible focus, `aria-live` 진행 상태를 제공한다. 뒤로 이동해도 답변이 유지되고 새로고침 시 마지막 문항을 복구한다. reduced-motion을 존중한다.

결과 dimension은 레이더 차트 대신 읽기 쉬운 horizontal indicator를 사용한다. 공유 card는 장식용 시각 요소와 별개로 텍스트 대체 설명을 제공한다.

## Components와 modules

- `src/lib/taste/config.ts`: dimensions, questions, archetypes, recommendation weights.
- `src/lib/taste/scoring.ts`: answer normalization, dimension score, archetype, TasteMatch.
- `src/lib/taste/share.ts`: payload encode/decode와 SVG serialization.
- `src/lib/server/taste.ts`: public catalog/recommendation, authenticated persistence, event projection.
- `src/components/taste/`: landing, test wizard, result profile, recommendations, share card/actions.
- `src/app/taste`, `src/app/taste/test`, `src/app/taste/result`: 별도 App Router pages.

## Testing

- Unit: 8개 dimension normalization, reverse direction, deterministic tie-break, malformed payload rejection, TasteMatch confidence, no-profile fallback.
- PGlite integration: migration, authenticated completion transaction, latest profile update, retake history, owner RLS, anonymous direct write 차단, verified metadata read.
- Playwright: 비로그인 시작/완료, 진행률, 새로고침 복구, 결과 URL, 추천 API 실패 격리, 공유/다운로드 fallback, 가입 CTA, 프로필 재테스트.
- Regression: 기존 scoring unit, assessment/recommendation integration, 전체 lint/typecheck/test/build/E2E.

## 운영 경계

새 환경변수는 추가하지 않는다. 실제 Supabase 연결 전에도 순수 scoring, local persistence, result/share UI는 동작한다. 실제 도서 추천과 로그인 profile 동기화는 Supabase 연결 후 활성화된다. 가짜 책, 임의 BookLevel, AI 생성 archetype, 임의 추천 score를 fallback으로 만들지 않는다.
