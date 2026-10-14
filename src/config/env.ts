// configuration from the environment
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { struct, string, integer } from "@fordi-org/valid";

const schema = struct({
  NODE_ENV: string.matches(/^(development|test|production)/),
  PORT: integer.atLeast(0),
});

export type AppConfig = NonNullable<ReturnType<typeof schema>>;

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
  for (const envFile of [
    `.env.${process.env.NODE_ENV ?? "development"}`,
    ".env",
  ]) {
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

let cached: AppConfig | undefined;

export function loadEnv(source: NodeJS.ProcessEnv = process.env) {
  if (cached) return cached;
  try {
    cached = schema(source);
  } catch (error) {
    console.error("Invalid environment configuration:", error);
    process.exit(1);
  }
  return cached;
}

export function resetEnvCacheForTests(): void {
  cached = undefined;
}
