import type { Metadata } from "next";
import { PageShell } from "@/components/ui/site-shell";
import { TasteTest } from "@/components/taste/taste-test";
export const metadata: Metadata = {
  title: "취향 테스트 · BOOKLEVEL",
  robots: { index: false, follow: false },
};
export default function TasteTestPage() {
  return (
    <PageShell
      active=""
      eyebrow="READING TASTE TEST"
      title="나에게 맞는 독서 취향을 알아보세요."
      description="정답은 없어요. 평소의 나와 가까운 정도를 편하게 골라주세요."
    >
      <TasteTest />
    </PageShell>
  );
}
