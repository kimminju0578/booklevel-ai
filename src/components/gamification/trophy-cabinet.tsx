import { BadgeArt } from "./badge-art";

type OwnedBadge = {
  id: string;
  earned_at: string;
  badges: {
    id: string;
    key: string;
    name: string;
    description: string;
    family: string;
    rarity: string;
    icon_key: string;
  } | null;
};

export function TrophyCabinet({ badges, total }: { badges: OwnedBadge[]; total: number }) {
  return (
    <section className="trophy-cabinet" aria-labelledby="trophy-cabinet-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">COLLECTIBLE INSIGNIA</p>
          <h2 id="trophy-cabinet-title">나의 훈장 보관함</h2>
        </div>
        <span className="cabinet-count">{badges.length} / {total || "—"}</span>
      </div>
      {badges.length ? (
        <div className="trophy-grid">
          {badges.map((badge) => badge.badges && (
            <article className="trophy-item" key={badge.id}>
              <BadgeArt family={badge.badges.family} rarity={badge.badges.rarity} iconKey={badge.badges.icon_key} name={badge.badges.name} size="sm" />
              <div>
                <h3>{badge.badges.name}</h3>
                <p>{badge.badges.description}</p>
                <small>{new Date(badge.earned_at).toLocaleDateString("ko-KR")} 획득</small>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="reading-copy">첫 완독을 기록하면 첫 번째 훈장이 이곳에 놓여요.</p>
      )}
    </section>
  );
}
