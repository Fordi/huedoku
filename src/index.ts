// Service entrypoint
import { loadEnv, loadEnvFile } from "./config/env.ts";
import { buildServer } from "./server.ts";
import { reconcileWebDependencies } from "./web/webDependencies.ts";
import { HUP } from "./hup.ts";
import { fileURLToPath } from "node:url";
import { readFile, writeFile } from "node:fs/promises";
import type { Server as HttpServer } from "node:http";
import pkg from "../package.json" with { type: "json" };


export interface RunningServer {
  httpServer: HttpServer;
  terminate(): Promise<void>;
}

/**
 * Boots the whole app - env, web dependencies, and the HTTP server - and
 * starts listening.
 * Side-effect-free to import; nothing runs until this is called, so tests
 * can import this module without a real server starting.
 */
export async function startServer(
  projectRootUrl: URL = new URL("../", import.meta.url),
): Promise<RunningServer> {
  loadEnvFile(projectRootUrl);
  const env = loadEnv();

  await reconcileWebDependencies(projectRootUrl);

  const { httpServer } = buildServer(env);

  await new Promise<void>((resolve) => {
    httpServer.listen(env.PORT, () => {
      console.log(`${pkg.name} v${pkg.version} listening on port ${env.PORT}`);
      resolve();
    });
  });

  // SIGHUP triggers a restart. Under `node --watch`, calling process.exit()
  // would just stop the process - `--watch` only restarts on a *file change*,
  // not on exit - so instead this closes the HTTP port
  // cleanly, then rewrites hup.ts with its own contents. That write is enough
  // of a file-change event for `--watch` to pick up and restart the process,
  // even though the file's content is unchanged.
  const onSighup = () => {
    console.log(`received SIGHUP, triggering restart: ${HUP}`);
    httpServer.close(async () => {
      const hupFile = fileURLToPath(new URL("hup.ts", import.meta.url));
      await writeFile(hupFile, await readFile(hupFile));
    });
  };
  process.on("SIGHUP", onSighup);

  async function terminate(): Promise<void> {
    process.off("SIGHUP", onSighup);
    return new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  }

  return { httpServer, terminate };
}
