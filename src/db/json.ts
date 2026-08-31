// helpers for cross-platform concerns
/**
 * knex's json column type round-trips as a native object on mysql2 but as a
 * raw string on better-sqlite3. Normalize both directions here so repositories
 * never need to know which driver is active.
 */
export function parseJsonColumn<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return JSON.parse(value) as T;
  return value as T;
}

export function serializeJsonColumn(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * `knex("t").insert(data, "id")` returns a bare id array (e.g. [1]) on
 * mysql2 and better-sqlite3's older RETURNING-less path, but pg (and newer
 * better-sqlite3) honor the returning hint and yield [{id: 1}] instead.
 * Normalize both shapes to the numeric id.
 */
export function extractInsertedId(result: Array<number | { id: number }>): number {
  const first = result[0];
  if (first === undefined) throw new Error("insert() returned no rows");
  return typeof first === "object" ? first.id : first;
}
