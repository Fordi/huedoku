// users table
import type { Knex } from "knex";
import type { Role, UserRow } from "../types.ts";
import { extractInsertedId } from "../json.ts";

export interface UpsertGithubUserInput {
  github_id: string;
  github_login: string;
  display_name: string | null;
  avatar_url: string | null;
  default_role: Role;
}

export function usersRepository(knex: Knex) {
  return {
    async findById(id: number): Promise<UserRow | undefined> {
      return knex<UserRow>("users").where({ id }).first();
    },

    async findByGithubId(githubId: string): Promise<UserRow | undefined> {
      return knex<UserRow>("users").where({ github_id: githubId }).first();
    },

    async upsertFromGithub(input: UpsertGithubUserInput): Promise<UserRow> {
      const existing = await knex<UserRow>("users")
        .where({ github_id: input.github_id })
        .first();
      if (existing) {
        await knex<UserRow>("users").where({ id: existing.id }).update({
          github_login: input.github_login,
          display_name: input.display_name,
          avatar_url: input.avatar_url,
          updated_at: knex.fn.now(),
        });
        return {
          ...existing,
          github_login: input.github_login,
          display_name: input.display_name,
          avatar_url: input.avatar_url,
        };
      }
      const inserted = await knex<UserRow>("users").insert(
        {
          github_id: input.github_id,
          github_login: input.github_login,
          display_name: input.display_name,
          avatar_url: input.avatar_url,
          role: input.default_role,
        },
        "id",
      );
      const id = extractInsertedId(inserted);
      const created = await knex<UserRow>("users").where({ id }).first();
      if (!created) throw new Error("failed to load user after insert");
      return created;
    },
  };
}

export type UsersRepository = ReturnType<typeof usersRepository>;
