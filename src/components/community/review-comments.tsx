"use client";
import { useState, type FormEvent } from "react";
import { api, ClientApiError } from "@/lib/client/api";
import { Button } from "@/components/ui/primitives";
import { RankMark } from "@/components/gamification/rank-mark";
type Comment = {
  id: string;
  content: string;
  profiles: { display_name: string } | null;
  rankMark: { tier: string; challengerRank: number | null } | null;
};
export function ReviewComments({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [message, setMessage] = useState("");
  async function load() {
    try {
      const data = await api<{ comments: Comment[] }>(
        `/api/reviews/${reviewId}/comments`,
      );
      setComments(data.comments);
      setOpen(true);
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "댓글을 불러오지 못했습니다.",
      );
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api(`/api/reviews/${reviewId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: form.get("content") }),
      });
      event.currentTarget.reset();
      await load();
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "댓글을 저장하지 못했습니다.",
      );
    }
  }
  return (
    <div className="comment-area">
      <Button
        variant="quiet"
        className="button-small"
        onClick={open ? () => setOpen(false) : load}
      >
        {open ? "댓글 닫기" : "댓글 보기"}
      </Button>
      {open && (
        <>
          <div className="comment-list">
            {comments.map((comment) => (
              <p key={comment.id}>
                <span className="author-line"><strong>{comment.profiles?.display_name ?? "독자"}</strong>{comment.rankMark && <RankMark tier={comment.rankMark.tier} challengerRank={comment.rankMark.challengerRank} size="sm" />}</span>
                {comment.content}
              </p>
            ))}
          </div>
          <form className="comment-form" onSubmit={submit}>
            <label className="sr-only" htmlFor={`comment-${reviewId}`}>
              댓글
            </label>
            <input
              id={`comment-${reviewId}`}
              name="content"
              required
              maxLength={5000}
              placeholder="댓글을 남겨보세요"
            />
            <Button type="submit" variant="secondary" className="button-small">
              등록
            </Button>
          </form>
        </>
      )}
      {message && (
        <p className="error-message" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
