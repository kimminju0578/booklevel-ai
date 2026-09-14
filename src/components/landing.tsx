"use client";

import { useRef, useState } from "react";
import { books, type Book } from "@/lib/books";
import { BookCard, BookCover } from "@/components/books/book-card";
import { BookDetails } from "@/components/books/book-details";
import { Badge, Button, ButtonLink, FitScore } from "@/components/ui/primitives";
import { SiteFooter, SiteHeader } from "@/components/ui/site-shell";

export default function Landing() {
  const [filter, setFilter] = useState("전체");
  const [selected, setSelected] = useState<string[]>([]);
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [covers, setCovers] = useState<Record<string, string>>({});
  const detailRef = useRef<HTMLDialogElement>(null);
  const interestRef = useRef<HTMLDialogElement>(null);

  function openBook(book: Book) {
    setActiveBook(book);
    detailRef.current?.showModal();
  }

  return <>
    <SiteHeader action={<Button variant="secondary" className="button-small" onClick={() => interestRef.current?.showModal()}>나의 북레벨 찾기 <span aria-hidden="true">↗</span></Button>} />
    <main id="main-content">
      <section className="shell hero-wrap">
        <div className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> A LITTLE FURTHER, ONE BOOK AT A TIME</p>
            <h1>지금의 나에게<br /><span>필요한 책</span>을 발견하세요.</h1>
            <p className="hero-description">현재 지식 수준을 분석해<br className="mobile-break" /> 다음 단계의 책을 추천합니다.</p>
            <Button onClick={() => interestRef.current?.showModal()}>내 수준에 맞는 책 찾기 <span aria-hidden="true">↗</span></Button>
            <p className="hero-note">10개의 질문 · 약 3분 · 나를 알아가는 작은 시작</p>
          </div>
          <div className="hero-library">
            <div className="hero-shelf-heading"><span>YOUR NEXT CHAPTER</span><Badge>추천 미리보기</Badge></div>
            <div className="hero-books">{books.slice(0, 2).map((book) => <button key={book.id} className="hero-book" onClick={() => openBook(book)} aria-label={book.title + " 상세보기"}><BookCover book={book} source={covers[book.title]} eager /><span className="hero-book-caption">{book.category} · {book.author}</span></button>)}</div>
            <div className="hero-shelf-note"><span aria-hidden="true">✧</span><div><strong>나의 다음 생각을 여는 한 권</strong><p><FitScore score={null} /></p></div></div>
          </div>
        </div>
        <div className="hero-bottom"><span>READ → THINK → GROW</span><p>취향에서 시작해, 새로운 지식으로 이어지는 독서.</p></div>
      </section>

      <section id="books" className="shell catalog">
        <div className="section-heading"><div><p className="eyebrow">THE EDITOR’S SHELF</p><h2>새로운 생각이 시작되는 책</h2><p>경제부터 철학까지, 관심 있는 분야를 가볍게 둘러보세요.</p></div><ButtonLink href="/recommendations" variant="quiet">추천 둘러보기 <span aria-hidden="true">↗</span></ButtonLink></div>
        <div className="filters" aria-label="관심 분야 필터">{["전체", "경제", "철학", "심리"].map((category) => <button key={category} aria-pressed={filter === category} className="filter" onClick={() => setFilter(category)}>{category}</button>)}</div>
        <div className="book-grid">{books.filter((book) => filter === "전체" || book.category === filter).map((book, index) => <BookCard key={book.id} book={book} source={covers[book.title]} onOpen={() => openBook(book)} number={index + 1} />)}</div>
      </section>

      <section id="how" className="shell">
        <div className="journey"><div className="journey-heading"><p className="eyebrow">FIND YOUR STARTING POINT</p><h2>나의 독서에도<br />출발점이 있으니까.</h2><p>어려운 시험이 아니에요.<br />나에게 맞는 책을 찾는 작은 탐색이에요.</p><ButtonLink href="/assessment/economics" variant="quiet">진단 알아보기 <span aria-hidden="true">→</span></ButtonLink></div>
          <div className="journey-steps">{[["01", "마음이 가는 분야를 골라요", "더 알고 싶은 분야를 최대 3개 선택해요."], ["02", "10개의 질문으로 나를 알아가요", "지금 알고 있는 것부터 천천히 확인해요."], ["03", "다음에 읽을 5권을 만나요", "왜 지금 이 책인지, 읽을 방향까지 함께 살펴요."]].map(([number, title, text]) => <div className="journey-step" key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></div>)}</div>
        </div>
      </section>
    </main>
    <SiteFooter />

    <dialog ref={detailRef} className="modal modal--book" aria-label={activeBook?.title || "책 상세"}><Button variant="quiet" className="close-button" aria-label="닫기" onClick={() => detailRef.current?.close()}>×</Button>{activeBook && <BookDetails key={activeBook.id} book={activeBook} source={covers[activeBook.title]} onSourceChange={(source) => setCovers((current) => ({ ...current, [activeBook.title]: source }))} compact />}</dialog>
    <dialog ref={interestRef} className="modal" aria-labelledby="interest-title"><Button variant="quiet" className="close-button" aria-label="닫기" onClick={() => interestRef.current?.close()}>×</Button><p className="eyebrow">MY FIRST CHAPTER</p><h2 id="interest-title">어떤 분야가<br />궁금한가요?</h2><p className="reading-copy">관심 분야를 최대 3개 골라주세요.</p>
      <div className="interest-grid">{["경제", "철학", "심리", "사회", "역사", "문학", "과학", "AI·기술"].map((category) => <button key={category} className="interest" aria-pressed={selected.includes(category)} onClick={() => setSelected((items) => items.includes(category) ? items.filter((item) => item !== category) : items.length < 3 ? [...items, category] : items)}>{category}<span aria-hidden="true">{selected.includes(category) ? "✓" : "+"}</span></button>)}</div>
      <p className="caption" aria-live="polite">{selected.length} / 3개 선택</p><Button className="full-width" disabled={!selected.length} onClick={() => { setFilter(selected.find((item) => ["경제", "철학", "심리"].includes(item)) || "전체"); interestRef.current?.close(); document.getElementById("books")?.scrollIntoView(); }}>관심 분야 책 둘러보기 <span aria-hidden="true">→</span></Button>
    </dialog>
  </>;
}
