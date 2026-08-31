// authentication routes
import type { Router } from "express";
import { TrackedRouter } from "../util/trackedRouter.ts";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { AppConfig } from "../config/env.ts";
import type { Repositories } from "../db/repositories/index.ts";
import {
  buildAuthorizeUrl,
  exchangeCodeForToken,
  fetchGithubUser,
} from "../auth/github.ts";
import { requireAuth } from "../auth/principal.ts";
import { typedVia } from "../util/typedVia.ts";
import { BadRequestError } from "../util/errors.ts";

const meResponseSchema = z.object({
  id: z.number(),
  github_login: z.string(),
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  role: z.enum(["user", "admin"]),
  auth_method: z.enum(["session", "token"]),
});

export function buildAuthRouter(env: AppConfig, repos: Repositories): Router {
  const router = TrackedRouter();

  router.get("/github", (req, res) => {
    const state = randomBytes(16).toString("hex");
    if (!req.session) req.session = {};
    req.session.oauthState = state;
    res.redirect(buildAuthorizeUrl(env, state));
  });

  router.get(
    "/github/callback",
    typedVia(
      { query: { code: z.string(), state: z.string() } },
      async (arg, res) => {
        if (
          !arg.session?.oauthState ||
          arg.session.oauthState !== arg.query.state
        ) {
          throw new BadRequestError("invalid oauth state");
        }
        arg.session.oauthState = undefined;

        const accessToken = await exchangeCodeForToken(env, arg.query.code);
        const githubUser = await fetchGithubUser(accessToken);

        const defaultRole = env.adminGithubLogins.includes(githubUser.login)
          ? "admin"
          : "user";
        const user = await repos.users.upsertFromGithub({
          github_id: String(githubUser.id),
          github_login: githubUser.login,
          display_name: githubUser.name,
          avatar_url: githubUser.avatar_url,
          default_role: defaultRole,
        });

        if (!arg.session) arg.session = {};
        arg.session.userId = user.id;

        if (arg.accepts("html")) {
          res.redirect(env.basePath === "" ? "/" : `${env.basePath}/`);
          return true;
        }
        return {
          content: {
            id: user.id,
            github_login: user.github_login,
            role: user.role,
          },
        };
      },
    ),
  );

  router.post("/logout", requireAuth, (req, res) => {
    req.session = null;
    res.status(204).end();
  });

  router.get(
    "/me",
    requireAuth,
    typedVia({}, async ({ principal }) => {
      const user = await repos.users.findById(principal!.userId);
      if (!user) throw new BadRequestError("user not found");
      const {
        github_id: _github_id,
        created_at: _created_at,
        updated_at: _updated_at,
        ...profile
      } = user;
      return { content: { ...profile, auth_method: principal!.authMethod } };
    }).returns(meResponseSchema),
  );

  return router;
}
