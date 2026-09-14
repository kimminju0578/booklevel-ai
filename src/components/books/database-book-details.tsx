"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { api, ClientApiError } from "@/lib/client/api";
import { useOnMount } from "@/lib/client/hooks";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FitScore,
  InsightCard,
  StatusBadge,
} from "@/components/ui/primitives";
import type { LiveBook } from "./live-book-card";
import { ReviewComments } from "@/components/community/review-comments";
import { ReportButton } from "@/components/community/report-button";

type Status = "want_to_read" | "reading" | "completed" | "paused";
type Detail = {
  book: LiveBook & {
    subtitle: string | null;
    publisher: string | null;
    published_date: string | null;
    page_count: number | null;
    isbn13: string | null;
  };
  currentUserState: { status: Status } | null;
  recommendation: {
    score: number;
    ai_reason: string;
    reading_focus: string[];
  } | null;
  reviewSummary: { count: number; average: number | null };
};
type Review = {
  id: string;
  rating: number;
  short_review: string;
  content: string;
  contains_spoiler: boolean;
  likeCount: number;
  profiles: { display_name: string } | null;
  created_at: string;
};
type Discussion = {
  id: string;
  title: string;
  question: string;
  profiles: { display_name: string } | null;
  created_at: string;
};

export function DatabaseBookDetails({ bookId }: { bookId: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const load = async () => {
    setState("loading");
    setMessage("");
    try {
      const [d, r, t] = await Promise.all([
        api<Detail>(`/api/books/${bookId}`),
        api<{ reviews: Review[] }>(`/api/books/${bookId}/reviews`),
        api<{ discussions: Discussion[] }>(`/api/books/${bookId}/discussions`),
      ]);
      setDetail(d);
      setReviews(r.reviews);
      setDiscussions(t.discussions);
      setState("ready");
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "책 정보를 불러오지 못했습니다.",
      );
      setState("error");
    }
  };
  useOnMount(load);
  async function status(next: Status) {
    try {
      await api(`/api/books/${bookId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: next }),
      });
      setDetail((current) =>
        current ? { ...current, currentUserState: { status: next } } : current,
      );
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "독서 상태를 저장하지 못했습니다.",
      );
    }
  }
  async function createReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api(`/api/books/${bookId}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          rating: Number(form.get("rating")),
          shortReview: form.get("shortReview"),
          content: form.get("content"),
          perceivedDifficulty: form.get("difficulty") || undefined,
          recommendedFor: form.get("recommendedFor"),
          containsSpoiler: form.get("spoiler") === "on",
        }),
      });
      event.currentTarget.reset();
      await load();
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "리뷰를 저장하지 못했습니다.",
      );
    }
  }
  async function createDiscussion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api(`/api/books/${bookId}/discussions`, {
        method: "POST",
        body: JSON.stringify({
          title: form.get("title"),
          question: form.get("question"),
        }),
      });
      event.currentTarget.reset();
      await load();
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "토론을 만들지 못했습니다.",
      );
    }
  }
  async function generateDiscussion() {
    try {
      const result = await api<{ warning: string | null }>(
        `/api/books/${bookId}/discussions/generate`,
        { method: "POST", body: JSON.stringify({}) },
      );
      if (result.warning) setMessage(result.warning);
      await load();
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "토론 질문을 만들지 못했습니다.",
      );
    }
  }
  async function like(review: Review) {
    try {
      await api(`/api/reviews/${review.id}/like`, {
        method: "PUT",
        body: JSON.stringify({ liked: true }),
      });
      setReviews((current) =>
        current.map((item) =>
          item.id === review.id
            ? { ...item, likeCount: item.likeCount + 1 }
            : item,
        ),
      );
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "좋아요를 저장하지 못했습니다.",
      );
    }
  }
  if (state === "loading")
    return (
      <div className="skeleton-grid">
        <i />
        <i />
      </div>
    );
  if (state === "error" || !detail)
    return (
      <Card>
        <EmptyState
          title="책 정보를 불러오지 못했어요."
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
  const book = detail.book;
  return (
    <>
      <div className="book-detail">
        <div className="detail-visual">
          <div className="detail-cover">
            <div className="book-cover">
              <div className="cover-fallback">
                <span>BOOKLEVEL LIBRARY</span>
                <strong>{book.title}</strong>
                <small>{book.authors.join(", ")}</small>
              </div>
              {book.cover_url && (
                <Image
                  src={book.cover_url}
                  alt={`${book.title} 표지`}
                  fill
                  sizes="220px"
                  unoptimized
                />
              )}
            </div>
          </div>
          <p className="caption">{book.publisher || "BOOKLEVEL LIBRARY"}</p>
        </div>
        <div className="detail-copy">
          <Badge tone="sage">실제 도서</Badge>
          <h2>{book.title}</h2>
          <p className="author">
            {book.authors.join(", ") || "저자 정보 없음"}
          </p>
          <p className="reading-copy">
            {book.description || "도서 제공처에 소개가 등록되지 않았습니다."}
          </p>
          <div className="detail-status">
            <StatusBadge status={detail.currentUserState?.status ?? null} />
            <FitScore score={detail.recommendation?.score ?? null} />
            <span className="caption">
              평균 {detail.reviewSummary.average?.toFixed(1) ?? "—"} · 리뷰{" "}
              {detail.reviewSummary.count}
            </span>
          </div>
          {detail.recommendation && (
            <InsightCard title="왜 지금, 이 책일까요?">
              <p>{detail.recommendation.ai_reason}</p>
            </InsightCard>
          )}
          <div className="button-row">
            <Button variant="secondary" onClick={() => status("want_to_read")}>
              읽고 싶어요
            </Button>
            <Button variant="secondary" onClick={() => status("reading")}>
              읽는 중
            </Button>
            <Button variant="secondary" onClick={() => status("completed")}>
              완독
            </Button>
          </div>
          <Link className="text-link" href={`/essay?bookId=${book.id}`}>
            이 책으로 논술 연습 →
          </Link>
        </div>
      </div>
      {message && (
        <p className="error-message page-section" role="alert">
          {message}
        </p>
      )}
      <div className="two-columns page-section">
        <section>
          <h2>독자 리뷰</h2>
          <Card className="page-section">
            <form className="form-stack" onSubmit={createReview}>
              <div className="form-row">
                <label>
                  별점
                  <select
                    className="select-control"
                    name="rating"
                    defaultValue="5"
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>
                        {value}점
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  체감 난이도
                  <select
                    className="select-control"
                    name="difficulty"
                    defaultValue="suitable"
                  >
                    <option value="easy">쉬움</option>
                    <option value="suitable">적절함</option>
                    <option value="hard">어려움</option>
                  </select>
                </label>
              </div>
              <label>
                한 줄 평<input name="shortReview" maxLength={140} />
              </label>
              <label>
                리뷰
                <textarea
                  className="essay-editor compact-editor"
                  name="content"
                  required
                  maxLength={5000}
                />
              </label>
              <label>
                추천 대상
                <input name="recommendedFor" maxLength={300} />
              </label>
              <label className="check-label">
                <input type="checkbox" name="spoiler" /> 스포일러가 포함되어
                있어요
              </label>
              <Button type="submit">리뷰 남기기</Button>
            </form>
          </Card>
          <div className="content-list">
            {reviews.length ? (
              reviews.map((review) => (
                <Card key={review.id} className="content-card">
                  <header>
                    <Badge tone="rose">★ {review.rating}</Badge>
                    <strong>{review.profiles?.display_name ?? "독자"}</strong>
                  </header>
                  {review.contains_spoiler ? (
                    <details>
                      <summary>스포일러가 포함된 리뷰 보기</summary>
                      <p className="reading-copy">{review.content}</p>
                    </details>
                  ) : (
                    <p className="reading-copy">{review.content}</p>
                  )}
                  <footer>
                    <Button
                      variant="quiet"
                      className="button-small"
                      onClick={() => like(review)}
                    >
                      도움돼요 {review.likeCount}
                    </Button>
                    <ReportButton targetType="review" targetId={review.id} />
                  </footer>
                  <ReviewComments reviewId={review.id} />
                </Card>
              ))
            ) : (
              <Card>
                <EmptyState title="첫 리뷰를 기다려요.">
                  이 책을 읽고 발견한 생각을 남겨주세요.
                </EmptyState>
              </Card>
            )}
          </div>
        </section>
        <section>
          <h2>책별 토론</h2>
          <Card className="page-section">
            <form className="form-stack" onSubmit={createDiscussion}>
              <label>
                토론 제목
                <input name="title" required maxLength={160} />
              </label>
              <label>
                함께 생각할 질문
                <textarea
                  className="essay-editor compact-editor"
                  name="question"
                  required
                  maxLength={5000}
                />
              </label>
              <div className="button-row">
                <Button type="submit">토론 열기</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={generateDiscussion}
                >
                  AI 질문 제안
                </Button>
              </div>
            </form>
          </Card>
          <div className="content-list">
            {discussions.length ? (
              discussions.map((discussion) => (
                <Link
                  className="discussion-link"
                  href={`/discussions/${discussion.id}`}
                  key={discussion.id}
                >
                  <Badge tone="lavender">토론</Badge>
                  <h3>{discussion.title}</h3>
                  <p>{discussion.question}</p>
                </Link>
              ))
            ) : (
              <Card>
                <EmptyState title="아직 열린 토론이 없어요.">
                  하나의 답으로 끝나지 않는 질문을 열어보세요.
                </EmptyState>
              </Card>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
