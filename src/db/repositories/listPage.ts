// pagination
import type { Knex } from "knex";

export interface ListPageOptions {
  size: number;
  page: number;
  sort?: string;
  since?: string;
}

export interface ListPage<Row> {
  rows: Row[];
  total: number;
}

/**
 * Parses a "field" or "field asc"/"field desc" sort string against an
 * allowlist of real columns (never interpolate the client-supplied field
 * name directly into a query) and applies it, defaulting to `defaultColumn`
 * descending when absent or not recognized.
 */
export function applySort<Row extends object>(
  query: Knex.QueryBuilder<Row>,
  sort: string | undefined,
  allowedColumns: Set<string>,
  defaultColumn: string,
  defaultDirection: "asc" | "desc" = "desc",
): Knex.QueryBuilder<Row> {
  const [field, direction] = (sort ?? "").trim().split(/\s+/);
  const column = field && allowedColumns.has(field) ? field : defaultColumn;
  const dir =
    direction === "asc" || direction === "desc" ? direction : defaultDirection;
  return query.orderBy(column, dir);
}

interface WithTotalCount {
  __total_count: string | number;
}

/**
 * Runs a single paged query against `base`, riding the full (unpaged) row
 * count along on each returned row via a `COUNT(*) OVER()` window function
 * rather than issuing a separate count query. The window-function column is
 * stripped back off before returning. Supported by sqlite, MySQL 8+, and
 * Postgres - the three DB backends this app targets.
 *
 * A page with zero rows (e.g. requesting past the last page) has nowhere to
 * carry the window-function total, so it reports total: 0 rather than
 * issuing a second query to recover the real count.
 */
export async function paginate<Row extends object>(
  base: Knex.QueryBuilder<Row>,
  options: ListPageOptions,
): Promise<ListPage<Row>> {
  const withCount = await base
    .clone()
    .select("*", base.client.raw("count(*) over () as __total_count"))
    .limit(options.size)
    .offset((options.page - 1) * options.size);

  const rows = withCount as (Row & WithTotalCount)[];
  const total = rows.length > 0 ? Number(rows[0]!.__total_count) : 0;
  return {
    rows: rows.map(({ __total_count, ...row }) => row as unknown as Row),
    total,
  };
}
