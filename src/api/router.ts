// root API router
import type { Router } from "express";
import { TrackedRouter } from "../util/trackedRouter.ts";
import type { AppConfig } from "../config/env.ts";

export function buildApiRouter(_env: AppConfig): Router {
  const router = TrackedRouter();

  // Mount feature routers here, e.g. router.use("/things", buildThingsRouter(env));

  return router;
}
