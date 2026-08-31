import knexFactory, { type Knex } from "knex";
import path from "node:path";

export async function createTestDb(): Promise<Knex> {
  const knex = knexFactory({
    client: "better-sqlite3",
    connection: { filename: ":memory:" },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(import.meta.dirname, "../../../migrations"),
    },
  });
  await knex.migrate.latest();
  return knex;
}
