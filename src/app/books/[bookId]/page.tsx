import type { Metadata } from "next";
import { books } from "@/lib/books";
import { BookDetails } from "@/components/books/book-details";
import { PageShell } from "@/components/ui/site-shell";
import { ButtonLink, Card, EmptyState } from "@/components/ui/primitives";
import { DatabaseBookDetails } from "@/components/books/database-book-details";

export function generateStaticParams() { return books.map(({ id }) => ({ bookId: id })); }

export async function generateMetadata({ params }: { params: Promise<{ bookId: string }> }): Promise<Metadata> {
  const { bookId } = await params;
  const book = books.find(({ id }) => id === bookId);
  return { title: book ? `${book.title} · BOOKLEVEL` : "책을 찾을 수 없어요 · BOOKLEVEL", description: book?.description };
}

export default async function BookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = books.find(({ id }) => id === bookId);
  if (!book) return <PageShell active="책 찾기" eyebrow="A BOOK, A NEW PERSPECTIVE" title="한 권을 더 깊이 만나는 시간." description="책을 살펴보고, 나에게 필요한 읽기의 방향을 찾아보세요."><DatabaseBookDetails bookId={bookId}/></PageShell>;
  return <PageShell active="추천 도서" eyebrow="A BOOK, A NEW PERSPECTIVE" title="한 권을 더 깊이 만나는 시간." description="책을 살펴보고, 나에게 필요한 읽기의 방향을 찾아보세요.">
    <BookDetails book={book} />
    <section className="page-section"><h2>이 책을 읽고 나누는 생각</h2><Card><EmptyState title="아직 등록된 감상평이 없어요.">책에서 발견한 질문과 생각이 모일 공간이에요.</EmptyState><div className="button-row"><ButtonLink href="/community" variant="secondary">함께 읽기</ButtonLink><ButtonLink href="/essay" variant="quiet">논술 코치 알아보기 →</ButtonLink></div></Card></section>
  </PageShell>;
}
