// Serve HTML as template literals
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import type { Request, RequestHandler } from "express";
import { importMap } from "./importMap.ts";

export interface TemplateHelpers {
  importMap: () => ReturnType<typeof importMap>;
  req: Request;
}

/**
 * Serves .html files under `rootDir` as JS template literals, evaluated on
 * every request (no build step, no caching - matches serveTypeScriptAssets'
 * philosophy). The file's raw contents become the body of a template
 * literal, so `${...}` interpolations run as plain JS with `await`
 * supported, e.g.:
 *
 *   <script type="importmap">${JSON.stringify(await importMap())}</script>
 *
 * Available in every template's scope: `importMap` (pre-bound to this
 * project's root - see src/web/importMap.ts) and `req` (the current Express
 * request). Interpolated values are inserted as-is, exactly like any JS
 * template literal - no automatic HTML-escaping, since template content is
 * server-authored, not user input; escape untrusted values yourself if a
 * template ever interpolates one.
 *
 * Index resolution: a request path that resolves to a directory (not a
 * `.html` file itself) is retried as `{path}/index.html` only if that
 * directory actually contains an index.html - e.g. `/` -> `index.html`,
 * `/admin` -> `admin/index.html`. A path that isn't a directory (an
 * extensionless file, a nonexistent path, etc.) is never rewritten; it falls
 * through to `next()` untouched, same as any other unmatched request. A path
 * already ending in `.html` is always used as-is and never has
 * `/index.html` appended.
 */
export function serveHtmlTemplates(
  rootDir: string,
  projectRootUrl: URL,
): RequestHandler {
  return (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }

    const decodedPath = decodeURIComponent(req.path).replace(/^\/+/, "");
    const resolved = path.resolve(rootDir, decodedPath);
    if (resolved !== rootDir && !resolved.startsWith(`${rootDir}${path.sep}`)) {
      next();
      return;
    }

    const found = resolveTemplatePath(resolved, decodedPath);
    if (!found) {
      next();
      return;
    }

    const { filePath, relativePath } = found;
    readFile(filePath, "utf8")
      .then(async (source) => {
        const rendered = await renderTemplate(source, relativePath, {
          importMap: () => importMap(projectRootUrl),
          req,
        });
        res.type("text/html").send(rendered);
      })
      .catch(next);
  };
}

function resolveTemplatePath(
  resolved: string,
  relativePath: string,
): { filePath: string; relativePath: string } | undefined {
  if (relativePath.endsWith(".html")) {
    return isFile(resolved) ? { filePath: resolved, relativePath } : undefined;
  }

  if (!existsSync(resolved) || !statSync(resolved).isDirectory()) {
    return undefined;
  }

  const indexPath = path.join(resolved, "index.html");
  if (!isFile(indexPath)) {
    return undefined;
  }
  return {
    filePath: indexPath,
    relativePath: path.posix.join(relativePath, "index.html"),
  };
}

function isFile(filePath: string): boolean {
  return existsSync(filePath) && statSync(filePath).isFile();
}

async function renderTemplate(
  source: string,
  sourceName: string,
  helpers: TemplateHelpers,
): Promise<string> {
  // Wraps the raw file contents as the body of a template literal inside an
  // async function, so `${expr}` in the .html file runs as real JS
  // (including `await`) with `helpers`' keys in scope as free variables.
  const AsyncFunction = Object.getPrototypeOf(async function () {})
    .constructor as new (
    ...args: string[]
  ) => (...args: unknown[]) => Promise<string>;

  let render: (...args: unknown[]) => Promise<string>;
  try {
    render = new AsyncFunction(
      ...Object.keys(helpers),
      `return \`${source.replaceAll("\\", "\\\\").replaceAll("`", "\\`")}\`;`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`template syntax error in ${sourceName}: ${message}`, {
      cause: err,
    });
  }

  return render(...Object.values(helpers));
}
