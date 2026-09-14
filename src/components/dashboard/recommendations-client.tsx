"use client";
import Link from "next/link";
import { useState } from "react";
import { api, ClientApiError } from "@/lib/client/api";
import { useOnMount } from "@/lib/client/hooks";
import {
  Button,
  Card,
  EmptyState,
  InsightCard,
} from "@/components/ui/primitives";
import { LiveBookCard, type LiveBook } from "@/components/books/live-book-card";
type Level = {
  category_id: string;
  level: number;
  categories: { name: string; slug: string } | null;
};
type Profile = { levels: Level[] };
type Recommendation = {
  id: string;
  category_id: string;
  score: number;
  ai_reason: string;
  books: LiveBook | null;
};
export function RecommendationsClient() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [items, setItems] = useState<Recommendation[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [state, setState] = useState<
    "loading" | "ready" | "generating" | "error"
  >("loading");
  const [message, setMessage] = useState("");
  const load = async () => {
    setState("loading");
    try {
      const [p, r] = await Promise.all([
        api<Profile>("/api/profile"),
        api<{ recommendations: Recommendation[] }>("/api/recommendations"),
      ]);
      setLevels(p.levels);
      setCategoryId((current) => current || p.levels[0]?.category_id || "");
      setItems(r.recommendations);
      setState("ready");
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "추천을 불러오지 못했습니다.",
      );
      setState("error");
    }
  };
  useOnMount(load);
  async function generate() {
    if (!categoryId) return;
    setState("generating");
    setMessage("");
    try {
      const result = await api<{ recommendations: Recommendation[] }>(
        "/api/recommendations",
        { method: "POST", body: JSON.stringify({ categoryId }) },
      );
      setItems(result.recommendations);
      setState("ready");
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "추천을 만들지 못했습니다.",
      );
      setState("ready");
    }
  }
  if (state === "loading")
    return (
      <div className="skeleton-grid">
        <i />
        <i />
        <i />
      </div>
    );
  if (state === "error")
    return (
      <Card>
        <EmptyState
          title="추천을 불러오지 못했어요."
          action={
            <Button variant="secondary" onClick={load}>
              다시 시도
            </Button>
          }
        >
          {message}
        </EmptyState>
      </Card>
    );
  if (!levels.length)
    return (
      <Card>
        <EmptyState
          title="먼저 관심 분야 진단을 완료해주세요."
          action={
            <Link className="button button--primary" href="/onboarding">
              진단 분야 선택
            </Link>
          }
        >
          분야별 현재 수준이 있어야 검수된 도서의 난이도와 지식 공백을 비교할 수
          있어요.
        </EmptyState>
      </Card>
    );
  const shown = items.filter((item) => item.category_id === categoryId);
  return (
    <>
      <InsightCard tone="sage" title="추천은 검수된 책 안에서만 만들어요.">
        <p>
          알고리즘이 수준·관심도·지식 공백·독서 이력을 비교하고, AI는 선정된
          책의 이유만 설명합니다.
        </p>
      </InsightCard>
      <div className="recommendation-controls">
        <label>
          진단 분야
          <select
            className="select-control"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            {levels.map((level) => (
              <option key={level.category_id} value={level.category_id}>
                {level.categories?.name ?? "분야"} · Level{" "}
                {Number(level.level).toFixed(1)}
              </option>
            ))}
          </select>
        </label>
        <Button onClick={generate} disabled={state === "generating"}>
          {state === "generating" ? "추천 계산 중…" : "추천 새로 만들기"}
        </Button>
      </div>
      {message && (
        <p className="error-message" role="alert">
          {message}
        </p>
      )}
      {shown.length ? (
        <div className="book-grid page-section">
          {shown.map(
            (item) =>
              item.books && (
                <LiveBookCard
                  key={item.id}
                  book={item.books}
                  score={item.score}
                  reason={item.ai_reason}
                />
              ),
          )}
        </div>
      ) : (
        <Card className="page-section">
          <EmptyState
            title="이 분야의 추천 후보가 아직 없어요."
            action={
              <Link className="button button--secondary" href="/search">
                책 검색하기
              </Link>
            }
          >
            검수된 난이도와 주제가 있는 책이 준비되면 여기에 표시됩니다.
            존재하지 않는 책을 AI가 만들어 보여주지 않습니다.
          </EmptyState>
        </Card>
      )}
    </>
  );
}
