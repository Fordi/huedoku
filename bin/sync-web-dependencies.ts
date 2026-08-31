// Sync {package.json}.webDependencies with dependencies
import { resolve } from "node:path";
import { reconcileWebDependencies } from "../src/web/webDependencies.ts";
await reconcileWebDependencies(resolve(import.meta.dirname, ".."), true);
