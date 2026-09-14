import type { Metadata } from "next";
import { PageShell } from "@/components/ui/site-shell";
import { AssessmentResult } from "@/components/assessment/assessment-result";

export const metadata: Metadata = { title: "진단 결과 · BOOKLEVEL", robots: { index: false, follow: false } };

export default function ResultPage() {
  return <PageShell active="" eyebrow="YOUR KNOWLEDGE, IN PERSPECTIVE" title="지금의 이해, 다음의 가능성." description="알고 있는 것과 새롭게 알아갈 것을 함께 살펴보세요."><AssessmentResult /></PageShell>;
}
