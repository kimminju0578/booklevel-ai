import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/ui/site-shell";
import { TasteResult } from "@/components/taste/taste-result";
export const metadata: Metadata = { title: "나의 독서 취향 · BOOKLEVEL", robots: { index: false, follow: false } };
export default function TasteResultPage() { return <PageShell active="" eyebrow="YOUR READING TASTE" title="나의 독서 취향을 발견했어요." description="능력이 아니라, 어떤 책에 끌리는지에 대한 이야기입니다."><Suspense fallback={<div className="card"><p className="reading-copy">결과를 준비하고 있어요…</p></div>}><TasteResult /></Suspense></PageShell>; }
