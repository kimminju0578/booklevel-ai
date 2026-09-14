import type { Metadata } from "next";
import { BadgesClient } from "@/components/gamification/badges-client";
import { PageShell } from "@/components/ui/site-shell";

export const metadata: Metadata = { title: "훈장 보관함 · BOOKLEVEL", description: "BOOKLEVEL에서 수집한 독서와 사고력 성장 훈장." };

export default function BadgesPage() {
  return <PageShell active="" eyebrow="THE TROPHY CABINET" title="성장의 흔적을 모아두는 곳." description="각 훈장은 읽고, 쓰고, 다시 생각한 한 장면을 기념합니다."><BadgesClient /></PageShell>;
}
