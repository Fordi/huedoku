// server entrypoint
import { startServer } from "../src/index.ts";
import pkg from "../package.json" with { type: "json" };

process.title = pkg.name ?? "node app";

await startServer();
