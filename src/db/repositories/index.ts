// export barrel
import type { Knex } from "knex";
import { usersRepository } from "./users.ts";
import { accessTokensRepository } from "./accessTokens.ts";
import { configRepository } from "./config.ts";

export function buildRepositories(knex: Knex) {
  return {
    users: usersRepository(knex),
    accessTokens: accessTokensRepository(knex),
    config: configRepository(knex),
  };
}

export type Repositories = ReturnType<typeof buildRepositories>;
