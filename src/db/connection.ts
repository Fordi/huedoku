// build connection objects from connection strings
import { resolve } from "node:path";
import type { Knex } from "knex";
import { NodeSQLite } from "./NodeSqlite.ts";

const PROTOCOL_TO_CLIENT: Record<string, "mysql2" | "pg"> = {
  "mysql:": "mysql2",
  "mysql2:": "mysql2",
  "postgres:": "pg",
  "postgresql:": "pg",
  "pg:": "pg",
};

const DEFAULT_PORTS: Record<string, number> = {
  mysql2: 3306,
  pg: 5432,
};

/**
 * Builds a knex connection config purely from a DATABASE_URL string, so the
 * running app (src/db/knex.ts) and the knex CLI (knexfile.ts) always agree
 * on which database they're pointed at instead of drifting between two
 * separate env-var schemes.
 *
 *   ":memory:"        -> better-sqlite3, in-memory
 *   "./x" / "../x"     -> better-sqlite3, file path relative to cwd
 *   anything else       -> parsed as a URL; the protocol selects the knex
 *                          client (mysql/mysql2 -> mysql2, postgres(ql)/pg -> pg)
 */
export function buildConnectionFromUrl(url: string): Knex.Config {
  if (url === ":memory:") {
    return {
      client: NodeSQLite,
      connection: { filename: ":memory:" },
      useNullAsDefault: true,
    };
  }
  if (/^\.{1,2}\//.test(url)) {
    const filename = resolve(process.cwd(), url);
    return {
      client: NodeSQLite,
      connection: { filename },
      useNullAsDefault: true,
    };
  }

  const parsed = new URL(url);
  const client = PROTOCOL_TO_CLIENT[parsed.protocol];
  if (!client) {
    throw new Error(
      `Unsupported DATABASE_URL scheme "${parsed.protocol}" - expected mysql(2):// or postgres(ql)://, or a ":memory:"/relative-path sqlite value`,
    );
  }
  if (parsed.port === "" && client in DEFAULT_PORTS) {
    parsed.port = String(DEFAULT_PORTS[client]);
  }
  return { client, connection: parsed.toString() };
}
