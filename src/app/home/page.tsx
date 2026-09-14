import type { Metadata } from "next";
import { PageShell } from "@/components/ui/site-shell";
import { HomeClient } from "@/components/dashboard/home-client";

export const metadata: Metadata = { title: "나의 홈 · BOOKLEVEL", robots: { index: false, follow: false } };

export default function HomePage() {
  return <PageShell active="나의 홈" eyebrow="YOUR READING SPACE" title="오늘, 한 페이지 더 넓어지는 나." description="책과 생각이 쌓이는 나만의 공간입니다."><HomeClient /></PageShell>;
}
