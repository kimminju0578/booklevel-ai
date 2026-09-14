# BOOKLEVEL MVP 구현 보고

## 저장소 Audit 결과

작업 전 저장소는 Next.js 16 랜딩과 3권의 에디터 샘플, 정적 홈/추천/진단/커뮤니티/논술/프로필 화면이 있었습니다. Supabase client, migration, API Route, 인증, 실제 검색, persistence, AI 실행, 테스트는 없거나 문서상 계획만 존재했습니다. 디자인 토큰과 반응형 레이아웃은 정상 동작해 유지했습니다.

## 적용한 순서

1. Next.js 16 로컬 문서 확인, 환경/타입/의존성 정리
2. DB schema·RLS·transaction RPC
3. Auth/assessment/recommendation/catalog server layer와 API
4. Community와 independent essay server layer
5. 실제 UI 흐름, loading/empty/error/retry, 모바일 navigation
6. unit/PGlite integration/Playwright E2E, lint/typecheck/build

## Gamification 확장

- 지식·학습 `Level`과 별개로 전역 `BOOKLEVEL Rating/RP`를 도입했습니다.
- `Reader I`부터 `Grandmaster`까지의 서버 관리 Tier와 active season Top 100 전용 `Challenger` 규칙을 추가했습니다.
- 보상은 클라이언트 입력이 아니라 서버 활동 hook과 `record_reward` RPC가 생성하며, idempotency·일일 cap·감소 보상·품질 기준을 적용합니다.
- 책 상태, 진단 제출, 리뷰·토론, 논술 평가, Rewrite 개선을 RP에 연결하고 Rank Mark를 공개 피드/댓글에 표시합니다.
- Rank Mark와 Achievement Badge는 공통 heraldic medal geometry의 SVG renderer와 `public/ranks`, `public/badges` manifest로 관리합니다. rarity가 높아질수록 border/layer/ornament가 늘어나며, emoji/Lucide 단독 아이콘은 사용하지 않습니다.
- `/ranking`, `/badges`, 프로필의 RP 카드·훈장 보관함을 추가했으며 loading/empty/error/retry와 모바일 레이아웃을 포함합니다.
- `202609140003_initial_season.sql`은 기존 활성 시즌이 없을 때 초기 90일 시즌을 생성해 배포 직후 랭킹 화면이 비어 있지 않도록 합니다.

## 운영 전 필요한 것

- Supabase 프로젝트에 migration과 seed 적용
- 실제 진단 문항 검수/등록(Level별 최소 2개)
- 추천용 도서 category, difficulty, verified topic 큐레이션
- 환경변수 등록과 Auth redirect URL 설정
- 실제 Supabase staging에서 cross-user RLS/API E2E
- 신고 처리 관리자 화면, 계정 삭제/보존 정책, CSP/HSTS 운영 설정
- Google/Kakao provider quota와 OpenAI 비용/품질 모니터링

## 의도적으로 만들지 않은 mock data

가짜 ISBN, 존재하지 않는 책, 임의 진단 정답은 seed하지 않았습니다. 랜딩의 기존 에디터 샘플 3권은 공개 소개용으로 유지되며 개인화 추천 DB에는 자동 유입되지 않습니다. API key가 없을 때 추천/질문은 명시적 fallback을 사용하고 AI 평가는 가짜 점수를 만들지 않습니다.
