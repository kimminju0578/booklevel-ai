# 초기 데이터 구축

출시 시 경제 약 20권, 철학 약 20권을 편집자가 수집·교차 검증한다. 필드: `title`, `author`, `publisher`, `isbn`, `category`, `difficulty(1–5)`, `concepts`, `short original description`, `cover_url`. 실제 ISBN은 출처 확인 전 실값을 쓰지 않는다(**추가 검증 필요**). 전문·무단 장문 요약은 저장하지 않는다.

난이도 rubric: 1 입문, 2 기초 배경, 3 복합 논증, 4 전문 배경, 5 고난도 원전/추상 논증. 편집자 2인 검수와 근거 기록 후 publish한다.

```json
{"categorySlug":"economics","difficulty":1,"prompt":"문항 본문","options":[{"key":"A","text":"선택지"}],"correctOption":"A","explanation":"제출 후 해설"}
```

카테고리별 10문항, 난이도별 2문항을 준비한다. client DTO에는 `correctOption`을 포함하지 않는다. seed는 idempotent upsert이며 로컬 reset 후 재현 가능하다. 실제 문항·저작권 출처와 향후 50–100권 확대는 **추가 검증 필요**.
