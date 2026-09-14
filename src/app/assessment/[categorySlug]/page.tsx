import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/ui/site-shell";
import { AssessmentPanel, categoryNames } from "@/components/assessment/screens";

export const metadata: Metadata = { title: "분야별 진단 · BOOKLEVEL", robots: { index: false, follow: false } };

export default async function AssessmentPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  const category = categoryNames[categorySlug];
  if (!category) notFound();
  return <PageShell active="" eyebrow="FIND YOUR STARTING POINT" title={`${category}, 나는 어디쯤 와 있을까요?`} description="현재의 이해를 살펴보고 다음에 배울 것을 발견해요."><AssessmentPanel category={category} slug={categorySlug} /></PageShell>;
}
