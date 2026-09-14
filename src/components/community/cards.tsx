import { Badge, Card } from "@/components/ui/primitives";

export function DiscussionCard({ title, question, bookTitle, ai = false }: { title: string; question: string; bookTitle: string; ai?: boolean }) {
  return <Card variant="soft" tone={ai ? "blue" : "lavender"} className="content-card"><header><Badge tone={ai ? "blue" : "lavender"}>{ai ? "AI 토론 질문" : "함께 생각하기"}</Badge><span className="caption">{bookTitle}</span></header><h3>{title}</h3><p className="reading-copy">{question}</p><footer>서로 다른 관점에서, 생각을 더 넓게.</footer></Card>;
}

export function ReviewCard({ author, bookTitle, content, likes = 0 }: { author: string; bookTitle: string; content: string; likes?: number }) {
  return <Card className="content-card"><header><Badge tone="rose">감상평</Badge><span className="caption">{author}</span></header><h3>{bookTitle}</h3><p className="reading-copy">{content}</p><footer>공감 {likes}</footer></Card>;
}
