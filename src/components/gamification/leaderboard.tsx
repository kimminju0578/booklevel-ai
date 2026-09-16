import Link from "next/link";
import { Badge, Card, EmptyState } from "@/components/ui/primitives";
import { RankMark } from "./rank-mark";

type RankingRow = {
  rank: number;
  rating: number;
  profile: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  rankMark: { tier: string; challengerRank: number | null } | null;
};

export function Leaderboard({
  rows,
  viewerRank,
  compact = false,
}: {
  rows: RankingRow[];
  viewerRank?: number | null;
  compact?: boolean;
}) {
  if (!rows.length)
    return (
      <Card>
        <EmptyState title="아직 이번 시즌 기록이 없어요.">
          첫 활동을 시작하면 이곳에 성장의 흔적이 쌓입니다.
        </EmptyState>
      </Card>
    );
  return (
    <div className={`leaderboard ${compact ? "leaderboard--compact" : ""}`}>
      {rows.map((row) => {
        return (
          <div
            className={`leaderboard-row ${row.rank <= 3 ? `leaderboard-row--top-${row.rank}` : ""} ${viewerRank === row.rank ? "leaderboard-row--viewer" : ""}`}
            key={`${row.rank}-${row.profile?.id ?? "anonymous"}`}
          >
            <span className="leaderboard-rank">
              {row.rank.toString().padStart(2, "0")}
            </span>
            {row.rankMark ? (
              <RankMark
                tier={row.rankMark.tier}
                challengerRank={row.rankMark.challengerRank}
                size={row.rank <= 3 ? "md" : "sm"}
              />
            ) : (
              <span className="rank-mark-placeholder" aria-hidden="true" />
            )}
            <div className="leaderboard-person">
              <strong>{row.profile?.display_name ?? "익명의 독자"}</strong>
              <span>{row.rating.toLocaleString("ko-KR")} RP</span>
            </div>
            {row.rank <= 100 && (
              <Badge tone={row.rank <= 3 ? "sand" : "blue"}>
                {row.rank <= 3 ? "Top 3" : "Top 100"}
              </Badge>
            )}
          </div>
        );
      })}
      {!compact && (
        <Link className="text-link" href="/badges">
          획득한 훈장과 시즌 기록 보기 →
        </Link>
      )}
    </div>
  );
}
