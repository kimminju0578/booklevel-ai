import type { Metadata } from "next";
import { DiscussionClient } from "@/components/community/discussion-client";
import { PageShell } from "@/components/ui/site-shell";
export const metadata:Metadata={title:"책 토론 · BOOKLEVEL"};
export default async function DiscussionPage({params}:{params:Promise<{discussionId:string}>}){return <PageShell active="커뮤니티" eyebrow="READ TOGETHER" title="근거로 이어가는 대화." description="다른 관점을 존중하며 생각을 더 멀리 확장해보세요."><DiscussionClient discussionId={(await params).discussionId}/></PageShell>}
