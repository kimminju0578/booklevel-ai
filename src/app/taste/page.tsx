import type { Metadata } from "next";
import { PageShell } from "@/components/ui/site-shell";
import { TasteLanding } from "@/components/taste/taste-landing";
export const metadata: Metadata = { title: "독서 취향 테스트 · BOOKLEVEL", description: "나는 어떤 독자일까요?" };
export default function TastePage() { return <PageShell active="" eyebrow="FIND YOUR READING TASTE" title="나는 어떤 독자일까?" description="정답이 없는 12개의 질문으로 나의 독서 취향을 알아보세요."><TasteLanding /></PageShell>; }
