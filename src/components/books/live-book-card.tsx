import Link from "next/link";
import Image from "next/image";
import { Badge, FitScore } from "@/components/ui/primitives";

export type LiveBook = {
  id: string;
  title: string;
  authors: string[];
  cover_url: string | null;
  description: string | null;
  publisher?: string | null;
};
export function LiveBookCard({
  book,
  score,
  reason,
}: {
  book: LiveBook;
  score?: number | null;
  reason?: string | null;
}) {
  return (
    <article className="book-card">
      <Link className="book-preview" href={`/books/${book.id}`}>
        <div className="book-cover">
          <div className="cover-fallback">
            <span>BOOKLEVEL LIBRARY</span>
            <strong>{book.title}</strong>
            <small>{book.authors.join(", ") || "저자 정보 없음"}</small>
          </div>
          {book.cover_url && (
            <Image
              src={book.cover_url}
              alt={`${book.title} 표지`}
              fill
              sizes="(max-width: 760px) 45vw, 240px"
              unoptimized
            />
          )}
        </div>
        <span className="preview-arrow" aria-hidden="true">
          ↗
        </span>
      </Link>
      <div className="book-meta">
        <div className="book-card-badges">
          <Badge tone="sage">맞춤 도서</Badge>
          <FitScore score={score ?? null} />
        </div>
        <h3>{book.title}</h3>
        <p className="author">{book.authors.join(", ") || "저자 정보 없음"}</p>
        <p className="book-description">
          {reason ||
            book.description ||
            "상세 페이지에서 도서 정보와 독자 리뷰를 확인하세요."}
        </p>
      </div>
    </article>
  );
}
