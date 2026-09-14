import { readFile } from "node:fs/promises";
import { afterEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";

const databases: PGlite[] = [];

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.close()));
});

describe("catalog migration", () => {
  it("imports the same provider book idempotently", async () => {
    const database = new PGlite();
    databases.push(database);
    await database.exec(`
      create role anon;
      create role authenticated;
      create role service_role;
      create table public.books(
        id uuid primary key default gen_random_uuid(), isbn10 text, isbn13 text unique,
        title text not null, subtitle text, authors jsonb not null default '[]',
        publisher text, published_date date, description text, cover_url text,
        language text, page_count int, difficulty_level numeric(2,1),
        source_provider text, source_id text, metadata_quality text not null default 'provider',
        metadata_updated_at timestamptz, is_active boolean not null default true,
        created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
        unique(source_provider, source_id)
      );
      create table public.book_external_ids(
        book_id uuid not null references public.books on delete cascade,
        provider text not null,
        external_id text not null,
        primary key(provider, external_id)
      );
    `);
    const migration = await readFile(
      new URL("../../../supabase/migrations/202609110003_catalog.sql", import.meta.url),
      "utf8",
    );
    await database.exec(migration);

    const payload = JSON.stringify({
      isbn13: "9780135957059",
      title: "The Pragmatic Programmer",
      authors: ["David Thomas", "Andrew Hunt"],
      source_provider: "google",
      source_id: "provider-id-1",
    });
    const first = await database.query<{ import_book: string }>(
      "select public.import_book($1::jsonb)",
      [payload],
    );
    const second = await database.query<{ import_book: string }>(
      "select public.import_book($1::jsonb)",
      [payload],
    );
    const count = await database.query<{ count: number }>(
      "select count(*)::int as count from public.books",
    );

    expect(second.rows[0].import_book).toBe(first.rows[0].import_book);
    expect(count.rows[0].count).toBe(1);
  });
});
