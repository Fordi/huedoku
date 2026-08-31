import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import type { Knex } from "knex";
import { createTestDb } from "../../../integration/helpers/testDb.ts";
import { parseSearchQuery } from "../../../../src/util/searchQuery/parser.ts";
import {
  compileSearchQuery,
  SearchQueryCompileError,
  type FieldMap,
} from "../../../../src/util/searchQuery/compile.ts";

interface Row {
  id: number;
  name: string;
  status: string;
  score: number;
}

const FIELDS: FieldMap = {
  name: { column: "name", type: "string" },
  status: {
    column: "status",
    type: "enum",
    values: ["pending", "running", "filing", "complete", "failed"],
  },
  score: { column: "score", type: "number" },
  completed_at: { column: "completed_at", type: "date" },
};

let knex: Knex;

describe("searchQuery.compile", () => {
  before(async () => {
    knex = await createTestDb();
    await knex.schema.createTable("search_query_fixture", (t) => {
      t.increments("id");
      t.string("name");
      t.string("status");
      t.integer("score");
      // A real knex `timestamp()` column, matching how this app's actual
      // date-ish columns (downloads.completed_at etc.) are declared - the
      // synthetic `dateTime()` column this test used before did not exhibit
      // the same driver-level storage/comparison behavior and masked a real
      // bug (see formatDateForComparison in compile.ts).
      t.timestamp("completed_at").nullable();
    });
  });

  after(async () => {
    await knex.destroy();
  });

  beforeEach(async () => {
    await knex("search_query_fixture").del();
  });

  interface SeedRow {
    name: string;
    status: string;
    score: number;
    /** Offset in seconds from `now` (negative = in the past); omit for a null completed_at. */
    completedAtOffsetSeconds?: number;
  }

  /**
   * Seeds rows the way this app's real code actually writes timestamp columns
   * - via a raw SQL `now`-relative expression, not a bound JS Date/ISO string
   * - so these tests exercise the exact storage representation
   * (knex.fn.now()-style) that broke silently in production. `now` fixes the
   * instant offsets are relative to, so the test's notion of "now" matches
   * whatever's passed to compileSearchQuery.
   */
  async function seed(rows: SeedRow[], now: Date): Promise<void> {
    for (const row of rows) {
      const [id] = await knex("search_query_fixture").insert({
        name: row.name,
        status: row.status,
        score: row.score,
      });
      if (row.completedAtOffsetSeconds !== undefined) {
        const at = new Date(now.getTime() + row.completedAtOffsetSeconds * 1000);
        // knex.fn.now() itself always means the real wall-clock instant, which
        // a fixed-`now` test can't control - insert the equivalent literal via
        // the DB's own datetime() function instead, at the exact offset we want.
        await knex.raw(
          "update search_query_fixture set completed_at = ? where id = ?",
          [
            at
              .toISOString()
              .replace("T", " ")
              .replace(/\.\d+Z$/, ""),
            id,
          ],
        );
      }
    }
  }

  async function query(search: string, now: Date = new Date()): Promise<string[]> {
    const ast = parseSearchQuery(search);
    const apply = compileSearchQuery(ast, FIELDS, knex, now);
    const rows = await knex<Row>("search_query_fixture").where(apply).orderBy("id");
    return rows.map((r) => r.name);
  }

  it("simple equality filters rows", async () => {
    const now = new Date();
    await seed(
      [
        { name: "a", status: "running", score: 1 },
        { name: "b", status: "failed", score: 2 },
      ],
      now,
    );
    assert.deepEqual(await query("status = 'failed'"), ["b"]);
  });

  it("'in' matches any of a set", async () => {
    const now = new Date();
    await seed(
      [
        { name: "a", status: "pending", score: 1 },
        { name: "b", status: "running", score: 2 },
        { name: "c", status: "complete", score: 3 },
      ],
      now,
    );
    assert.deepEqual(await query("status in ('pending', 'running')"), ["a", "b"]);
  });

  it("| (or) unions matches", async () => {
    const now = new Date();
    await seed(
      [
        { name: "a", status: "pending", score: 1 },
        { name: "b", status: "failed", score: 2 },
        { name: "c", status: "complete", score: 3 },
      ],
      now,
    );
    assert.deepEqual(await query("status = 'pending' | status = 'failed'"), [
      "a",
      "b",
    ]);
  });

  it("& (and) intersects matches", async () => {
    const now = new Date();
    await seed(
      [
        { name: "a", status: "complete", score: 100 },
        { name: "b", status: "complete", score: 1 },
        { name: "c", status: "running", score: 100 },
      ],
      now,
    );
    assert.deepEqual(await query("status = 'complete' & score > 50"), ["a"]);
  });

  it("! negates", async () => {
    const now = new Date();
    await seed(
      [
        { name: "a", status: "failed", score: 1 },
        { name: "b", status: "complete", score: 2 },
      ],
      now,
    );
    assert.deepEqual(await query("!(status = 'failed')"), ["b"]);
  });

  it("relative date literal resolves against the provided 'now', not wall-clock time, against a real timestamp() column written the way this app actually writes one", async () => {
    const now = new Date("2026-07-27T12:00:00Z");
    await seed(
      [
        {
          name: "recent",
          status: "complete",
          score: 1,
          completedAtOffsetSeconds: -30,
        }, // 30s before now
        {
          name: "old",
          status: "complete",
          score: 1,
          completedAtOffsetSeconds: -60 * 60,
        }, // 1h before now
      ],
      now,
    );
    assert.deepEqual(await query("completed_at > @-PT1M", now), ["recent"]);
  });

  it("the original target expression: in-flight + failed + completed in the last minute", async () => {
    const now = new Date("2026-07-27T12:00:00Z");
    await seed(
      [
        { name: "pending", status: "pending", score: 0 },
        { name: "running", status: "running", score: 0 },
        { name: "filing", status: "filing", score: 0 },
        { name: "failed", status: "failed", score: 0 },
        {
          name: "just-completed",
          status: "complete",
          score: 0,
          completedAtOffsetSeconds: -15,
        },
        {
          name: "long-completed",
          status: "complete",
          score: 0,
          completedAtOffsetSeconds: -60 * 60 * 2,
        },
      ],
      now,
    );
    const search =
      "status in ('pending', 'running', 'filing') | status = 'failed' | (status = 'complete' & completed_at > @-PT1M)";
    assert.deepEqual(await query(search, now), [
      "pending",
      "running",
      "filing",
      "failed",
      "just-completed",
    ]);
  });

  it("column-to-column comparison compiles and runs", async () => {
    const now = new Date();
    // Not meaningful for this fixture's columns type-wise other than proving
    // the mechanism works: compare a string column against another string column.
    await seed(
      [
        { name: "same", status: "same", score: 0 },
        { name: "diff", status: "other", score: 0 },
      ],
      now,
    );
    assert.deepEqual(await query("name = status"), ["same"]);
  });

  it("rejects an unknown field", () => {
    const ast = parseSearchQuery("bogus_field = 'x'");
    assert.throws(
      () => compileSearchQuery(ast, FIELDS, knex),
      SearchQueryCompileError,
    );
  });

  it("rejects comparing a string field to a number literal", () => {
    const ast = parseSearchQuery("name = 5");
    assert.throws(
      () => compileSearchQuery(ast, FIELDS, knex),
      SearchQueryCompileError,
    );
  });

  it("rejects comparing a date field to a string literal", () => {
    const ast = parseSearchQuery("completed_at = 'yesterday'");
    assert.throws(
      () => compileSearchQuery(ast, FIELDS, knex),
      SearchQueryCompileError,
    );
  });

  it("rejects an enum value outside its declared set", () => {
    const ast = parseSearchQuery("status = 'bogus-status'");
    assert.throws(
      () => compileSearchQuery(ast, FIELDS, knex),
      SearchQueryCompileError,
    );
  });

  it("rejects an enum value outside its declared set inside 'in (...)'", () => {
    const ast = parseSearchQuery("status in ('running', 'bogus-status')");
    assert.throws(
      () => compileSearchQuery(ast, FIELDS, knex),
      SearchQueryCompileError,
    );
  });

  it("rejects a field on the right-hand side of 'in (...)'", () => {
    const ast = parseSearchQuery("status in (name)");
    assert.throws(
      () => compileSearchQuery(ast, FIELDS, knex),
      SearchQueryCompileError,
    );
  });
});
