"use client";

import { useCallback, useState } from "react";
import { api, ClientApiError } from "@/lib/client/api";
import { useOnMount } from "@/lib/client/hooks";
import { Button, Card, EmptyState } from "@/components/ui/primitives";
import { Leaderboard } from "./leaderboard";

type RankingData = { season: { id: string; name: string; status: string; starts_at: string; ends_at: string } | null; rows: Array<{ rank: number; rating: number; profile: { id: string; display_name: string; avatar_url: string | null } | null; rankMark: { tier: string; challengerRank: number | null } | null }>; viewer: { rank: number; rating: number } | null };

export function RankingClient() {
  const [data, setData] = useState<RankingData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setState("loading");
    try { setData(await api<RankingData>("/api/ranking?limit=50")); setState("ready"); } catch (caught) { setMessage(caught instanceof ClientApiError ? caught.message : "랭킹을 불러오지 못했습니다."); setState("error"); }
  }, []);
  useOnMount(load);
  if (state === "loading") return <div className="skeleton-grid" aria-label="랭킹 불러오는 중"><i /><i /><i /></div>;
  if (state === "error") return <Card><EmptyState title="랭킹을 불러오지 못했어요." action={<Button variant="secondary" onClick={load}>다시 시도</Button>}>{message}</EmptyState></Card>;
  if (!data?.season) return <Card><EmptyState title="다음 시즌을 준비하고 있어요.">시즌이 시작되면 모두에게 공정한 출발선이 열립니다.</EmptyState></Card>;
  return <div className="ranking-layout"><Card className="season-intro"><p className="eyebrow">CURRENT SEASON</p><h2>{data.season.name}</h2><p className="reading-copy">활동의 양보다 읽고 생각한 깊이를 함께 쌓아보세요.</p><div className="season-dates">{new Date(data.season.starts_at).toLocaleDateString("ko-KR")} — {new Date(data.season.ends_at).toLocaleDateString("ko-KR")}</div>{data.viewer && <div className="viewer-rank"><span>나의 순위</span><strong>#{data.viewer.rank}</strong><small>{data.viewer.rating.toLocaleString("ko-KR")} RP</small></div>}</Card><Card><div className="section-heading"><div><p className="eyebrow">TOP READERS</p><h2>시즌 랭킹</h2></div><span className="caption">상위 100명은 Challenger 자격을 얻어요.</span></div><Leaderboard rows={data.rows} viewerRank={data.viewer?.rank} /></Card></div>;
}
