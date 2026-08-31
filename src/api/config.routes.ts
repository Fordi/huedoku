// runtime config routes
import type { Router } from "express";
import { TrackedRouter } from "../util/trackedRouter.ts";
import { z } from "zod";
import type { Repositories } from "../db/repositories/index.ts";
import { requireAuth } from "../auth/principal.ts";
import { requireRole } from "../auth/roles.ts";
import { typedVia } from "../util/typedVia.ts";
import { listRuntimeConfig, setRuntimeConfig } from "../config/runtimeConfig.ts";

const setConfigSchema = z.object({ value: z.unknown() });

export function buildConfigRouter(repos: Repositories): Router {
  const router = TrackedRouter();
  router.use(requireAuth, requireRole("admin"));

  router.get(
    "/",
    typedVia({}, async () => {
      return { content: listRuntimeConfig() };
    }).returns(z.array(z.object({ key: z.string(), value: z.unknown() }))),
  );

  router.put(
    "/:key",
    typedVia(
      { params: { key: z.string() }, body: setConfigSchema.shape },
      async ({ params, body }) => {
        await setRuntimeConfig(repos, params.key, body.value);
        return { status: 204 };
      },
    ),
  );

  return router;
}
