// general form for repository tables
import type { Knex } from "knex";
import type { ConfigRow } from "../types.ts";
import { parseJsonColumn, serializeJsonColumn } from "../json.ts";

export function configRepository(knex: Knex) {
  return {
    async list(): Promise<
      Array<{ key: string; value: unknown; updated_at: string }>
    > {
      const rows = await knex<ConfigRow>("config").select("*");
      return rows.map((r) => ({
        key: r.key,
        value: parseJsonColumn(r.value, null),
        updated_at: r.updated_at,
      }));
    },

    async get(key: string): Promise<unknown | undefined> {
      const row = await knex<ConfigRow>("config").where({ key }).first();
      return row ? parseJsonColumn(row.value, null) : undefined;
    },

    async set(key: string, value: unknown): Promise<void> {
      const existing = await knex<ConfigRow>("config").where({ key }).first();
      if (existing) {
        await knex<ConfigRow>("config")
          .where({ key })
          .update({ value: serializeJsonColumn(value), updated_at: knex.fn.now() });
      } else {
        await knex<ConfigRow>("config").insert({
          key,
          value: serializeJsonColumn(value),
        });
      }
    },
  };
}

export type ConfigRepository = ReturnType<typeof configRepository>;
