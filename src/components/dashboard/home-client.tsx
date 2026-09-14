"use client";
import Link from "next/link";
import { useState } from "react";
import { api, ClientApiError } from "@/lib/client/api";
import { useOnMount } from "@/lib/client/hooks";
import {
  Card,
  EmptyState,
  InsightCard,
  LevelBadge,
  StatusBadge,
} from "@/components/ui/primitives";
import { LiveBookCard, type LiveBook } from "@/components/books/live-book-card";
type Profile = {
  profile: { display_name: string };
  levels: {
    level: number;
    categories: { name: string; slug: string } | null;
  }[];
  counts: { reading: number; completed: number; want_to_read: number };
};
type Recommendation = {
  id: string;
  score: number;
  ai_reason: string;
  books: LiveBook | null;
};
export function HomeClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const load = async () => {
    setState("loading");
    try {
      const [p, r] = await Promise.all([
        api<Profile>("/api/profile"),
        api<{ recommendations: Recommendation[] }>("/api/recommendations"),
      ]);
      setProfile(p);
      setRecommendations(r.recommendations);
      setState("ready");
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "홈을 불러오지 못했습니다.",
      );
      setState("error");
    }
  };
  useOnMount(load);
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
          title="나의 홈을 불러오지 못했어요."
          action={
            <Link className="button button--secondary" href="/login">
              로그인 또는 다시 시작
            </Link>
          }
        >
          {message}
        </EmptyState>
      </Card>
    );
  const first = profile?.levels[0];
  return (
    <>
      <InsightCard
        title={`${profile?.profile.display_name ?? "독자"}님, 오늘은 어떤 질문을 품고 읽을까요?`}
      >
        <p>
          {first
            ? `${first.categories?.name ?? "관심"} 분야 Level ${Number(first.level).toFixed(1)}에서 이어갈 책을 준비했어요.`
            : "관심 분야를 진단하면 지금 읽기 좋은 책과 다음 학습 방향을 보여드려요."}
        </p>
        {!first && (
          <Link className="text-link" href="/onboarding">
            첫 진단 시작하기 →
          </Link>
        )}
      </InsightCard>
      <div className="summary-grid">
        <Card>
          <span className="stat-label">나의 최근 수준</span>
          <strong className="stat-value">
            {first ? Number(first.level).toFixed(1) : "—"}
          </strong>
          <LevelBadge level={first ? Number(first.level) : null} />
        </Card>
        <Card>
          <span className="stat-label">읽고 있는 책</span>
          <strong className="stat-value">
            {profile?.counts.reading ?? 0} <small>권</small>
          </strong>
          <StatusBadge
            status={(profile?.counts.reading ?? 0) > 0 ? "reading" : null}
          />
        </Card>
        <Card>
          <span className="stat-label">완독한 책</span>
          <strong className="stat-value">
            {profile?.counts.completed ?? 0} <small>권</small>
          </strong>
          <span className="caption">나의 독서 기록</span>
        </Card>
      </div>
      <section className="page-section">
        <div className="section-heading">
          <h2>지금의 추천</h2>
          <Link className="text-link" href="/recommendations">
            추천 관리 →
          </Link>
        </div>
        {recommendations.length ? (
          <div className="book-grid page-section">
            {recommendations
              .slice(0, 3)
              .map(
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
              title="아직 맞춤 추천이 없어요."
              action={
                <Link
                  className="button button--secondary"
                  href={first ? "/recommendations" : "/onboarding"}
                >
                  {first ? "추천 만들기" : "진단 시작하기"}
                </Link>
              }
            >
              수준 진단을 완료하고 검수된 도서 후보가 준비되면 추천을 만들 수
              있어요.
            </EmptyState>
          </Card>
        )}
      </section>
    </>
  );
}
