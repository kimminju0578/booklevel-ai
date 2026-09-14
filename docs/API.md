# BOOKLEVEL AI API 계약

모든 Route Handler는 JSON을 반환합니다. 실패 응답은 `{ error: { code, message, requestId } }`이며 내부 stack trace나 secret은 반환하지 않습니다. mutation은 same-origin `Origin` 검증, 세션 사용자 도출, Zod 입력 검증, 기능별 rate limit을 거칩니다.

## 인증·프로필

| Method | Path | 인증 |
|---|---|---|
| POST | `/api/auth/signup` · `/api/auth/login` · `/api/auth/logout` | signup/login/logout |
| GET/PATCH | `/api/profile` | 필요 |
| PUT | `/api/profile/interests` | 필요 |
| GET | `/api/categories` | 선택 |
| GET | `/api/ranking/me` | 본인의 RP, Tier, 다음 승급, 시즌/분야 순위, 장착 훈장 |
| GET | `/api/profile/badges` | 본인이 획득한 훈장과 장착 슬롯 |
| POST | `/api/profile/badges/equip` | `{ items: [{ slot, userBadgeId }] }`; 최대 3개, 슬롯 중복 불가 |

## 읽기·진단·추천

| Method | Path | 설명 |
|---|---|---|
| POST | `/api/assessment/start` | 분야 UUID로 서버가 검수 문항 10개를 snapshot하고, client에는 정답을 보내지 않음 |
| POST | `/api/assessment/submit` | `{ attemptId, answers: [{ questionId, selectedOption }] }`; 서버에서 채점·level·topic score 계산 |
| GET | `/api/assessment/:attemptId` | 본인 결과만 조회 |
| GET/POST | `/api/recommendations` | 본인 추천 조회/분야별 deterministic 후보 생성 및 AI 이유 생성 |
| GET | `/api/books/search?q=&page=` | Local DB → Google Books/Kakao/Open Library, normalize·ISBN dedupe |
| POST | `/api/books/import` | `{ provider, externalId }`; 검증된 provider 결과를 idempotent import |
| GET | `/api/books/:bookId` | 책 상세·평점 요약·본인 독서 상태 |
| PUT | `/api/books/:bookId/status` | `{ status: want_to_read\|reading\|completed\|paused }` |
| GET | `/api/library` | 본인 서재 |

## 커뮤니티

| Method | Path | 설명 |
|---|---|---|
| GET/POST | `/api/books/:bookId/reviews` | 공개 리뷰 조회/인증 리뷰 작성; 사용자당 책당 하나 |
| PATCH/DELETE | `/api/reviews/:reviewId` | 본인 리뷰만 수정·삭제 |
| GET/POST | `/api/reviews/:reviewId/comments` | 댓글 공개 조회/인증 작성 |
| PUT | `/api/reviews/:reviewId/like` | 리뷰 좋아요 toggle |
| GET/POST | `/api/books/:bookId/discussions` | 책별 토론 조회/작성 |
| POST | `/api/books/:bookId/discussions/generate` | 검증 metadata만 사용하는 AI/fallback 질문 |
| GET | `/api/discussions/:discussionId` | 토론과 답글 |
| POST | `/api/discussions/:discussionId/posts` | `{ stance, content, parentId }`; 답글은 1단계 |
| PUT | `/api/discussion-posts/:postId/like` | 토론 글 좋아요 toggle |
| POST | `/api/reports` | 리뷰·댓글·토론·논술 신고 생성 |
| GET | `/api/community` | 리뷰·토론 피드 |

## 게임화·랭킹·훈장

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/ranking?limit=&categoryId=` | 활성 시즌 전체/분야별 랭킹. 익명 조회 가능, 최대 50명 |
| GET | `/api/ranking/category/:categoryId` | 활성 시즌의 분야별 랭킹 |
| GET | `/api/badges` | 공개된 훈장 catalog와 rarity/visual metadata |

활동 보상은 클라이언트가 RP를 전달하지 않습니다. 서버가 검증을 마친 책 상태·진단·리뷰·토론·논술·Rewrite 이벤트만 idempotency key와 함께 기록하며, daily cap·diminishing returns·quality threshold·unique activity 규칙을 적용합니다. `BOOKLEVEL Level`(분야별 지식 수준)과 `BOOKLEVEL Rating/RP`(활동·성장 랭크)는 별도 지표입니다.

## 독립 논술

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/essay/questions` | 본인 생성/관리자 검수 문제 조회 |
| POST | `/api/essay/questions/generate` | 5개 유형·난이도·target skill 기반 AI/fallback 문제 생성 |
| POST | `/api/essay/attempts` | `{ questionId, mode, timeLimitSeconds }`; 자유/10/20/30분 |
| GET | `/api/essay/attempts/:attemptId` | 본인 draft·질문·평가 조회 |
| PUT | `/api/essay/attempts/:attemptId/autosave` | `{ content, revision }`; 낙관적 revision 충돌 방지 |
| POST | `/api/essay/attempts/:attemptId/submit` | 서버 clock으로 elapsed/overtime 기록 후 평가 시도 |
| POST | `/api/essay/evaluations/:essayId` | 실패한 AI 평가 재시도 |
| POST | `/api/essay/:essayId/rewrite` | 평가 완료 후 단일 linear rewrite chain 생성 |
| PUT | `/api/essay/:essayId/visibility` | `{ isPublic, showScorePublicly }`; private score 공개 불가 |
| PUT | `/api/essay/:essayId/like` | 공개 논술 좋아요 toggle |
| GET | `/api/essay/history` | 본인 History & Growth |
| GET | `/api/essay/public` | 제출 완료·공개·비숨김 답안의 제한 projection, 익명 조회 가능 |

AI 평가 rubric은 `15/15/20/15/15/10/10 = 100`이며, 시간은 `time_feedback`으로 별도 제공합니다. 모든 AI 응답은 OpenAI Structured Output + Zod 검증, 애플리케이션 1회 retry 후 안전한 fallback/failed 상태를 사용합니다.
