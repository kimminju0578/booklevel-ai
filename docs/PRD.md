# OHGYEOL 제품 요구사항 문서

## 문서 상태

MVP 기준안. 현재 저장소는 Next.js 16.3.4 기본 템플릿이며 제품 기능은 미구현이다. 변경 시 `DECISIONS.md`에 기록한다.

## 요약과 비전

OHGYEOL은 한국어 사용자가 자신의 현재 지식 수준에서 다음에 읽을 책을 찾고, 읽고, 생각을 글과 토론으로 연결하며 성장하는 서비스다. 핵심 루프는 **Read → Think → Connect → Write → Grow**다. 단순 취향 추천이 아니라 “지금 배울 준비가 된 다음 책”을 추천한다.

## 사용자와 가치

20–34세 대학생·직장인·취업준비생·지적 호기심이 있는 한국 사용자가 주요 대상이다. 경제, 철학, 심리, 사회, 역사, 정치, 과학, 문학, AI/기술에 관심이 있다. 핵심 문제는 “내 수준에 맞는 책을 모르겠다”이며, 부차적 문제는 “읽었지만 이해했는지 모르겠다”이다.

| 페르소나 | 목표 | 장애물 |
|---|---|---|
| 탐색형 직장인 | 퇴근 후 체계적으로 읽기 | 책 난이도 판단 어려움 |
| 성장형 학생 | 전공 밖 기초부터 확장 | 추천의 근거 부족 |
| 토론형 독자 | 읽은 내용을 공유 | 안전하고 질 높은 대화 부족 |

## 범위

### P0 MVP

인증, 관심사 선택, 난이도별 10문항 평가(난이도 1–5 각 2문항), 레벨 산출, 검증된 책 DB 기반 Top 5 추천과 “왜 지금” 설명, 책 상세, 저장/읽는 중/완독, 리뷰, 커뮤니티 토론, 프로필/독서 기록, 모바일 우선 UI, RLS·기본 분석·테스트.

### P1 / P2

P1: AI 토론 질문, 좋아요·북마크, 알림, 성장 대시보드 강화, 에세이 질문/제출. P2: 에세이 평가·재작성, Thinking Profile, 구독, 실시간 채팅·독서모임, Flutter 앱, 적응형 검사, ML 추천.

## 주요 여정 및 요구사항

`Landing → Auth → Interest → Assessment Intro → 10 Questions → Result → Recommendations → Book Detail → Reading Status → Review/Discussion → Profile`.

| ID | 요구사항 | 우선순위 | 완료 기준 |
|---|---|---|---|
| FR-01 | 이메일/소셜 인증과 세션 보호 | P0 | 가입·로그인·로그아웃 및 보호 라우트 동작 |
| FR-02 | 관심사 1개 이상 선택·수정 | P0 | 저장 후 평가로 이동 |
| FR-03 | 제출 전 정답 비노출 평가 | P0 | 10문항 제출 후에만 채점 |
| FR-04 | 결정론적 레벨 계산 | P0 | 동일 답안은 동일 결과 |
| FR-05 | DB 후보만 추천 | P0 | Top 5 각각 책 ID·근거·공백·집중 포인트 포함 |
| FR-06 | 독서 상태·리뷰·토론 CRUD | P0 | 본인 콘텐츠만 변경 가능 |
| FR-07 | 개인정보·콘텐츠 신고 | P0 | RLS와 신고 저장 동작 |

## 레벨과 성공 지표

`weightedCorrect = Σ(correct × difficulty)`, `maximum = Σ(difficulty)`, `ratio = weightedCorrect / maximum`, `level = 1 + ratio × 4`, 범위 1.00–5.00. 1 beginner, 2 elementary, 3 intermediate, 4 advanced, 5 expert-oriented이며 지능 진단이 아니다.

초기 지표(목표값은 출시 전 기준선 수집 후 확정): 가입→평가 시작률, 평가 완료율, 추천 클릭률, 추천→저장률, 완독률, 리뷰 작성률, 토론 참여율, 7/30일 재방문율. 분석 이벤트에는 원문 답변·민감정보를 넣지 않는다.

## 분석 이벤트

| 이벤트 | trigger | 핵심 properties / 의미 |
|---|---|---|
| `signup_completed` | 가입 성공 | method; 획득 전환 |
| `interest_selected` | 관심사 저장 | categoryIds; 선호 입력 |
| `assessment_started` / `assessment_answered` | 평가 시작/답 저장 | attemptId, questionIndex, difficulty; funnel/이탈 |
| `assessment_completed` | 채점 완료 | attemptId, level; 완료 |
| `recommendation_generated` / `recommendation_clicked` | 추천 생성/카드 클릭 | algorithmVersion, bookId; 품질/관심 |
| `book_saved` / `reading_started` / `book_completed` | 독서 상태 변경 | bookId; 독서 전환 |
| `review_created` | 리뷰 생성 | bookId, rating; 표현 참여 |
| `discussion_viewed` / `discussion_posted` | 토론 조회/작성 | discussionId; 커뮤니티 참여 |
| `essay_started` / `essay_submitted` / `premium_clicked` | 미래 기능 진입/제출/클릭 | feature, source; 수요 파악 |

## 테스트·SEO 수용 기준

unit: assessment scoring, level conversion, recommendation scoring, authorization, validation. integration: RLS와 API 오류. E2E 핵심 흐름은 가입→관심사→10문항→레벨→추천→책→`want_to_read`→리뷰다. 공개 landing/book 상세/선별 콘텐츠는 title·author·description·OG metadata와 가능 시 Book structured data를 제공하고, 개인 화면은 noindex한다.

## 비기능·정책

LCP 약 2.5초 이하, CLS 0.1 이하를 목표로 하며 목록은 페이지네이션, 표지는 최적화한다. 공개 책 상세/선별된 리뷰·토론은 SEO 대상이고 평가·추천·프로필·성장·계정은 noindex다. 책 전문은 저장하지 않고, AI는 학습 보조 피드백으로만 표시한다. 법률·보존기간·AI 공급자 학습 사용 여부는 **추가 검증 필요**.

## 리스크·수용 기준

메타데이터 라이선스, 문항 편향, AI 설명 품질, 악성 콘텐츠, 콜드스타트가 주요 리스크다. 편집 큐레이션 DB와 고정 문항으로 시작하며 실제 ISBN은 검증 후 seed한다(**추가 검증 필요**). 신규 사용자가 가입→관심사→10문항→레벨→5권→저장→리뷰까지 완료하고, AI 장애 시 결정론적 추천을 받으며, 타 사용자 비공개 데이터에 접근할 수 있으면 MVP 완료다.
