import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (t) => {
    t.increments("id").primary();
    t.string("github_id").notNullable().unique();
    t.string("github_login").notNullable();
    t.string("display_name").nullable();
    t.string("avatar_url").nullable();
    t.string("role").notNullable().defaultTo("user");
    t.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("users");
}
