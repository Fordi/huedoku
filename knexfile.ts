// config file for knex
import type { Knex } from "knex";
import { buildConnectionFromUrl } from "./src/db/connection.ts";

function connectionFromEnv(): Knex.Config {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Must specify a DATABASE_URL to run migrations (matches what the app itself requires - see docs/database.md)",
    );
  }
  return buildConnectionFromUrl(url);
}

const config: Record<string, Knex.Config> = {
  development: {
    ...connectionFromEnv(),
    migrations: { directory: "./migrations" },
    seeds: { directory: "./seeds/dev" },
  },
  production: {
    ...connectionFromEnv(),
    migrations: { directory: "./migrations" },
  },
  test: {
    client: "better-sqlite3",
    connection: { filename: ":memory:" },
    useNullAsDefault: true,
    migrations: { directory: "./migrations" },
  },
};

export default config;
