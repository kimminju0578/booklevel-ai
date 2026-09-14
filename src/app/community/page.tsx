import type { Metadata } from "next";
import { PageShell } from "@/components/ui/site-shell";
import { CommunityClient } from "@/components/community/community-client";
import { DemoPage } from "@/components/demo/demo-page";
import { configured } from "@/lib/server/env";

export const metadata: Metadata = { title: "함께 읽기 · BOOKLEVEL" };

export default function CommunityPage() {
  return <PageShell active="커뮤니티" eyebrow="READ TOGETHER, THINK FURTHER" title="한 권의 책, 서로 다른 생각." description="읽고 난 뒤의 여운을 나누고, 나와 다른 관점을 만나세요.">{configured() ? <CommunityClient /> : <DemoPage title="한 권의 책, 서로 다른 생각." description="샘플 토론을 둘러보세요. 실제 댓글과 커뮤니티는 Supabase 연결 후 활성화됩니다." />}</PageShell>;
}
