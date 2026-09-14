import type { Metadata } from "next";
import { RankingClient } from "@/components/gamification/ranking-client";
import { PageShell } from "@/components/ui/site-shell";

export const metadata: Metadata = { title: "시즌 랭킹 · BOOKLEVEL", description: "읽고 생각한 깊이가 쌓이는 BOOKLEVEL 시즌 랭킹." };

export default function RankingPage() {
  return <PageShell active="" eyebrow="READ · THINK · GROW" title="이번 시즌, 어디까지 왔을까요?" description="책을 많이 읽는 것만으로는 충분하지 않아요. 이해하고, 쓰고, 다시 생각한 시간이 함께 반영됩니다."><RankingClient /></PageShell>;
}
