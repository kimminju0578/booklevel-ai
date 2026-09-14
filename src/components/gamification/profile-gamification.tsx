"use client";

import { useCallback, useState } from "react";
import { api, ClientApiError } from "@/lib/client/api";
import { useOnMount } from "@/lib/client/hooks";
import { Button, Card, EmptyState, Progress } from "@/components/ui/primitives";
import { BadgeArt } from "./badge-art";
import { RankMark } from "./rank-mark";
import { TrophyCabinet } from "./trophy-cabinet";

type RankData = {
  rating: number;
  tier: { key: string; label: string; division: string };
  nextTier: { key: string; label: string; minRating: number } | null;
  progressRatio: number;
  season: { id: string; name: string; rank: number | null } | null;
  equippedBadges: Array<{ slot: number; user_badges: { id: string; earned_at: string; badges: { key: string; name: string; family: string; rarity: string; icon_key: string } | null } | null }>;
};

type BadgeData = {
  owned: Array<{ id: string; earned_at: string; badges: { id: string; key: string; name: string; description: string; family: string; rarity: string; icon_key: string } | null }>;
  equipped: Array<{ slot: number; user_badge_id: string }>;
  total: number;
};

export function ProfileGamification() {
  const [rank, setRank] = useState<RankData | null>(null);
  const [badges, setBadges] = useState<BadgeData | null>(null);
  const [error, setError] = useState("");
  const [equipmentBusy, setEquipmentBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [rankResult, badgeResult] = await Promise.all([
        api<RankData>("/api/ranking/me"),
        api<BadgeData>("/api/profile/badges"),
      ]);
      setRank(rankResult);
      setBadges(badgeResult);
    } catch (caught) {
      setError(caught instanceof ClientApiError ? caught.message : "성장 기록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);
  useOnMount(load);

  if (loading) return <div className="skeleton-grid" aria-label="성장 기록 불러오는 중"><i /><i /></div>;
  if (error || !rank || !badges) return <Card><EmptyState title="성장 기록을 불러오지 못했어요." action={<Button variant="secondary" onClick={load}>다시 시도</Button>}>{error}</EmptyState></Card>;
  const nextGap = rank.nextTier ? Math.max(0, rank.nextTier.minRating - rank.rating) : 0;
  const ownedForCabinet = badges.owned.map((item) => ({ ...item, badges: item.badges && { ...item.badges, id: item.badges.id } })).filter((item): item is typeof item & { badges: NonNullable<typeof item.badges> } => Boolean(item.badges));
  const equippedIds = new Set(badges.equipped.map((item) => item.user_badge_id));
  async function toggleBadge(userBadgeId: string) {
    if (equipmentBusy) return;
    const nextIds = equippedIds.has(userBadgeId) ? [...equippedIds].filter((id) => id !== userBadgeId) : [...equippedIds, userBadgeId];
    if (nextIds.length > 3) { setError("대표 훈장은 최대 3개까지 장착할 수 있어요."); return; }
    setEquipmentBusy(true);
    setError("");
    try {
      const updated = await api<BadgeData>("/api/profile/badges/equip", { method: "POST", body: JSON.stringify({ items: nextIds.map((id, index) => ({ slot: index + 1, userBadgeId: id })) }) });
      setBadges(updated);
    } catch (caught) {
      setError(caught instanceof ClientApiError ? caught.message : "대표 훈장을 변경하지 못했습니다.");
    } finally { setEquipmentBusy(false); }
  }

  return (
    <div className="gamification-stack">
      <Card className="rank-hero-card">
        <div className="rank-hero-mark"><RankMark tier={rank.tier.key} challengerRank={rank.season?.rank} size="lg" showLabel /></div>
        <div className="rank-hero-copy">
          <p className="eyebrow">BOOKLEVEL RATING</p>
          <h2>{rank.tier.label}</h2>
          <p className="reading-copy">읽고, 쓰고, 다시 생각한 시간이 RP로 기록됩니다.</p>
          <strong className="rating-number">{rank.rating.toLocaleString("ko-KR")} <small>RP</small></strong>
          {rank.nextTier && <Progress label={`${rank.nextTier.label}까지 ${nextGap.toLocaleString("ko-KR")} RP`} value={rank.progressRatio * 100} max={100} tone="lavender" />}
        </div>
        <div className="rank-hero-season">
          <span>ACTIVE SEASON</span>
          <strong>{rank.season?.name ?? "시즌 준비 중"}</strong>
          <small>{rank.season?.rank ? `현재 ${rank.season.rank}위` : "아직 순위 없음"}</small>
        </div>
      </Card>
      <Card>
        <div className="section-heading">
          <div><p className="eyebrow">EQUIPPED</p><h2>대표 훈장</h2></div>
          <a className="text-link" href="/badges">전체 보기 →</a>
        </div>
        {badges.equipped.length ? <div className="equipped-badges">{badges.equipped.map((item) => { const badge = badges.owned.find((owned) => owned.id === item.user_badge_id)?.badges; return badge ? <div key={item.slot} className="equipped-badge"><BadgeArt family={badge.family} rarity={badge.rarity} iconKey={badge.icon_key} name={badge.name} size="md" /><span>{badge.name}</span></div> : null; })}</div> : <p className="reading-copy">획득한 훈장을 대표로 장착해 보세요.</p>}
        {badges.owned.length > 0 && <div className="equipment-picker"><p className="caption">대표 훈장 선택 · {badges.equipped.length} / 3</p><div className="equipment-options">{badges.owned.filter((item) => item.badges).map((item) => <button type="button" key={item.id} className={equippedIds.has(item.id) ? "equipment-option equipment-option--selected" : "equipment-option"} aria-pressed={equippedIds.has(item.id)} onClick={() => toggleBadge(item.id)} disabled={equipmentBusy}><BadgeArt family={item.badges?.family} rarity={item.badges?.rarity} iconKey={item.badges?.icon_key} name={item.badges?.name} size="sm" /><span>{item.badges?.name}</span></button>)}</div></div>}
        {error && <p className="error-message" role="alert">{error}</p>}
      </Card>
      <Card><TrophyCabinet badges={ownedForCabinet} total={badges.total} /></Card>
    </div>
  );
}
