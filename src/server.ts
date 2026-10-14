// Constructs the webserver
import express, { type Express } from "express";
import { createServer, type Server as HttpServer } from "node:http";
import { fileURLToPath } from "node:url";
import type { AppConfig } from "./config/env.ts";
import { buildApiRouter } from "./api/router.ts";
import { errorHandler } from "./api/errorHandler.ts";
import { serveTypeScriptAssets } from "./web/typescriptAssets.ts";
import { serveModules } from "./web/moduleServer.ts";
import { serveHtmlTemplates } from "./web/htmlTemplates.ts";

const publicDir = fileURLToPath(new URL("./client", import.meta.url));
const coverageDir = fileURLToPath(new URL("../coverage", import.meta.url));
const projectRootUrl = new URL("../", import.meta.url);

export function buildServer(env: AppConfig): {
  app: Express;
  httpServer: HttpServer;
} {
  const app = express();
  const basePath = env.basePath || "/";
  app.use(express.json());
  // Semi-static admin UI assets live under src/client
  //  HTML files under this folder are served as templates
  //  TS files use node's native type stripping at runtime, and run as JS on the client
  app.use(basePath, serveHtmlTemplates(publicDir, projectRootUrl));
  app.use(basePath, serveTypeScriptAssets(publicDir));
  app.use(basePath, express.static(publicDir));
  // The test coverage report (npm run coverage) is a dev/CI artifact that
  // reveals internal file structure and untested code paths - never served
  // in production. 404s (via express.static's own fallthrough) rather than
  // erroring when coverage/ doesn't exist.
  if (env.NODE_ENV !== "production") {
    app.use(
      `${basePath === "/" ? "" : basePath}/coverage`,
      express.static(coverageDir),
    );
  }
  // Dynamically bundles allowlisted npm packages (package.json's
  // webDependencies) to browser ESM on first request, cached thereafter.
  app.use(basePath, serveModules(projectRootUrl));
  app.use(basePath, buildApiRouter(env));
  app.use(errorHandler);

  const httpServer = createServer(app);

  return { app, httpServer };
}
