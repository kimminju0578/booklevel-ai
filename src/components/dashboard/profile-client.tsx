"use client";
import Link from "next/link";
import { useState } from "react";
import { api, ClientApiError } from "@/lib/client/api";
import { useOnMount } from "@/lib/client/hooks";
import {
  Button,
  Card,
  EmptyState,
  LevelBadge,
  Progress,
} from "@/components/ui/primitives";
import { ProfileGamification } from "@/components/gamification/profile-gamification";
type ProfileData = {
  profile: { display_name: string; created_at: string };
  levels: {
    category_id: string;
    level: number;
    categories: { name: string; slug: string } | null;
  }[];
  counts: { reading: number; completed: number; want_to_read: number };
};
export function ProfileClient() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [name, setName] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "saving" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const load = async () => {
    setState("loading");
    try {
      const result = await api<ProfileData>("/api/profile");
      setData(result);
      setName(result.profile.display_name);
      setState("ready");
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "프로필을 불러오지 못했습니다.",
      );
      setState("error");
    }
  };
  useOnMount(load);
  async function save() {
    setState("saving");
    try {
      const result = await api<ProfileData>("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ displayName: name }),
      });
      setData(result);
      setState("ready");
      setMessage("이름을 저장했습니다.");
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "저장하지 못했습니다.",
      );
      setState("ready");
    }
  }
  if (state === "loading")
    return (
      <div className="skeleton-grid">
        <i />
        <i />
      </div>
    );
  if (state === "error" || !data)
    return (
      <Card>
        <EmptyState
          title="프로필을 불러오지 못했어요."
          action={
            <Link className="button button--secondary" href="/login">
              로그인
            </Link>
          }
        >
          {message}
        </EmptyState>
      </Card>
    );
  return (
    <>
      <Card>
        <div className="profile-heading">
          <span className="profile-avatar" aria-hidden="true">
            {data.profile.display_name.slice(0, 1)}
          </span>
          <div>
            <h2>{data.profile.display_name}님의 독서 프로필</h2>
            <p className="reading-copy">
              가입일{" "}
              {new Date(data.profile.created_at).toLocaleDateString("ko-KR")}
            </p>
          </div>
        </div>
        <div className="profile-edit">
          <label>
            표시 이름
            <input
              value={name}
              maxLength={30}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <Button
            variant="secondary"
            onClick={save}
            disabled={state === "saving" || !name.trim()}
          >
            {state === "saving" ? "저장 중…" : "이름 저장"}
          </Button>
        </div>
        {message && (
          <p className="notice-message" role="status">
            {message}
          </p>
        )}
      </Card>
      <div className="two-columns page-section">
        <Card>
          <h2>분야별 BOOKLEVEL</h2>
          {data.levels.length ? (
            <div className="page-section">
              {data.levels.map((level) => (
                <div className="level-row" key={level.category_id}>
                  <span>{level.categories?.name ?? "분야"}</span>
                  <LevelBadge level={Number(level.level)} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="진단 기록이 없어요."
              action={
                <Link className="button button--secondary" href="/onboarding">
                  첫 진단 시작
                </Link>
              }
            >
              관심 분야를 선택해 현재 출발점을 확인해보세요.
            </EmptyState>
          )}
        </Card>
        <Card>
          <h2>나의 독서 흐름</h2>
          <div className="page-section">
            <Progress
              label="읽고 싶은 책"
              value={data.counts.want_to_read}
              max={Math.max(
                1,
                data.counts.want_to_read +
                  data.counts.reading +
                  data.counts.completed,
              )}
            />
            <Progress
              label="읽는 중"
              value={data.counts.reading}
              max={Math.max(
                1,
                data.counts.want_to_read +
                  data.counts.reading +
                  data.counts.completed,
              )}
              tone="sage"
            />
            <Progress
              label="완독"
              value={data.counts.completed}
              max={Math.max(
                1,
                data.counts.want_to_read +
                  data.counts.reading +
                  data.counts.completed,
              )}
              tone="teal"
            />
          </div>
        </Card>
      </div>
      <section className="page-section">
        <ProfileGamification />
      </section>
    </>
  );
}
