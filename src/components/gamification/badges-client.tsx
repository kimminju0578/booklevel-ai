"use client";

import { useCallback, useState } from "react";
import { api, ClientApiError } from "@/lib/client/api";
import { useOnMount } from "@/lib/client/hooks";
import { Button, Card, EmptyState } from "@/components/ui/primitives";
import { BadgeArt } from "./badge-art";
import { BadgeDetailModal } from "./badge-detail-modal";

type Badge = {
  id: string;
  key: string;
  name: string;
  description: string;
  family: string;
  rarity: string;
  icon_key: string;
  criteria: Record<string, unknown>;
};
type BadgeData = { badges: Badge[] };

export function BadgesClient() {
  const [data, setData] = useState<BadgeData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Badge | null>(null);
  const load = useCallback(async () => {
    setState("loading");
    try {
      setData(await api<BadgeData>("/api/badges"));
      setState("ready");
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "훈장 목록을 불러오지 못했습니다.",
      );
      setState("error");
    }
  }, []);
  useOnMount(load);
  if (state === "loading")
    return (
      <div className="skeleton-grid" aria-label="훈장 목록 불러오는 중">
        <i />
        <i />
        <i />
      </div>
    );
  if (state === "error")
    return (
      <Card>
        <EmptyState
          title="훈장 목록을 불러오지 못했어요."
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
  if (!data?.badges.length)
    return (
      <Card>
        <EmptyState title="아직 공개된 훈장이 없어요.">
          첫 번째 성취를 위한 여정이 곧 시작됩니다.
        </EmptyState>
      </Card>
    );
  return (
    <>
      <div className="badge-catalog-grid">
        {data.badges.map((badge) => (
          <button
            type="button"
            key={badge.id}
            className="card card--neutral badge-catalog-card"
            onClick={() => setSelected(badge)}
          >
            <BadgeArt
              family={badge.family}
              rarity={badge.rarity}
              iconKey={badge.icon_key}
              name={badge.name}
              size="lg"
            />
            <div>
              <span className={`rarity-label rarity-label--${badge.rarity}`}>
                {badge.rarity}
              </span>
              <h2>{badge.name}</h2>
              <p className="reading-copy">{badge.description}</p>
              <span className="badge-card-action">상세 보기 →</span>
            </div>
          </button>
        ))}
      </div>
      <BadgeDetailModal
        badge={
          selected
            ? {
                name: selected.name,
                description: selected.description,
                family: selected.family,
                rarity: selected.rarity,
                iconKey: selected.icon_key,
                key: selected.key,
              }
            : null
        }
        onClose={() => setSelected(null)}
      />
    </>
  );
}
