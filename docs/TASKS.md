# BOOKLEVEL 구현 체크리스트

## 완료

- [x] Supabase SSR/Auth, Zod, OpenAI, Vitest/PGlite, Playwright
- [x] `.env.example`, server-only secret 경계, 공통 API 오류/Origin/rate limit
- [x] schema, RLS, index, transaction RPC, category seed
- [x] 가입/로그인/로그아웃, 관심사, 진단 10문항, 결과
- [x] deterministic recommendation + structured reason/fallback
- [x] Local/provider 도서 검색, normalize, ISBN dedupe/import
- [x] 도서 상세/서재/리뷰/댓글/좋아요/신고
- [x] 토론/입장/답글/AI 질문 fallback
- [x] 독립 논술 5유형, timer/autosave/overtime/evaluation/rewrite/history/public
- [x] 서버 검증형 RP 보상, Reader~Grandmaster Tier, 시즌/분야 랭킹, Top 100 Challenger 규칙
- [x] 수집형 SVG Rank Mark/Badge, rarity metadata, 프로필 보관함·장착 슬롯·랭킹 화면
- [x] 책/진단/커뮤니티/논술/Rewrite 활동의 RP idempotency hook과 공개 피드 Rank Mark
- [x] loading/empty/error/retry, responsive navigation, accessibility baseline
- [x] unit, full migration integration, browser E2E, lint/typecheck/build

## 운영 데이터/후속

- [ ] 검수된 실제 진단 문항과 추천 catalog 입력
- [ ] Supabase staging cross-user RLS 및 이메일 인증 E2E
- [ ] 관리자 moderation/report 처리 화면
- [ ] 계정 삭제, 개인정보 보존 기간, CSP/HSTS 확정
- [ ] 알림, 북마크, 소셜 로그인은 MVP 이후
