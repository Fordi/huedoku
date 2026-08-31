// root API router
import type { Router } from "express";
import { TrackedRouter } from "../util/trackedRouter.ts";
import type { AppConfig } from "../config/env.ts";
import type { Repositories } from "../db/repositories/index.ts";
import { buildAuthRouter } from "./auth.routes.ts";
import { buildConfigRouter } from "./config.routes.ts";

// req.principal is populated once, globally, by server.ts (before this
// router is even mounted) - so anything mounted ahead of the API router
// (e.g. the admin-gated coverage report) can also rely on it.
export function buildApiRouter(
  env: AppConfig,
  repos: Repositories,
): Router {
  const router = TrackedRouter();

  router.use("/auth", buildAuthRouter(env, repos));
  router.use("/config", buildConfigRouter(repos));

  return router;
}
