# OHGYEOL UX 와이어프레임

## 정보구조

공개: `/`, `/books/[id]`, 공개 커뮤니티. 인증: `/onboarding/interests`, `/assessment`, `/recommendations`, `/profile`, `/growth`. 모바일 하단 탭은 `홈·추천·커뮤니티·서재·프로필`, 데스크톱은 상단 바를 사용한다. Pretendard/system-ui, 최소 터치 영역 44px을 사용한다.

## 공통 상태·접근성

모든 화면에 loading skeleton, 빈 상태, 재시도 가능한 오류를 정의한다. 포커스 링, 키보드 순서, 명도 대비, aria-label, 인라인 오류를 준수한다. 공간감 있는 카드 중심 레이아웃을 사용하고 과도한 그라디언트·게임화·AI 보라색 광택은 피한다.

| 화면/route | 목적·구성·CTA | 상태/모바일 | 수용 기준 |
|---|---|---|---|
| Landing `/` | 가치 제안·흐름·샘플·시작하기 | 1열, 이미지 lazy | 핵심 가치와 CTA 인지 |
| Login `/login` | 이메일/비밀번호·소셜 로그인 | submit 잠금 | 실패 메시지·안전한 redirect |
| Sign Up `/signup` | 이메일·비밀번호·닉네임·약관 | 필드 세로 | 중복/약한 비밀번호 검증 |
| Interests `/onboarding/interests` | 카테고리 칩·진행률·다음 | 칩 wrap, 44px | 1개 이상 저장/수정 |
| Assessment Intro `/assessment/intro` | 문항 수·시간·주의·시작 | 하단 CTA 고정 | 정답 비노출 안내 |
| Question `/assessment/[attemptId]/[n]` | 문제·5지선다·진행률 | 한 화면/한 문항 | 선택 없이는 진행 불가·복구 |
| Result `/assessment/result/[id]` | 레벨·해석·추천 CTA | 세로 카드 | 진단/보장 표현 금지 |
| Recommendations `/recommendations` | 5권·fit·why now·focus | 카드 1열 | 후보 DB ID만 표시 |
| Book Detail `/books/[id]` | 표지·메타·설명·개념·status·리뷰 | CTA sticky | 상태 변경·SEO 메타 |
| Review List `/books/[id]/reviews` | 정렬·페이지네이션·카드 | 터치 가능한 페이지 | 빈 상태 첫 리뷰 CTA |
| Write Review `/books/[id]/review` | 별점·제목·본문·공개 안내 | textarea full width | 본인 생성·길이/XSS 검증 |
| Community `/community` | feed·카테고리·검색 | 필터 가로 스크롤 | 페이지네이션·신고 |
| Discussion `/community/[id]` | 주제·답글·의견 작성 | composer 하단 | 권한·모더레이션 |
| Growth `/growth` | 완독·활동·레벨 추이 | 통계 1열 | 데이터 없으면 안내 |
| Profile `/profile` | 닉네임·관심사·기록·삭제 | 섹션 세로 | 최소수집·noindex |

```text
[로고] [검색]                         [프로필]
------------------------------------------------
[페이지 제목]                 [주요 CTA]
[필터/탭]
[카드: 표지 | 제목 | 난이도 | 설명 | 액션]
------------------------------------------------
[홈] [추천] [커뮤니티] [서재] [프로필]
```

미래 `/essay`, `/essay/[id]/result`, `/pricing`은 P1/P2이며 MVP에 노출하지 않는다.
