import type { Metadata } from "next";
import { PageShell } from "@/components/ui/site-shell";
import { TasteTest } from "@/components/taste/taste-test";
export const metadata: Metadata = { title: "취향 테스트 · BOOKLEVEL", robots: { index: false, follow: false } };
export default function TasteTestPage() { return <PageShell active="" eyebrow="READING TASTE TEST" title="나의 독서 취향을 찾아보세요." description="각 문장에서 나에게 더 가까운 쪽을 골라주세요."><TasteTest /></PageShell>; }
