import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/ui/site-shell";
import { categoryNames } from "@/components/assessment/screens";
import { DemoAssessment } from "@/components/demo/demo-assessment";

export const metadata: Metadata = { title: "진단 문항 · BOOKLEVEL", robots: { index: false, follow: false } };

export default async function QuizPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  const category = categoryNames[categorySlug];
  if (!category) notFound();
  return <PageShell active="" eyebrow="A MOMENT TO THINK" title={`${category} 분야 진단`} description="다른 사람의 속도보다, 지금의 나에게 집중하세요."><DemoAssessment category={category} categorySlug={categorySlug} /></PageShell>;
}
