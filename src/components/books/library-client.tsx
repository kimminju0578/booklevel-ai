"use client";
import Link from "next/link";
import { useState } from "react";
import { api, ClientApiError } from "@/lib/client/api";
import { useOnMount } from "@/lib/client/hooks";
import {
  Button,
  Card,
  EmptyState,
  StatusBadge,
} from "@/components/ui/primitives";
type LibraryRow = {
  status: "want_to_read" | "reading" | "completed" | "paused";
  books: {
    id: string;
    title: string;
    authors: string[];
    cover_url: string | null;
  } | null;
};
export function LibraryClient() {
  const [rows, setRows] = useState<LibraryRow[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const load = async () => {
    setState("loading");
    try {
      const data = await api<{ books: LibraryRow[] }>("/api/library");
      setRows(data.books);
      setState("ready");
    } catch (caught) {
      setMessage(
        caught instanceof ClientApiError
          ? caught.message
          : "서재를 불러오지 못했습니다.",
      );
      setState("error");
    }
  };
  useOnMount(load);
  if (state === "loading")
    return (
      <div className="skeleton-grid">
        <i />
        <i />
        <i />
      </div>
    );
  if (state === "error")
    return (
      <Card>
        <EmptyState
          title="서재를 불러오지 못했어요."
          action={
            <Button variant="secondary" onClick={load}>
              다시 시도
            </Button>
          }
        >
          {message}
        </EmptyState>
      </Card>
    );
  if (!rows.length)
    return (
      <Card>
        <EmptyState
          title="아직 저장한 책이 없어요."
          action={
            <Link className="button button--secondary" href="/search">
              책 찾기
            </Link>
          }
        >
          읽고 싶은 책을 저장하면 이곳에 모입니다.
        </EmptyState>
      </Card>
    );
  return (
    <div className="library-list">
      {rows.map(
        (row) =>
          row.books && (
            <Link
              className="library-row"
              href={`/books/${row.books.id}`}
              key={row.books.id}
            >
              <div>
                <h2>{row.books.title}</h2>
                <p>{row.books.authors.join(", ") || "저자 정보 없음"}</p>
              </div>
              <StatusBadge status={row.status} />
            </Link>
          ),
      )}
    </div>
  );
}
