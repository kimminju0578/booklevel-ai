"use client";

import { useState, type ChangeEvent } from "react";
import Link from "next/link";
import type { Book } from "@/lib/books";
import { BookCover } from "./book-card";
import { Badge, FitScore, InsightCard, StatusBadge } from "@/components/ui/primitives";

export function BookDetails({ book, source, onSourceChange, compact = false }: { book: Book; source?: string; onSourceChange?: (source: string) => void; compact?: boolean }) {
  const [localSource, setLocalSource] = useState<string>();
  const [error, setError] = useState("");
  function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError("5MB 이하의 JPG, PNG, WebP 파일을 선택해주세요.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => { const result = String(reader.result); setLocalSource(result); onSourceChange?.(result); };
    reader.onerror = () => setError("파일을 읽지 못했습니다. 다시 선택해주세요.");
    reader.readAsDataURL(file);
  }
  return <div className={`book-detail ${compact ? "book-detail--compact" : ""}`}>
    <div className="detail-visual"><div className="detail-cover"><BookCover book={book} source={source || localSource} eager /></div><p className="caption">BOOKLEVEL EDITOR’S SHELF</p></div>
    <div className="detail-copy"><Badge tone="sage">{book.category}</Badge><h2>{book.title}</h2><p className="author">{book.author}</p><p className="reading-copy">{book.description}</p>
      <div className="detail-status"><StatusBadge status={null} /><FitScore score={null} /></div>
      <InsightCard title="왜 지금, 이 책일까요?"><p>분야별 진단을 마치면 현재 수준에 맞는 추천 이유와 읽을 방향을 확인할 수 있어요.</p></InsightCard>
      {!compact && <><div className="button-row"><Link className="button button--secondary" href="/search">실제 도서 검색</Link><Link className="button button--quiet" href="/login">로그인하고 기록하기</Link></div><p className="caption">이 화면은 에디터가 소개하는 샘플 미리보기입니다. 검색에서 연결한 실제 도서는 독서 상태를 저장할 수 있어요.</p></>}
      <details className="cover-settings"><summary>표지 이미지 바꾸기</summary><label className="upload-label">표지 이미지 선택<input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} /></label><p className="caption">JPG · PNG · WebP / 최대 5MB<br />현재 화면에서 미리보기로 적용됩니다.</p>{error && <p className="error-message" role="alert">{error}</p>}</details>
      {compact && <Link className="text-link" href={`/books/${book.id}`}>책 상세 페이지 <span aria-hidden="true">↗</span></Link>}
    </div>
  </div>;
}
