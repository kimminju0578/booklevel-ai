"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Book } from "@/lib/books";
import { Badge } from "@/components/ui/primitives";

export function BookCover({ book, source, eager = false }: { book: Book; source?: string; eager?: boolean }) {
  const src = source || book.coverUrl;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return <div className="book-cover">
    <div className="cover-fallback" aria-hidden={failedSource !== src}><span>BOOKLEVEL LIBRARY</span><strong>{book.title}</strong><small>{book.author}</small></div>
    {failedSource !== src && <Image src={src} alt={`${book.title} 표지`} fill sizes="(max-width: 600px) 160px, 240px" unoptimized loading={eager ? "eager" : "lazy"} onError={() => setFailedSource(src)} />}
  </div>;
}

export function BookCard({ book, source, onOpen, number }: { book: Book; source?: string; onOpen?: () => void; number?: number }) {
  const preview = <>{number !== undefined && <span className="book-number">{String(number).padStart(2, "0")}</span>}<BookCover book={book} source={source} /><span className="preview-arrow" aria-hidden="true">↗</span></>;
  return <article className="book-card">
    {onOpen ? <button className="book-preview" aria-label={`${book.title} 상세보기`} onClick={onOpen}>{preview}</button> : <Link className="book-preview" href={`/books/${book.id}`} aria-label={`${book.title} 상세보기`}>{preview}</Link>}
    <div className="book-meta"><Badge tone="sage">{book.category}</Badge><h3>{book.title}</h3><p className="author">{book.author}</p><p className="book-description">{book.description}</p></div>
  </article>;
}
