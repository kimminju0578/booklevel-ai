"use client";
import { useState, type FormEvent } from "react";
import { api, ClientApiError } from "@/lib/client/api";
import { useOnMount } from "@/lib/client/hooks";
import { Badge, Button, Card, EmptyState } from "@/components/ui/primitives";
import { RankMark } from "@/components/gamification/rank-mark";
type Post = {
  id: string;
  stance: "agree" | "disagree" | "neutral";
  content: string;
  parent_id: string | null;
  profiles: { display_name: string } | null;
  created_at: string;
  rankMark: { tier: string; challengerRank: number | null } | null;
};
type Detail = {
  discussion: {
    id: string;
    title: string;
    question: string;
    profiles: { display_name: string } | null;
    rankMark: { tier: string; challengerRank: number | null } | null;
  };
  posts: Post[];
};
const stanceLabel = { agree: "동의", disagree: "반대", neutral: "판단 보류" };
export function DiscussionClient({ discussionId }: { discussionId: string }) {
  const [data, setData] = useState<Detail | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const load = async () => {
    setState("loading");
    try {
      setData(await api<Detail>(`/api/discussions/${discussionId}`));
      setState("ready");
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "토론을 불러오지 못했습니다.",
      );
      setState("error");
    }
  };
  useOnMount(load);
  async function post(
    event: FormEvent<HTMLFormElement>,
    parentId: string | null = null,
  ) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api(`/api/discussions/${discussionId}/posts`, {
        method: "POST",
        body: JSON.stringify({
          stance: form.get("stance") || "neutral",
          content: form.get("content"),
          parentId,
        }),
      });
      event.currentTarget.reset();
      await load();
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "의견을 저장하지 못했습니다.",
      );
    }
  }
  if (state === "loading") return <div className="skeleton-panel" />;
  if (state === "error" || !data)
    return (
      <Card>
        <EmptyState
          title="토론을 불러오지 못했어요."
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
  const roots = data.posts.filter((post) => !post.parent_id);
  return (
    <>
      <Card variant="soft" tone="lavender">
        <Badge tone="lavender">열린 질문</Badge>
        <h2 className="page-section">{data.discussion.title}</h2>
        <p className="reading-copy">{data.discussion.question}</p>
      </Card>
      <Card className="page-section">
        <form className="form-stack" onSubmit={(event) => post(event)}>
          <label>
            나의 입장
            <select className="select-control" name="stance">
              <option value="agree">동의</option>
              <option value="disagree">반대</option>
              <option value="neutral">판단 보류</option>
            </select>
          </label>
          <label>
            근거가 담긴 의견
            <textarea
              className="essay-editor compact-editor"
              name="content"
              required
              maxLength={5000}
            />
          </label>
          <Button type="submit">의견 참여하기</Button>
        </form>
      </Card>
      {message && (
        <p className="error-message" role="alert">
          {message}
        </p>
      )}
      <div className="content-list page-section">
        {roots.length ? (
          roots.map((root) => (
            <Card className="content-card" key={root.id}>
              <header>
                <Badge
                  tone={
                    root.stance === "agree"
                      ? "sage"
                      : root.stance === "disagree"
                        ? "rose"
                        : "sand"
                  }
                >
                  {stanceLabel[root.stance]}
                </Badge>
                <span className="author-line"><strong>{root.profiles?.display_name ?? "독자"}</strong>{root.rankMark && <RankMark tier={root.rankMark.tier} challengerRank={root.rankMark.challengerRank} size="sm" />}</span>
              </header>
              <p className="reading-copy">{root.content}</p>
              {data.posts
                .filter((reply) => reply.parent_id === root.id)
                .map((reply) => (
                  <div className="reply" key={reply.id}>
                    <span className="author-line"><strong>{reply.profiles?.display_name ?? "독자"}</strong>{reply.rankMark && <RankMark tier={reply.rankMark.tier} challengerRank={reply.rankMark.challengerRank} size="sm" />}</span>
                    <p>{reply.content}</p>
                  </div>
                ))}
              <details className="reply-form">
                <summary>이 의견에 답하기</summary>
                <form
                  className="form-stack"
                  onSubmit={(event) => post(event, root.id)}
                >
                  <input type="hidden" name="stance" value="neutral" />
                  <label>
                    답글
                    <textarea
                      className="essay-editor compact-editor"
                      name="content"
                      required
                      maxLength={5000}
                    />
                  </label>
                  <Button type="submit" variant="secondary">
                    답글 남기기
                  </Button>
                </form>
              </details>
            </Card>
          ))
        ) : (
          <Card>
            <EmptyState title="첫 의견을 기다려요.">
              동의, 반대, 판단 보류 중 현재의 입장과 근거를 남겨보세요.
            </EmptyState>
          </Card>
        )}
      </div>
    </>
  );
}
