# OHGYEOL 보안·개인정보

위협은 세션 탈취, cross-user 접근, 키 노출, prompt injection/환각, XSS 리뷰, 스팸·혐오, AI 비용 남용이다. 클라이언트 요청은 항상 조작 가능하다고 가정한다.

- `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, provider key는 client bundle, `NEXT_PUBLIC_*`, 로그에 절대 넣지 않는다.
- 모든 private 테이블에 Supabase RLS를 켜고 `auth.uid() = user_id` 또는 소유 FK 정책을 적용한다. 사용자 ID는 세션에서 도출한다.
- 서버 schema validation, UUID/길이/enum 제한, parameterized query, HTML escape/허용 Markdown만 사용한다. 오류에는 내부 stack 대신 code만 반환한다.
- mutation은 same-site cookie와 Origin 검증을 사용한다. CSP·HSTS·frame-ancestors 등 운영 보안 헤더는 배포 전 설정한다(**운영 준비 필요**).
- Auth/AI/쓰기 API rate limit, 요청 크기·idempotency 제한, 신고·soft hide·moderator 검토를 둔다. 자동 moderation은 최종 판정이 아니다.
- 로그에는 request id·오류 code·지연만 남기고 토큰/이메일/답변 원문은 저장하지 않는다. 관리자는 최소 권한과 감사 로그를 사용한다.

필수 개인정보는 auth 이메일, 닉네임, 관심사, 활동·평가·사용자 콘텐츠다. 법적 이름·주소·학교·고용주·주민번호·건강정보는 받지 않는다. 계정 삭제 시 Auth·cascade 데이터·파일 삭제, 공개 콘텐츠 익명화, 보존기간·백업 SLA·AI 공급자 학습 사용 여부를 확정해야 한다(**추가 검증 필요**).
