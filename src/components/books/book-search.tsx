"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ClientApiError } from "@/lib/client/api";
import { Badge, Button, Card, EmptyState } from "@/components/ui/primitives";

type LocalBook = {
  id: string;
  title: string;
  authors: string[];
  publisher: string | null;
  cover_url: string | null;
  description: string | null;
  isbn13: string | null;
};
type ExternalBook = {
  title: string;
  authors: string[];
  publisher?: string;
  coverUrl?: string;
  description?: string;
  isbn13?: string;
  externalIds: { provider: "google" | "kakao" | "openlibrary"; id: string };
};
type SearchResult = {
  local: LocalBook[];
  external: ExternalBook[];
  warning: string | null;
};

function Cover({ src, title }: { src?: string | null; title: string }) {
  return (
    <div className="result-cover">
      {src ? (
        <Image src={src} alt={`${title} 표지`} fill sizes="112px" unoptimized />
      ) : (
        <span>{title.slice(0, 24)}</span>
      )}
    </div>
  );
}

export function BookSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [importing, setImporting] = useState("");
  async function search(event?: FormEvent) {
    event?.preventDefault();
    if (!query.trim()) return;
    setState("loading");
    setMessage("");
    try {
      setResult(
        await api<SearchResult>(
          `/api/books/search?q=${encodeURIComponent(query.trim())}`,
        ),
      );
      setState("idle");
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "검색하지 못했습니다.",
      );
      setState("error");
    }
  }
  async function importExternal(book: ExternalBook) {
    setImporting(`${book.externalIds.provider}:${book.externalIds.id}`);
    setMessage("");
    try {
      const data = await api<{ bookId: string }>("/api/books/import", {
        method: "POST",
        body: JSON.stringify({
          provider: book.externalIds.provider,
          externalId: book.externalIds.id,
        }),
      });
      router.push(`/books/${data.bookId}`);
    } catch (caught) {
      const error = caught instanceof ClientApiError ? caught : null;
      setMessage(
        error?.status === 401
          ? "외부 도서를 서재에 연결하려면 먼저 로그인해주세요."
          : error?.message || "도서를 가져오지 못했습니다.",
      );
      setImporting("");
    }
  }
  const total = (result?.local.length || 0) + (result?.external.length || 0);
  return (
    <>
      <form className="search-bar" onSubmit={search}>
        <label className="sr-only" htmlFor="book-query">
          책 제목, 저자 또는 ISBN
        </label>
        <input
          id="book-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="책 제목, 저자 또는 ISBN을 입력하세요"
          maxLength={120}
        />
        <Button type="submit" disabled={state === "loading"}>
          {state === "loading" ? "찾는 중…" : "검색"}
        </Button>
      </form>
      {message && (
        <p className="error-message" role="alert">
          {message}{" "}
          {state === "error" && (
            <button className="inline-button" onClick={() => search()}>
              다시 시도
            </button>
          )}
        </p>
      )}
      {result?.warning && <p className="notice-message">{result.warning}</p>}
      {result && total === 0 && (
        <Card>
          <EmptyState title="검색 결과가 없어요.">
            다른 제목이나 저자명, ISBN으로 다시 검색해보세요.
          </EmptyState>
        </Card>
      )}
      <div className="search-results">
        {result?.local.map((book) => (
          <article className="search-result" key={book.id}>
            <Cover src={book.cover_url} title={book.title} />
            <div>
              <Badge tone="sage">BOOKLEVEL 도서</Badge>
              <h2>{book.title}</h2>
              <p>
                {book.authors.join(", ") || "저자 정보 없음"}
                {book.publisher ? ` · ${book.publisher}` : ""}
              </p>
              <p className="reading-copy result-description">
                {book.description || "도서 소개가 아직 등록되지 않았습니다."}
              </p>
              <Link className="text-link" href={`/books/${book.id}`}>
                책 상세 보기 →
              </Link>
            </div>
          </article>
        ))}
        {result?.external.map((book) => {
          const key = `${book.externalIds.provider}:${book.externalIds.id}`;
          return (
            <article className="search-result" key={key}>
              <Cover src={book.coverUrl} title={book.title} />
              <div>
                <Badge tone="sand">외부 검색 결과</Badge>
                <h2>{book.title}</h2>
                <p>
                  {book.authors.join(", ") || "저자 정보 없음"}
                  {book.publisher ? ` · ${book.publisher}` : ""}
                </p>
                <p className="reading-copy result-description">
                  {book.description || "제공처에 등록된 도서 소개가 없습니다."}
                </p>
                <Button
                  variant="secondary"
                  onClick={() => importExternal(book)}
                  disabled={importing === key}
                >
                  {importing === key ? "연결 중…" : "BOOKLEVEL에 연결"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
