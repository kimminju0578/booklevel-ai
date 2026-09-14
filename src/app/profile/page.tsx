import type { Metadata } from "next";
import { PageShell } from "@/components/ui/site-shell";
import { ProfileClient } from "@/components/dashboard/profile-client";
import { DemoPage } from "@/components/demo/demo-page";
import { configured } from "@/lib/server/env";

export const metadata: Metadata = { title: "프로필 · BOOKLEVEL", robots: { index: false, follow: false } };

export default function ProfilePage() {
  return <PageShell active="" eyebrow="GROW AT YOUR OWN PACE" title="책과 함께 쌓이는 나의 시간." description="완독의 숫자보다, 새롭게 알게 된 나의 생각을 기록해요.">{configured() ? <ProfileClient /> : <DemoPage title="나의 독서 프로필" description="데모 프로필입니다. 독서 기록과 관심 분야는 Supabase 연결 후 저장됩니다." />}</PageShell>;
}
