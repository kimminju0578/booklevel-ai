import { describe, expect, it } from "vitest";
import { cleanText, coverUrl, deduplicate, isbn13, validISBN } from "./normalize";
import type { NormalizedBook } from "./types";

const book = (overrides: Partial<NormalizedBook> = {}): NormalizedBook => ({
  title: "The Pragmatic Programmer",
  authors: ["David Thomas", "Andrew Hunt"],
  publisher: "Addison-Wesley",
  publishedDate: "2019-09-13",
  language: "en",
  isbn13: "9780135957059",
  externalIds: { provider: "google", id: "abc" },
  ...overrides,
});

describe("book normalization", () => {
  it("sanitizes provider HTML and entities", () => {
    expect(cleanText("<b>Book</b>&nbsp;&amp; notes")).toBe("Book & notes");
  });

  it("validates ISBN checksums and converts ISBN-10", () => {
    expect(validISBN("978-0-13-595705-9")).toBe("9780135957059");
    expect(isbn13("0135957052")).toBe("9780135957059");
    expect(validISBN("9780135957058")).toBeUndefined();
  });

  it("deduplicates the same book across providers by ISBN", () => {
    const books = [
      book(),
      book({ externalIds: { provider: "kakao", id: "different" } }),
    ];
    expect(deduplicate(books)).toHaveLength(1);
  });

  it("upgrades safe cover URLs and rejects non-web protocols", () => {
    expect(coverUrl("http://covers.example/book.jpg")).toBe(
      "https://covers.example/book.jpg",
    );
    expect(coverUrl("javascript:alert(1)")).toBeUndefined();
  });
});
