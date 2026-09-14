import { BadgeArt } from "./badge-art";

type BadgeDetail = {
  name: string;
  description: string;
  family: string;
  rarity: string;
  iconKey: string;
  key: string;
};

export function BadgeDetailModal({ badge, onClose }: { badge: BadgeDetail | null; onClose: () => void }) {
  if (!badge) return null;
  const condition = badge.key === "season_challenger" ? "활성 시즌 최종 Top 100" : badge.key.includes("rank") ? "해당 RP Tier 달성" : "활동 조건을 충족하면 자동 획득";
  return (
    <div className="badge-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="badge-modal" role="dialog" aria-modal="true" aria-labelledby="badge-modal-title">
        <button type="button" className="close-button" onClick={onClose} aria-label="훈장 상세 닫기">×</button>
        <BadgeArt family={badge.family} rarity={badge.rarity} iconKey={badge.iconKey} name={badge.name} size="lg" />
        <span className={`rarity-label rarity-label--${badge.rarity}`}>{badge.rarity}</span>
        <h2 id="badge-modal-title">{badge.name}</h2>
        <p className="reading-copy">{badge.description}</p>
        <div className="badge-detail-condition"><span>획득 조건</span><strong>{condition}</strong></div>
        <p className="caption">이 훈장은 BOOKLEVEL의 성장 기록에 귀속되며, 결제로 획득할 수 없습니다.</p>
      </section>
    </div>
  );
}
