import type { Metadata } from "next";
import { PageShell } from "@/components/ui/site-shell";
import { EssayWorkspace } from "@/components/essay/essay-workspace";
import { InsightCard } from "@/components/ui/primitives";
import { DemoCoach } from "@/components/demo/demo-coach";
import { configured } from "@/lib/server/env";

export const metadata: Metadata = { title: "논술 코치 · BOOKLEVEL", robots: { index: false, follow: false } };

export default function EssayPage() {
  return <PageShell active="논술" eyebrow="A QUIET SPACE FOR YOUR THOUGHTS" title="생각을 문장으로, 문장을 더 깊게." description="질문에 답하고, 피드백을 바탕으로 다시 써보세요.">{configured() ? <><InsightCard tone="teal" title="점수보다 성장의 방향을 봅니다."><p>AI 평가는 학습 참고 정보이며 공식 시험 결과가 아닙니다.</p></InsightCard><div className="page-section"><EssayWorkspace /></div></> : <DemoCoach />}</PageShell>;
}
