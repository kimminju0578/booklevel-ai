"use client";

import { useState } from "react";
import { books } from "@/lib/books";
import { BookCard } from "./book-card";

export function Catalog() {
  const [filter, setFilter] = useState("전체");
  return <><div className="filters" aria-label="분야 필터">{["전체", "경제", "철학", "심리"].map((category) => <button key={category} className="filter" aria-pressed={filter === category} onClick={() => setFilter(category)}>{category}</button>)}</div><div className="book-grid">{books.filter((book) => filter === "전체" || book.category === filter).map((book, index) => <BookCard key={book.id} book={book} number={index + 1} />)}</div></>;
}
