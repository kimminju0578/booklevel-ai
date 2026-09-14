import type { Metadata } from "next";
import { PageShell } from "@/components/ui/site-shell";
import { ProfileClient } from "@/components/dashboard/profile-client";

export const metadata: Metadata = { title: "프로필 · BOOKLEVEL", robots: { index: false, follow: false } };

export default function ProfilePage() {
  return <PageShell active="" eyebrow="GROW AT YOUR OWN PACE" title="책과 함께 쌓이는 나의 시간." description="완독의 숫자보다, 새롭게 알게 된 나의 생각을 기록해요."><ProfileClient /></PageShell>;
}
