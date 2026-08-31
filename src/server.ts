// Constructs the webserver
import express, { type Express } from "express";
import { createServer, type Server as HttpServer } from "node:http";
import { fileURLToPath } from "node:url";
import type { AppConfig } from "./config/env.ts";
import type { Repositories } from "./db/repositories/index.ts";
import { buildSessionMiddleware } from "./auth/session.ts";
import { buildAuthenticateMiddleware } from "./auth/principal.ts";
import { requireRole } from "./auth/roles.ts";
import { buildApiRouter } from "./api/router.ts";
import { errorHandler } from "./api/errorHandler.ts";
import { serveTypeScriptAssets } from "./web/typescriptAssets.ts";
import { serveModules } from "./web/moduleServer.ts";
import { serveHtmlTemplates } from "./web/htmlTemplates.ts";

const publicDir = fileURLToPath(new URL("./client", import.meta.url));
const coverageDir = fileURLToPath(new URL("../coverage", import.meta.url));
const projectRootUrl = new URL("../", import.meta.url);

export function buildServer(
  env: AppConfig,
  repos: Repositories,
): { app: Express; httpServer: HttpServer } {
  const app = express();
  const basePath = env.basePath || "/";
  app.use(express.json());
  app.use(buildSessionMiddleware(env));
  // Populates req.principal from either a session cookie or a bearer token
  // - mounted once here (rather than only inside buildApiRouter) so
  // anything mounted before the API router, like the coverage report
  // below, can also gate on it.
  app.use(buildAuthenticateMiddleware(repos));
  // Semi-static admin UI assets live under src/client
  //  HTML files under this folder are served as templates
  //  TS files use node's native type stripping at runtime, and run as JS on the client
  app.use(basePath, serveHtmlTemplates(publicDir, projectRootUrl));
  app.use(basePath, serveTypeScriptAssets(publicDir));
  app.use(basePath, express.static(publicDir));
  // The test coverage report (npm run coverage) is a dev/CI artifact that
  // reveals internal file structure and untested code paths - gated
  // admin-only, unlike the public dashboard assets above, since there's no
  // reason an ordinary user should ever see it. 404s (via express.static's
  // own fallthrough) rather than erroring when coverage/ doesn't exist,
  // e.g. in a production image that never ran `npm run coverage`.
  app.use(
    `${basePath === "/" ? "" : basePath}/coverage`,
    requireRole("admin"),
    express.static(coverageDir),
  );
  // Dynamically bundles allowlisted npm packages (package.json's
  // webDependencies) to browser ESM on first request, cached thereafter.
  app.use(basePath, serveModules(projectRootUrl));
  app.use(basePath, buildApiRouter(env, repos));
  app.use(errorHandler);

  const httpServer = createServer(app);

  return { app, httpServer };
}
