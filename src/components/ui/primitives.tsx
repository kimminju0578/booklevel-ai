import Link from "next/link";
import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, ReactNode } from "react";

export type Tone = "blue" | "sage" | "lavender" | "teal" | "sand" | "rose" | "terracotta";
type Variant = "primary" | "secondary" | "quiet";

export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={`button button--${variant} ${className}`} {...props} />;
}

export function ButtonLink({ href, children, variant = "primary", className = "" }: { href: string; children: ReactNode; variant?: Variant; className?: string }) {
  return <Link href={href} className={`button button--${variant} ${className}`}>{children}</Link>;
}

export function Card({ variant = "neutral", tone = "blue", className = "", ...props }: HTMLAttributes<HTMLDivElement> & { variant?: "neutral" | "soft" | "editorial"; tone?: Tone }) {
  return <div className={`card card--${variant} tone-${tone} ${className}`} {...props} />;
}

export function Badge({ tone = "blue", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge tone-${tone}`}>{children}</span>;
}

export function Progress({ value, max = 100, label, tone = "blue" }: { value: number | null; max?: number; label: string; tone?: Tone }) {
  const bounded = value === null || !Number.isFinite(value) ? null : Math.min(Math.max(0, value), max);
  const percent = bounded === null || max <= 0 ? 0 : bounded / max * 100;
  return <div className={`progress-group tone-${tone}`}>
    <div className="progress-label"><span>{label}</span><span>{bounded === null ? "아직 기록 없음" : `${bounded} / ${max}`}</span></div>
    <div className="progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={bounded ?? undefined} aria-valuetext={bounded === null ? "아직 기록 없음" : undefined}>
      <span className="progress-fill" style={{ width: `${percent}%` } as CSSProperties} />
    </div>
  </div>;
}

export function LevelBadge({ level }: { level: number | null }) {
  return <Badge tone="sand">{level === null ? "Level 미확인" : `Level ${level}`}</Badge>;
}

export function FitScore({ score }: { score: number | null }) {
  return <span className="fit-score">{score === null ? "진단 후 적합도 확인" : `적합도 ${Math.round(score * 100)}%`}</span>;
}

export function StatusBadge({ status }: { status: "want_to_read" | "reading" | "completed" | "paused" | null }) {
  const labels = { want_to_read: "읽고 싶어요", reading: "읽는 중", completed: "완독", paused: "잠시 쉬는 중" };
  return <Badge tone="sage">{status ? labels[status] : "독서 기록 없음"}</Badge>;
}

export function InsightCard({ title, children, tone = "blue" }: { title: string; children: ReactNode; tone?: Tone }) {
  return <Card variant="soft" tone={tone} className="insight-card"><span className="insight-symbol" aria-hidden="true">✧</span><div><h3>{title}</h3><div className="reading-copy">{children}</div></div></Card>;
}

export function EssayScore({ total }: { total: number | null }) {
  return <div className="essay-score"><strong>{total ?? "—"}</strong><span> / 100</span><p>학습 참고용 AI 평가</p></div>;
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-symbol" aria-hidden="true">⌑</span><h3>{title}</h3><div className="reading-copy">{children}</div>{action}</div>;
}
