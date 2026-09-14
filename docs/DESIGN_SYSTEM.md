# BOOKLEVEL AI 디자인 시스템

## 적용 기준

이번 사용자 첨부 명세의 Muted Sky Blue 방향을 기준으로 한다. 기존 노란색 중심 랜딩 디자인을 대체한다. 제품의 채점·추천·인증·저장 로직은 추가하거나 변경하지 않는다. 기존 관심 분야 최대 3개 선택, 분야 필터, 표지 오류 시 대체 이미지, 파일 미리보기는 유지한다.

## 토큰

원본은 `src/app/globals.css`의 `:root`다. 컴포넌트에서 색상 hex를 직접 지정하지 않는다.

| 역할 | 토큰 | 사용 |
|---|---|---|
| 배경·표면 | `--bg`, `--surface`, `--border` | Ivory, White, Neutral 카드 |
| CTA | `--primary`, `--on-primary` | Sky Blue 배경, 대비가 확보된 Navy 글씨 |
| 링크·선택 | `--primary-dark`, `--blue-soft` | 내비게이션, 선택 테두리, 진행률 |
| 본문·캡션 | `--text-primary`, `--text-muted` | 읽기 중심의 텍스트 |
| 추천·독서 | `--sage`, `--sage-soft`, `--sage-ink` | 독서 상태, 추천 안내 |
| 토론 | `--lavender-*` | 토론 카드 |
| 논술 | `--teal-*` | 논술 인사이트·피드백 |
| 성취 | `--sand-*` | Level 표시 |
| 감상·소셜 | `--rose-*` | 리뷰 배지 |
| 오류 | `--terracotta-*` | 파일 검증 오류 |

Accent 원색은 작은 글씨에 그대로 쓰지 않는다. `*-ink`는 밝은 `*-soft` 위에 읽을 수 있는 진한 파생색이다. `--text-secondary`는 브랜드 원본으로 보존하고, 작은 글씨에는 대비를 보정한 `--text-muted`를 사용한다. 한 화면에서 Blue 외 1–2개 의미색만 사용하고, 실제 표지의 색은 변경하지 않는다. 강한 그림자·그라디언트·glassmorphism은 사용하지 않는다.

## 타이포그래피와 형태

Pretendard Variable 로컬 폰트를 사용한다. Fallback은 Inter → OS sans-serif. Hero 32–52px, 페이지 제목 30–34px, 섹션 제목 22–24px, 책 제목 18–19px, 본문 15–17px, 캡션 12–14px. 본문 행간은 1.7–1.8이다. 카드·버튼 곡률은 10–14px, 작은 배지는 6px. 터치 조작은 최소 44px. 360px 이하에서도 줄바꿈하며, 주요 화면은 1200px 이내로 제한한다.

## 공통 컴포넌트

- `src/components/ui/primitives.tsx`: Button, ButtonLink, Card(Neutral/Soft/Editorial), Badge, Progress, LevelBadge, FitScore, StatusBadge, InsightCard, EssayScore, EmptyState.
- `src/components/ui/site-shell.tsx`: 브랜드, 공통 내비게이션, 페이지 헤더, 푸터.
- `src/components/books/`: BookCover, BookCard, BookDetails, Catalog.
- `src/components/community/cards.tsx`: DiscussionCard, ReviewCard. 실제 데이터가 생기면 동일한 컴포넌트를 사용한다.
- `src/components/assessment/screens.tsx`: 진단 안내·문항 준비 상태·결과 빈 상태.

## 적용 화면과 데이터 상태

| 화면 | 경로 | 구현 상태 |
|---|---|---|
| Landing | `/` | 편집 도서, 표지 모달·미리보기, 관심 분야 필터 |
| Assessment | `/assessment/economics`, `/assessment/economics/quiz` | 안내와 문항 준비 상태. 답안 제출·채점 없음 |
| Assessment Result | `/assessment/result` | 미진단 상태. 점수·레벨을 생성하지 않음 |
| Recommendations | `/recommendations` | 기존 편집 도서 목록. 개인화 추천으로 표시하지 않음 |
| Book Detail | `/books/psychology-of-money` 등 | 표지·설명·미리보기. 저장 상태 조작은 비활성 |
| Home Dashboard | `/home` | 계정·독서 기록 연결 전 빈 상태, 편집 도서 목록 |
| Community | `/community` | 감상평·토론 빈 상태 |
| Essay | `/essay` | 질문·평가 준비 상태, 읽기 전용 편집 영역 |
| Profile | `/profile` | 계정과 성장 데이터 연결 전 빈 상태 |

표지 파일은 현재 화면의 상태에만 반영된다. Supabase 저장, 진단 결과 저장, AI 평가 호출은 이 디자인 작업의 범위가 아니다. 기존 루트 모달의 관심사 동작은 그대로 유지하고 새 화면은 별도 링크로 탐색한다.

## 접근성과 검증

색 외에도 텍스트·`aria-pressed`·`aria-current`로 상태를 전달한다. 모달은 native dialog의 포커스 이동·Escape 닫기를 사용하고 이름을 부여한다. 진행률에 값이 없으면 0점으로 단정하지 않고 “아직 기록 없음”으로 읽힌다. 본문 건너뛰기 링크, 포커스 링, reduced-motion 규칙을 제공한다. 비활성 기능은 설명과 disabled/readOnly를 함께 사용한다.

검증은 lint·프로덕션 build, 주요 텍스트 색 대비 계산, 데스크톱/모바일 브라우저의 가로 넘침·키보드·표지 업로드·모달 회귀 검사로 진행한다. 자동 검사만으로 WCAG AA 전체 준수를 보장하지 않는다.
