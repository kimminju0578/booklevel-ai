import { expect, test } from "@playwright/test";

test("landing and authentication entry points are usable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("책");
  await expect(page.getByRole("navigation", { name: "주 메뉴" }).getByRole("link", { name: "책 찾기" })).toBeVisible();
  await page.goto("/login");
  await expect(page.getByLabel("이메일")).toBeVisible();
  await expect(page.getByLabel("비밀번호")).toBeVisible();
  await expect(page.getByRole("button", { name: "로그인" })).toBeEnabled();
});

test("book search renders normalized external results", async ({ page }) => {
  await page.route("**/api/books/search?**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        local: [],
        external: [{
          title: "테스트 가능한 책",
          authors: ["검증 저자"],
          publisher: "검증 출판사",
          description: "외부 제공처에서 정규화한 도서입니다.",
          externalIds: { provider: "google", id: "provider-book-1" },
        }],
        warning: null,
      }),
    });
  });
  await page.goto("/search");
  await page.getByLabel("책 제목, 저자 또는 ISBN").fill("테스트");
  await page.getByRole("button", { name: "검색" }).click();
  await expect(page.getByRole("heading", { name: "테스트 가능한 책" })).toBeVisible();
  await expect(page.getByText("검증 저자 · 검증 출판사")).toBeVisible();
  await expect(page.getByRole("button", { name: "BOOKLEVEL에 연결" })).toBeVisible();
});

test("assessment keeps answers while navigating ten questions", async ({ page }) => {
  const questions = Array.from({ length: 10 }, (_, index) => ({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    question: `${index + 1}번 진단 질문입니다. 가장 알맞은 답을 고르세요.`,
    level: (index % 5) + 1,
    topic: "핵심 개념",
    options: ["A", "B", "C", "D"].map((id) => ({ id, text: `${id} 선택지` })),
  }));
  await page.route("**/api/categories", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ categories: [{ id: "10000000-0000-4000-8000-000000000001", slug: "economics", name: "경제" }] }) }));
  await page.route("**/api/assessment/start", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ attemptId: "20000000-0000-4000-8000-000000000001", questions }) }));
  await page.goto("/assessment/economics/quiz");
  await expect(page.getByText("1번 진단 질문입니다. 가장 알맞은 답을 고르세요.")).toBeVisible();
  await page.getByLabel("A 선택지").check();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: "1번 문항, 답변 완료" }).click();
  await expect(page.getByLabel("A 선택지")).toBeChecked();
});

test("essay setup exposes every practice mode and timer", async ({ page }) => {
  await page.route("**/api/categories", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ categories: [{ id: "10000000-0000-4000-8000-000000000001", name: "경제" }] }) }));
  await page.route("**/api/essay/history", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ essays: [] }) }));
  await page.goto("/essay");
  await expect(page.getByLabel("연습 유형")).toBeVisible();
  await expect(page.getByLabel("연습 유형").locator("option")).toHaveCount(5);
  await expect(page.getByLabel("타이머").locator("option")).toHaveCount(4);
  await expect(page.getByRole("button", { name: "논술 연습 시작" })).toBeEnabled();
});

test("ranking and badge cabinet render collectible growth records", async ({ page }) => {
  await page.route("**/api/ranking?limit=50", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({
    season: { id: "season-1", name: "2026 가을 시즌", status: "active", starts_at: "2026-09-01T00:00:00Z", ends_at: "2026-11-30T23:59:59Z" },
    rows: [{ rank: 1, rating: 2847, profile: { id: "user-1", display_name: "서점의 독자", avatar_url: null } }],
    viewer: { rank: 1, rating: 2847 },
  }) }));
  await page.route("**/api/badges", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ badges: [{ id: "badge-1", key: "first_book", name: "첫 장을 넘긴 독자", description: "첫 번째 책을 서재에 기록했습니다.", family: "reading", rarity: "common", icon_key: "first_book", criteria: {} }] }) }));
  await page.goto("/ranking");
  await expect(page.getByRole("heading", { name: "2026 가을 시즌" })).toBeVisible();
  await expect(page.getByText("서점의 독자")).toBeVisible();
  await page.goto("/badges");
  await expect(page.getByRole("heading", { name: "첫 장을 넘긴 독자" })).toBeVisible();
  await expect(page.getByRole("img", { name: "첫 장을 넘긴 독자" })).toBeVisible();
  await page.locator("button.badge-catalog-card").first().click();
  await expect(page.getByRole("dialog", { name: "첫 장을 넘긴 독자" })).toBeVisible();
});
