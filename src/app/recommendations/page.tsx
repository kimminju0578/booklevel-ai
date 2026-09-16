import type { Metadata } from "next";
import { PageShell } from "@/components/ui/site-shell";
import { RecommendationsClient } from "@/components/dashboard/recommendations-client";

export const metadata: Metadata = { title: "추천 도서 · BOOKLEVEL", robots: { index: false, follow: false } };

export default function RecommendationsPage() {
  return <PageShell active="추천" eyebrow="READY FOR YOUR NEXT CHAPTER" title="지금의 나에게, 다음 한 권." description="취향을 넘어 새로운 이해로 이어지는 책을 만나세요."><RecommendationsClient /></PageShell>;
}
