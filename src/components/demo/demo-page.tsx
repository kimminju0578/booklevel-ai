import type { ReactNode } from "react";
import { books } from "@/lib/books";
import { Card, Badge, ButtonLink, InsightCard } from "@/components/ui/primitives";
import { BookCover } from "@/components/books/book-card";

const demos = [
  ["추천", "지금의 나에게, 다음 한 권.", "샘플 도서 후보를 둘러보고 독서 방향을 확인해보세요.", "/recommendations"],
  ["책 찾기", "궁금한 책을 찾아보세요.", "BOOKLEVEL 데모에 준비된 편집 도서부터 살펴보세요.", "/search"],
  ["논술", "내 생각을 AI와 함께 정리해보세요.", "OpenAI가 답안의 구조와 논리를 읽고 학습 피드백을 제공합니다.", "/essay"],
  ["내 서재", "읽고 싶은 책과 읽은 책.", "데모에서는 샘플 서재를 미리 확인할 수 있어요.", "/library"],
];

function DemoBookCard({ book, badge = "샘플 도서" }: { book: (typeof books)[number]; badge?: string }) {
  return <Card><div className="demo-book-cover">{book.coverUrl ? <BookCover book={book} eager /> : null}</div><Badge tone="teal">{badge}</Badge><h3 className="page-section">{book.title}</h3><p className="author">{book.author}</p><p className="reading-copy page-section">{book.description}</p></Card>;
}

export function DemoPage({ title, description, eyebrow = "BOOKLEVEL DEMO", children }: { title: string; description: string; eyebrow?: string; children?: ReactNode }) {
  return <section className="demo-page"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p className="reading-copy page-section">{description}</p>{children ?? <div className="demo-grid">{demos.map(([label, heading, copy, href]) => <Card key={href}><Badge tone="teal">{label}</Badge><h3 className="page-section">{heading}</h3><p className="reading-copy">{copy}</p><div className="button-row"><ButtonLink href={href} variant="secondary">둘러보기 →</ButtonLink></div></Card>)}</div>}</section>;
}

export function DemoRecommendations() {
  return <DemoPage title="지금의 나에게, 다음 한 권." description="Supabase 없이도 확인할 수 있는 BOOKLEVEL 샘플 추천입니다."><InsightCard tone="sage" title="검수된 책을 중심으로 읽어보세요."><p>실제 서비스에서는 독서 기록과 진단 결과를 연결해 추천을 개인화합니다.</p></InsightCard><div className="book-grid page-section">{books.map((book) => <DemoBookCard key={book.id} book={book} badge={`${book.category} · 데모 추천`} />)}</div></DemoPage>;
}

export function DemoLibrary() { return <DemoPage title="읽고 싶은 책과 읽은 책." description="샘플 서재입니다. 로그인과 Supabase를 연결하면 나만의 기록을 저장할 수 있어요."><div className="book-grid">{books.map((book) => <DemoBookCard key={book.id} book={book} badge="읽고 싶어요" />)}</div></DemoPage>; }

export function DemoCommunity() {
  const discussions = [
    ["정의란 무엇인가", "공정한 선택은 결과보다 과정에 가까울까요?", "관점 24개", "철학"],
    ["생각에 관한 생각", "빠른 판단을 믿어도 되는 순간은 언제인가요?", "관점 18개", "심리"],
    ["사피엔스", "기술은 우리를 더 자유롭게 만들고 있을까요?", "관점 12개", "역사"],
  ];
  return <DemoPage title="한 권의 책, 서로 다른 생각." description="책을 읽고 떠오른 질문과 관점을 나누는 샘플 커뮤니티입니다."><div className="community-demo-toolbar"><div><Badge tone="teal">COMMUNITY</Badge><strong>이번 주 많이 이야기한 주제</strong></div><ButtonLink href="/essay" variant="secondary">내 생각 쓰기 →</ButtonLink></div><div className="discussion-list">{discussions.map(([book, question, replies, category]) => <Card key={book}><div className="discussion-meta"><Badge tone="sage">{category}</Badge><span className="caption">{replies}</span></div><h3>{question}</h3><p className="author">{book}</p><p className="caption page-section">서로 다른 답을 존중하며 이야기해보세요.</p><ButtonLink href="/essay" variant="quiet">대화에 참여하기 →</ButtonLink></Card>)}</div></DemoPage>;
}

export function DemoHome() {
  return <section className="demo-home"><div className="demo-home-hero"><div><p className="eyebrow">YOUR READING SPACE</p><h2>읽는 만큼,<br /><span>생각의 폭이 넓어져요.</span></h2><p className="reading-copy">BOOKLEVEL은 지금의 나에게 맞는 책을 발견하고, 읽은 뒤의 생각까지 이어주는 독서 공간입니다.</p><div className="button-row"><ButtonLink href="/recommendations">다음 책 둘러보기 →</ButtonLink><ButtonLink href="/essay" variant="secondary">생각 써보기</ButtonLink></div></div><div className="demo-home-note"><span aria-hidden="true">✧</span><strong>오늘의 독서 질문</strong><p>이 책을 읽고 내가 새롭게 보게 된 것은 무엇인가요?</p></div></div><div className="summary-grid"><Card><span className="stat-label">현재 독서 레벨</span><strong className="stat-value">3.2</strong><Badge tone="sand">Level 3.2</Badge></Card><Card><span className="stat-label">읽고 있는 책</span><strong className="stat-value">1 <small>권</small></strong><Badge tone="sage">읽는 중</Badge></Card><Card><span className="stat-label">이번 달 완독</span><strong className="stat-value">4 <small>권</small></strong><span className="caption">꾸준히 쌓이는 기록</span></Card></div><section className="page-section"><div className="section-heading"><div><p className="eyebrow">CURATED FOR YOU</p><h2>다음에 읽을 세 권</h2></div><ButtonLink href="/recommendations" variant="quiet">전체 보기 →</ButtonLink></div><div className="book-grid page-section">{books.slice(0, 3).map((book) => <DemoBookCard key={book.id} book={book} badge={`${book.category} · 추천`} />)}</div></section></section>;
}

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
