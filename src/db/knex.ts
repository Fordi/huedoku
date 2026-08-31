// knex connection management
import knexFactory, { type Knex } from "knex";
import type { AppConfig } from "../config/env.ts";
import { buildConnectionFromUrl } from "./connection.ts";

let instance: Knex | undefined;

function buildConnection(env: AppConfig): Knex.Config {
  if (!env.DATABASE_URL) {
    throw new Error("Must specify a DATABASE_URL");
  }
  return buildConnectionFromUrl(env.DATABASE_URL);
}

export function getKnex(env?: AppConfig): Knex {
  if (!instance) {
    if (!env)
      throw new Error(
        "getKnex() called before initialization; pass env on first call",
      );
    instance = knexFactory(buildConnection(env));
  }
  return instance;
}

export function setKnexForTests(k: Knex): void {
  instance = k;
}

export async function closeKnex(): Promise<void> {
  if (instance) {
    await instance.destroy();
    instance = undefined;
  }
}
