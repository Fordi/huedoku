import { buildServer } from "../../../src/server.ts";
import type { AppConfig } from "../../../src/config/env.ts";

export const TEST_ENV: AppConfig = {
  NODE_ENV: "test",
  PORT: 0,
  BASE_PATH: "",
  basePath: "",
};

export function buildTestApp() {
  return buildServer(TEST_ENV);
}
