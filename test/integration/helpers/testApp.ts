import type { Knex } from "knex";
import {
  buildRepositories,
  type Repositories,
} from "../../../src/db/repositories/index.ts";
import { buildServer } from "../../../src/server.ts";
import type { AppConfig } from "../../../src/config/env.ts";
import { generateToken } from "../../../src/auth/tokens.ts";
import type { Role } from "../../../src/db/types.ts";

export const TEST_ENV: AppConfig = {
  NODE_ENV: "test",
  PORT: 0,
  SESSION_SECRET: "test-session-secret-at-least-16-chars",
  GITHUB_CLIENT_ID: "test-client-id",
  GITHUB_CLIENT_SECRET: "test-client-secret",
  GITHUB_CALLBACK_URL: "http://localhost/auth/github/callback",
  DB_CLIENT: "better-sqlite3",
  ADMIN_GITHUB_LOGINS: "",
  adminGithubLogins: [],
  BASE_PATH: "",
  basePath: "",
};

export function buildTestApp(
  knex: Knex,
) {
  const repos = buildRepositories(knex);

  const { app, httpServer } = buildServer(TEST_ENV, repos);
  return { app, httpServer, repos };
}

export async function createUserWithToken(
  repos: Repositories,
  opts: { githubLogin: string; role: Role },
): Promise<{ userId: number; rawToken: string }> {
  const user = await repos.users.upsertFromGithub({
    github_id: `gh-${opts.githubLogin}`,
    github_login: opts.githubLogin,
    display_name: null,
    avatar_url: null,
    default_role: opts.role,
  });
  const { raw, hash, prefix } = generateToken();
  await repos.accessTokens.create({
    user_id: user.id,
    label: "test",
    token_hash: hash,
    token_prefix: prefix,
  });
  return { userId: user.id, rawToken: raw };
}
