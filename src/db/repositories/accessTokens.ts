// API tokens table
import type { Knex } from "knex";
import type { AccessTokenRow } from "../types.ts";
import { extractInsertedId } from "../json.ts";
import {
  applySort,
  paginate,
  type ListPage,
  type ListPageOptions,
} from "./listPage.ts";
import { parseSearchQuery } from "../../util/searchQuery/parser.ts";
import {
  compileSearchQuery,
  type FieldMap,
} from "../../util/searchQuery/compile.ts";

const SORTABLE_COLUMNS = new Set(["label", "created_at", "last_used_at"]);

/** Fields the `search` query language may reference for an access-tokens listing - the allowlist compileSearchQuery validates against, never derived from client input. */
const SEARCH_FIELDS: FieldMap = {
  label: { column: "label", type: "string" },
  user_id: { column: "user_id", type: "number" },
  token_prefix: { column: "token_prefix", type: "string" },
  created_at: { column: "created_at", type: "date" },
  last_used_at: { column: "last_used_at", type: "date" },
};

export function accessTokensRepository(knex: Knex) {
  return {
    async create(input: {
      user_id: number;
      label: string;
      token_hash: string;
      token_prefix: string;
    }): Promise<AccessTokenRow> {
      const inserted = await knex<AccessTokenRow>("access_tokens").insert(
        {
          user_id: input.user_id,
          label: input.label,
          token_hash: input.token_hash,
          token_prefix: input.token_prefix,
        },
        "id",
      );
      const id = extractInsertedId(inserted);
      const created = await knex<AccessTokenRow>("access_tokens")
        .where({ id })
        .first();
      if (!created) throw new Error("failed to load access token after insert");
      return created;
    },

    async findActiveByHash(
      token_hash: string,
    ): Promise<AccessTokenRow | undefined> {
      return knex<AccessTokenRow>("access_tokens").where({ token_hash }).first();
    },

    async touchLastUsed(id: number): Promise<void> {
      await knex<AccessTokenRow>("access_tokens")
        .where({ id })
        .update({ last_used_at: knex.fn.now() });
    },

    async listForUser(
      userId: number,
      options: ListPageOptions & { search?: string },
    ): Promise<ListPage<AccessTokenRow>> {
      let query = knex<AccessTokenRow>("access_tokens").where({ user_id: userId });
      if (options.since) query = query.where("created_at", ">=", options.since);
      if (options.search) {
        const ast = parseSearchQuery(options.search);
        query = query.where(compileSearchQuery(ast, SEARCH_FIELDS, knex));
      }
      query = applySort(
        query,
        options.sort,
        SORTABLE_COLUMNS,
        "created_at",
        "desc",
      );
      return paginate(query, options);
    },

    async listAll(
      options: ListPageOptions & { search?: string },
    ): Promise<ListPage<AccessTokenRow>> {
      let query = knex<AccessTokenRow>("access_tokens");
      if (options.since) query = query.where("created_at", ">=", options.since);
      if (options.search) {
        const ast = parseSearchQuery(options.search);
        query = query.where(compileSearchQuery(ast, SEARCH_FIELDS, knex));
      }
      query = applySort(
        query,
        options.sort,
        SORTABLE_COLUMNS,
        "created_at",
        "desc",
      );
      return paginate(query, options);
    },

    async findById(id: number): Promise<AccessTokenRow | undefined> {
      return knex<AccessTokenRow>("access_tokens").where({ id }).first();
    },

    async deleteById(id: number): Promise<void> {
      await knex<AccessTokenRow>("access_tokens").where({ id }).delete();
    },
  };
}

export type AccessTokensRepository = ReturnType<typeof accessTokensRepository>;
