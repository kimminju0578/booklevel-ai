import type { Metadata } from "next";
import { PageShell } from "@/components/ui/site-shell";
import { DemoCoach } from "@/components/demo/demo-coach";

export const metadata: Metadata = { title: "나의 홈 · BOOKLEVEL", robots: { index: false, follow: false } };

export default function HomePage() {
  return <PageShell active="나의 홈" eyebrow="YOUR READING SPACE" title="오늘, 한 페이지 더 넓어지는 나." description="Supabase 없이도 바로 체험하는 OpenAI 독서 코치 데모."><DemoCoach /></PageShell>;
}
