// configuration from the environment
// import { z } from "zod";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as v from "@fordi-org/valid";

// const schema = z.object({
//   NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
//   PORT: z.coerce.number().int().positive().default(3000),
//   BASE_PATH: z.string().default(""),
// });

const schema = v.struct({
  NODE_ENV: v.string.matches(/^(development|test|production)/),
  PORT: v.integer.atLeast(0),
  BASE_PATH: v.string,
});

export type AppConfig = NonNullable<ReturnType<typeof schema>>;

/**
 * Normalizes a configured base path to either "" (no prefix) or a form with
 * a leading slash and no trailing slash, e.g. "my-app" / "/my-app/" -> "/my-app".
 * Keeping this normalization in one place means every consumer (route mounting,
 * WS upgrade path check) agrees on the exact same prefix string.
 */
function normalizeBasePath(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (trimmed === "") return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/**
 * Prefers a NODE_ENV-specific env file (e.g. .env.production) over the plain
 * .env, so different environments can keep separate config side by side;
 * falls back to .env when no NODE_ENV-specific file exists. If neither
 * exists (e.g. under Docker/most PaaS setups, where the platform injects env
 * vars directly with no .env file on disk), this is a silent no-op and
 * whatever's already in process.env is used as-is.
 *
 * `projectRootUrl` should be a `file://` URL for the project root (the
 * directory containing package.json/.env), typically built from the
 * caller's own `import.meta.url` - e.g. from src/index.ts that's
 * `new URL("../", import.meta.url)`.
 */
export function loadEnvFile(projectRootUrl: URL): void {
  for (const envFile of [`.env.${process.env.NODE_ENV ?? "development"}`, ".env"]) {
    const envPath = fileURLToPath(new URL(envFile, projectRootUrl));
    if (!existsSync(envPath)) {
      continue;
    }
    try {
      process.loadEnvFile(envPath);
      break;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn(`Warning: ${message} while reading ${envPath}`);
    }
  }
}

let cached: (AppConfig & { basePath: AppConfig["BASE_PATH"] }) | undefined;

export function loadEnv(source: NodeJS.ProcessEnv = process.env) {
  if (cached) return cached;
  let parsed;
  try {
    parsed = schema(source);
  } catch (error) {
    console.error(
      "Invalid environment configuration:",
      error,
    );
    process.exit(1);
  }
  const data = parsed as unknown as AppConfig;
  cached = {
    ...data,
    basePath: normalizeBasePath(data.BASE_PATH ?? ""),
  };
  return cached;
}

export function resetEnvCacheForTests(): void {
  cached = undefined;
}
