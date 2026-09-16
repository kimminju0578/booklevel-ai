import type { Metadata } from "next";
import { PageShell } from "@/components/ui/site-shell";
import { Badge, ButtonLink, Card } from "@/components/ui/primitives";
import { categoryNames } from "@/components/assessment/screens";

export const metadata: Metadata = {
  title: "분야별 진단 · BOOKLEVEL",
  description: "관심 있는 분야의 BookLevel을 확인합니다.",
};

export default function AssessmentIndexPage() {
  return (
    <PageShell
      active="진단"
      eyebrow="FIND YOUR STARTING POINT"
      title="어떤 분야부터 알아볼까요?"
      description="관심 있는 분야를 골라 현재의 이해를 살펴보고 다음 독서를 찾아보세요."
    >
      <section className="book-grid" aria-label="진단 분야">
        {Object.entries(categoryNames).map(([slug, name]) => (
          <Card key={slug}>
            <Badge tone="teal">BOOKLEVEL TEST</Badge>
            <h2 className="page-section">{name}</h2>
            <p className="reading-copy page-section">
              {name} 분야의 핵심 개념 이해 수준을 확인해 보세요.
            </p>
            <ButtonLink href={`/assessment/${slug}`} variant="secondary">
              {name} 진단 시작 →
            </ButtonLink>
          </Card>
        ))}
      </section>
    </PageShell>
  );
}
