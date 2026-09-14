"use client";
import Link from "next/link";
import { useState } from "react";
import { api, ClientApiError } from "@/lib/client/api";
import { useOnMount } from "@/lib/client/hooks";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  InsightCard,
} from "@/components/ui/primitives";
import { RankMark } from "@/components/gamification/rank-mark";
type Review = {
  id: string;
  rating: number;
  content: string;
  profiles: { display_name: string } | null;
  books: { title: string } | null;
  rankMark: { tier: string; challengerRank: number | null } | null;
};
type Discussion = {
  id: string;
  title: string;
  question: string;
  profiles: { display_name: string } | null;
  books: { title: string } | null;
  rankMark: { tier: string; challengerRank: number | null } | null;
};
type Essay = {
  id: string;
  content: string;
  version: number;
  profiles: { display_name: string } | null;
  evaluation: { total_score: number } | null;
};
export function CommunityClient() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [essays, setEssays] = useState<Essay[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const load = async () => {
    setState("loading");
    try {
      const [community, publicEssays] = await Promise.all([
        api<{ reviews: Review[]; discussions: Discussion[] }>("/api/community"),
        api<{ essays: Essay[] }>("/api/essay/public"),
      ]);
      setReviews(community.reviews);
      setDiscussions(community.discussions);
      setEssays(publicEssays.essays);
      setState("ready");
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "커뮤니티를 불러오지 못했습니다.",
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
          title="커뮤니티를 불러오지 못했어요."
          action={
            <Button onClick={load} variant="secondary">
              다시 시도
            </Button>
          }
        >
          {message}
        </EmptyState>
      </Card>
    );
  return (
    <>
      <InsightCard
        tone="lavender"
        title="좋은 질문에는 하나의 답만 있지 않아요."
      >
        <p>
          서로의 근거에 귀 기울이며, 책에서 시작된 생각을 천천히 넓혀가요.
          신고된 콘텐츠는 운영자가 검토할 수 있습니다.
        </p>
      </InsightCard>
      <div className="community-columns page-section">
        <section>
          <h2>최근 독자 리뷰</h2>
          <div className="content-list page-section">
            {reviews.length ? (
              reviews.map((review) => (
                <Card className="content-card" key={review.id}>
                  <header>
                    <Badge tone="rose">★ {review.rating}</Badge>
                    <strong>{review.books?.title ?? "책"}</strong>
                  </header>
                  <p className="reading-copy">{review.content}</p>
                  <footer className="author-line"><span>{review.profiles?.display_name ?? "독자"}</span>{review.rankMark && <RankMark tier={review.rankMark.tier} challengerRank={review.rankMark.challengerRank} size="sm" />}</footer>
                </Card>
              ))
            ) : (
              <Card>
                <EmptyState title="첫 리뷰를 기다려요.">
                  책 상세에서 생각을 나눠보세요.
                </EmptyState>
              </Card>
            )}
          </div>
        </section>
        <section>
          <h2>열린 토론</h2>
          <div className="content-list page-section">
            {discussions.length ? (
              discussions.map((discussion) => (
                <Link
                  className="discussion-link"
                  href={`/discussions/${discussion.id}`}
                  key={discussion.id}
                >
                  <Badge tone="lavender">
                    {discussion.books?.title ?? "책 토론"}
                  </Badge>
                  <h3>{discussion.title}</h3>
                  <p>{discussion.question}</p>
                  {discussion.rankMark && <span className="discussion-rank"><RankMark tier={discussion.rankMark.tier} challengerRank={discussion.rankMark.challengerRank} size="sm" showLabel /></span>}
                </Link>
              ))
            ) : (
              <Card>
                <EmptyState
                  title="열린 토론이 없어요."
                  action={
                    <Link className="button button--secondary" href="/search">
                      책 찾기
                    </Link>
                  }
                >
                  책 상세에서 질문을 열 수 있어요.
                </EmptyState>
              </Card>
            )}
          </div>
        </section>
        <section>
          <h2>공개 논술</h2>
          <div className="content-list page-section">
            {essays.length ? (
              essays.map((essay) => (
                <Card className="content-card" key={essay.id}>
                  <header>
                    <Badge tone="teal">Rewrite {essay.version}</Badge>
                    {essay.evaluation && (
                      <strong>{essay.evaluation.total_score}점</strong>
                    )}
                  </header>
                  <p className="reading-copy essay-preview">{essay.content}</p>
                  <footer>{essay.profiles?.display_name ?? "독자"}</footer>
                </Card>
              ))
            ) : (
              <Card>
                <EmptyState
                  title="공개된 논술이 없어요."
                  action={
                    <Link className="button button--secondary" href="/essay">
                      논술 연습
                    </Link>
                  }
                >
                  작성자가 공개한 답안만 여기에 표시됩니다.
                </EmptyState>
              </Card>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
