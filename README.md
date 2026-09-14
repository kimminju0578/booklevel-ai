# BOOKLEVEL AI

현재 지식 수준과 관심 분야를 바탕으로 다음 책을 찾고, 리뷰·토론·논술 피드백으로 생각을 확장하는 Next.js MVP입니다.

## 구현된 흐름

- Supabase 이메일 회원가입/로그인/로그아웃, 관심 분야 1~3개 선택
- 분야별 10문항 진단, 서버 채점, BOOKLEVEL 및 주제별 이해도 저장
- 검수된 도서 후보의 deterministic 추천과 OpenAI 추천 이유/fallback
- Local DB → Google Books/Kakao/Open Library 검색, 정규화, ISBN 중복 제거, 선택 import
- 도서 상세, 독서 상태, 별점/리뷰/댓글/좋아요/신고
- 책별 토론, 동의·반대·판단 보류, 1단계 답글, AI 토론 질문/fallback
- 독립 논술 허브, 5개 연습 유형, 자유/10/20/30분 타이머, autosave, overtime
- Zod Structured Output 기반 AI 평가, 100점 rubric, 재평가, rewrite chain, 공개 답안, History & Growth
- 서버 검증형 BOOKLEVEL RP/Tier, 시즌·분야 랭킹, Top 100 Challenger, 수집형 Rank Mark/Badge 보관함
- loading/empty/error/retry, 모바일 하단 메뉴, Pretendard 로컬 폰트, 실제/대체 표지

## Stack

Next.js 16.3, React 19, TypeScript strict, Tailwind CSS 4, Supabase Auth/PostgreSQL/RLS, OpenAI Responses API, Zod 4, Vitest/PGlite, Playwright.

## Local setup

```bash
npm install
cp .env.example .env.local
```

Supabase 프로젝트에 `supabase/migrations/`를 파일명 순서대로 적용하고 `supabase/seed.sql`을 실행합니다. 그 뒤 `.env.local`의 공개 키와 서버 비밀키를 채웁니다. 실제 값은 커밋하지 않습니다.

```bash
npm run dev
```

외부 도서 검색은 `GOOGLE_BOOKS_API_KEY` 또는 `KAKAO_REST_API_KEY`가 필요합니다. Open Library는 연락처 User-Agent를 제공하고 명시적으로 활성화했을 때만 사용합니다. AI 기능은 `OPENAI_API_KEY`와 기능별 model 환경변수가 모두 있을 때 실행하며, 없으면 검증 가능한 deterministic fallback 또는 재시도 상태를 제공합니다.

## Catalog and assessment readiness

`seed.sql`은 가짜 책/ISBN/진단 문항을 만들지 않고 카테고리만 추가합니다. 진단을 열려면 해당 카테고리에 Level 1~5별 활성 문항을 정확히 2개 이상 검수해 등록해야 합니다. 개인화 추천은 `metadata_quality='verified'`이고 카테고리·검증 주제·난이도가 연결된 실제 도서만 후보로 사용합니다.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

`build`는 제한된 실행 환경에서도 재현 가능하도록 Next.js 공식 webpack 옵션을 사용합니다. 개발 서버는 기본 Turbopack을 유지합니다. E2E는 시스템 Chrome을 사용하도록 설정되어 있습니다.

## Documentation

- [구현 보고와 남은 운영 준비](docs/IMPLEMENTATION_REPORT.md)
- [API 계약](docs/API.md)
- [데이터베이스와 migration](docs/DATABASE.md)
- [AI 구조](docs/AI_SPEC.md)
- [보안](docs/SECURITY.md)
- [디자인 시스템](docs/DESIGN_SYSTEM.md)
