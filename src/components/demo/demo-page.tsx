import type { ReactNode } from "react";
import { books } from "@/lib/books";
import { Card, Badge, ButtonLink, InsightCard } from "@/components/ui/primitives";

const demos = [
  ["추천", "지금의 나에게, 다음 한 권.", "샘플 도서 후보를 둘러보고 독서 방향을 확인해보세요.", "/recommendations"],
  ["책 찾기", "궁금한 책을 찾아보세요.", "BOOKLEVEL 데모에 준비된 편집 도서부터 살펴보세요.", "/search"],
  ["논술", "내 생각을 AI와 함께 정리해보세요.", "OpenAI가 답안의 구조와 논리를 읽고 학습 피드백을 제공합니다.", "/essay"],
  ["내 서재", "읽고 싶은 책과 읽은 책.", "데모에서는 샘플 서재를 미리 확인할 수 있어요.", "/library"],
];

export function DemoPage({ title, description, eyebrow = "BOOKLEVEL DEMO", children }: { title: string; description: string; eyebrow?: string; children?: ReactNode }) {
  return <section className="demo-page"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p className="reading-copy page-section">{description}</p>{children ?? <div className="demo-grid">{demos.map(([label, heading, copy, href]) => <Card key={href}><Badge tone="teal">{label}</Badge><h3 className="page-section">{heading}</h3><p className="reading-copy">{copy}</p><div className="button-row"><ButtonLink href={href} variant="secondary">둘러보기 →</ButtonLink></div></Card>)}</div>}</section>;
}

export function DemoRecommendations() {
  return <DemoPage title="지금의 나에게, 다음 한 권." description="Supabase 없이도 확인할 수 있는 BOOKLEVEL 샘플 추천입니다."><InsightCard tone="sage" title="검수된 책을 중심으로 읽어보세요."><p>실제 서비스에서는 독서 기록과 진단 결과를 연결해 추천을 개인화합니다.</p></InsightCard><div className="book-grid page-section">{books.map((book) => <Card key={book.id}><Badge tone="sand">{book.category}</Badge><h3 className="page-section">{book.title}</h3><p className="author">{book.author}</p><p className="reading-copy page-section">{book.description}</p><span className="fit-score">데모 추천 · 85%</span></Card>)}</div></DemoPage>;
}

export function DemoLibrary() { return <DemoPage title="읽고 싶은 책과 읽은 책." description="샘플 서재입니다. 로그인과 Supabase를 연결하면 나만의 기록을 저장할 수 있어요."><div className="book-grid">{books.map((book) => <Card key={book.id}><Badge tone="sage">읽고 싶어요</Badge><h3 className="page-section">{book.title}</h3><p className="author">{book.author}</p></Card>)}</div></DemoPage>; }

export function DemoRanking() {
  const rows = [
    ["01", "책갈피 수집가", "1,240 RP", "논술 8회 · 완독 12권"],
    ["02", "문장 사이의 독자", "1,080 RP", "논술 6회 · 완독 10권"],
    ["03", "깊이 읽는 사람", "960 RP", "논술 5회 · 완독 8권"],
    ["04", "오늘도 한 페이지", "820 RP", "논술 3회 · 완독 7권"],
    ["05", "생각을 모으는 독자", "740 RP", "논술 2회 · 완독 6권"],
  ];
  return <DemoPage title="이번 시즌, 어디까지 왔을까요?" description="읽고 생각한 깊이가 쌓이는 BOOKLEVEL 시즌 랭킹 샘플입니다."><Card className="ranking-table"><div className="section-heading"><h3>SEASON 01 · DEMO</h3><Badge tone="teal">이번 주</Badge></div>{rows.map(([rank, name, points, activity]) => <div className="ranking-row" key={rank}><strong>{rank}</strong><div><h3>{name}</h3><p className="caption">{activity}</p></div><span>{points}</span></div>)}</Card></DemoPage>;
}
