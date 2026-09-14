# BOOKLEVEL AI 구조

LLM은 책, ISBN, 사용자 수준을 만들거나 계산하지 않습니다. 추천 후보 선정과 평가 채점 시간은 각각 DB/순수 알고리즘과 서버 clock이 담당합니다.

## 공통 실행 계약

- 서버 전용 OpenAI Responses API
- 기능별 model 환경변수, 20초 timeout, provider retry 0
- Zod schema → TypeScript infer → Structured Output validation
- 최대 1회 애플리케이션 retry
- 요청 본문과 답안 원문은 usage log에 저장하지 않음
- output token, latency, success만 기록
- 입력은 모두 untrusted data로 프롬프트에 명시

## 기능

- 추천 이유: deterministic Top 5의 이유/읽기 초점만 생성. 실패 시 DB fact 기반 설명.
- 토론 질문: 검증 metadata/topic만 사용. 실패 시 책 내용을 주장하지 않는 일반 질문.
- 논술 문제: 5개 유형·난이도·target skill을 반영. 실패 시 주장/근거/반론 중심 일반 논제.
- 논술 평가: 15/15/20/15/15/10/10 rubric 합계 100을 schema가 검증. 시간 정보는 prompt에 주지 않아 점수와 분리.

평가가 두 번 실패하거나 key/model이 없으면 답안은 제출 상태로 유지하고 evaluation만 `failed`로 바꿉니다. 사용자는 동일 essay ID로 재평가할 수 있습니다. 전체 답안을 AI가 대신 다시 쓰지는 않고 rewrite goal과 guiding question만 제공합니다.
