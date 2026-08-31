// Serve .ts as stripped .mjs
import { readFile } from "node:fs/promises";
import path from "node:path";
import { stripTypeScriptTypes } from "node:module";
import type { RequestHandler } from "express";

/**
 * Serves .ts files under `rootDir` as browser-runnable JavaScript, stripping
 * types on every request via Node's own native stripper (the same one that
 * runs the server's .ts source - no bundler, no build step, no separate
 * toolchain). Held to the same erasable-syntax-only constraint as the rest
 * of the codebase: non-erasable syntax (enum, parameter properties, etc.)
 * throws a SyntaxError here exactly as it would running server-side.
 *
 * Not a general bundler: each requested .ts file is stripped and served
 * standalone. Relative imports between .ts files under rootDir resolve fine
 * as separate browser module requests (the browser fetches each import as
 * its own <rootDir-relative path>.ts request), but bare specifiers (npm
 * package imports) are not resolved - this is meant for small,
 * dependency-free client scripts, not a replacement for a real bundler.
 */
export function serveTypeScriptAssets(rootDir: string): RequestHandler {
  return (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }
    const isTypescript = req.path.endsWith(".ts");
    if (!isTypescript) {
      next();
      return;
    }
    const relativePath = decodeURIComponent(req.path).replace(/^\/+/, "");
    const resolved = path.resolve(rootDir, relativePath);
    if (resolved !== rootDir && !resolved.startsWith(`${rootDir}${path.sep}`)) {
      next();
      return;
    }

    readFile(resolved, "utf8")
      .then((source) => {
        try {
          return [
            source,
            stripTypeScriptTypes(source, { mode: "strip" }),
            undefined,
          ] as [string, string, undefined];
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return [source, undefined, message] as [string, undefined, string];
        }
      })
      .then(([source, stripped, error]) => {
        if (error) {
          res
            .status(500)
            .type("text/plain")
            .send(`TypeScript strip error in ${relativePath}: ${error}`);
          return;
        }
        res.type("text/javascript").send(stripped ?? source);
      })
      .catch((err: NodeJS.ErrnoException) => {
        if (err.code === "ENOENT" || err.code === "EISDIR") {
          next();
          return;
        }
        next(err);
      });
  };
}
