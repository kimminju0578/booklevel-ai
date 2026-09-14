# Architecture Decision Records

## 웹 우선 / Next.js

**Context**: 빠른 반응형 MVP와 SEO가 필요하다. **Choice**: Next.js 웹, Flutter는 후순위. **Reason**: 단일 웹 코드베이스와 공개 페이지. **Alternatives**: native first. **Consequences**: 모바일 UX와 독립 API 계약이 필수다.

## Supabase + RLS

**Context**: Auth와 PostgreSQL이 필요하다. **Choice**: Supabase. **Reason**: 빠른 운영과 정책 기반 보안. **Alternatives**: custom API/DB. **Consequences**: migration/RLS 역량과 provider 종속이 생긴다.

## 결정론적 평가·하이브리드 추천

LLM은 레벨을 정하지 않고, 책은 verified DB에서만 온다. 수식 점수와 후보 제한 rerank를 결합한다. 이는 재현성·환각 방지의 대가로 큐레이션 데이터와 fallback을 요구한다.

## 지연 결정

실시간 채팅, 결제, vector DB/RAG, essay scoring은 비용·정책 검증 뒤 P2다. 변경 시 이 ADR과 PRD 우선순위를 함께 갱신한다.
