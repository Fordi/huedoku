// Serve NPM modules listed under .webDependencies
import * as esbuild from "esbuild";
import type { RequestHandler } from "express";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadAllowedWebDependencyNames } from "./webDependencies.ts";
import { via } from "../util/via.ts";

interface CacheEntry {
  code: string;
}

// Package name (optionally scoped), optionally followed by a deep-import
// subpath (e.g. "preact/hooks", "@scope/pkg/sub/path"). Each path segment is
// restricted to a safe character set with no "." or ".." segments, so this
// can never be used to escape node_modules/<package> via path traversal.
const SEGMENT = "[a-z0-9][a-z0-9._-]*";
const PACKAGE_NAME_PATTERN = new RegExp(
  `^(@${SEGMENT}\\/)?${SEGMENT}(\\/${SEGMENT})*$`,
  "i",
);

/**
 * Bundles an npm package (from node_modules) into browser-runnable ESM via
 * esbuild and serves it at GET /modules/{package}, restricted to names
 * listed in package.json's webDependencies - nothing else in node_modules is
 * reachable this way, even if some other dependency happens to pull it in
 * transitively. Results are bundled once per package name and cached in
 * memory for the life of the process; there's no cache invalidation, so a
 * process restart is required to pick up an upgraded package version.
 */
export function serveModules(projectRootUrl: URL): RequestHandler {
  const projectRoot = fileURLToPath(projectRootUrl);
  const cache = new Map<string, Promise<CacheEntry>>();
  let allowedNames: Promise<Set<string>> | undefined;

  return via(async ({ method, path }) => {
    if (method !== "GET" && method !== "HEAD") {
      return;
    }

    const match = /^\/modules\/(.+)$/.exec(path);
    if (!match) {
      return;
    }
    const packageName = decodeURIComponent(match[1]!);

    if (!PACKAGE_NAME_PATTERN.test(packageName)) {
      return {
        status: 400,
        content: `invalid package name: ${packageName}`,
      };
    }

    allowedNames ??= loadAllowedWebDependencyNames(projectRootUrl);
    const names = await allowedNames;
    if (!names.has(packageName)) {
      return {
        status: 404,
        content: `not a configured webDependency: ${packageName}`,
      };
    }

    let entry = cache.get(packageName);
    if (!entry) {
      entry = bundlePackage(packageName, projectRoot, names);
      cache.set(packageName, entry);
      // Don't cache a rejected bundle attempt - let the next request retry
      // (e.g. after the operator fixes a genuinely bad entry point).
      entry.catch(() => cache.delete(packageName));
    }

    const { code } = await entry;
    return {
      type: "text/javascript",
      content: code,
    };
  });
}

async function bundlePackage(
  packageName: string,
  projectRoot: string,
  allowedNames: Set<string>,
): Promise<CacheEntry> {
  // Every *other* webDependency must stay an external import rather than get
  // inlined here, or a package that itself imports one (e.g. preact/hooks
  // importing preact, htm/preact importing preact) ends up bundled with its
  // own private copy - a second, disconnected module instance from the one
  // actually rendering the page. Preact's hooks rely on module-scoped
  // singleton state to find "the current component," so two live copies
  // means every hook call fails immediately, since the copy in play never
  // has that state set. The import map already routes each webDependency
  // name to its own /modules/{name} URL, so leaving these as real imports
  // lets the browser resolve them all to the same shared instance.
  //
  // esbuild's `external` matches a bare package *name* against that
  // package's own subpaths too (external: ["preact"] also matches
  // "preact/hooks"), which breaks bundling "preact/hooks" itself if we fed
  // esbuild the bare specifier as the entry point - esbuild would treat the
  // entry point as external and emit a no-op re-export of an unresolvable
  // specifier. Resolving to a real file path first and using it as the
  // entry point sidesteps that: a file path never collides with a package
  // name in the external list, so every *other* webDependency can be
  // externalized unconditionally, including packageName's own base package
  // when packageName is a subpath of it.
  const entryUrl = import.meta.resolve(
    packageName,
    pathToFileURL(`${projectRoot}/package.json`).toString(),
  );
  const external = [...allowedNames].filter((name) => name !== packageName);

  const result = await esbuild.build({
    entryPoints: [fileURLToPath(entryUrl)],
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    external,
    write: false,
    logLevel: "silent",
  });

  const output = result.outputFiles?.[0];
  if (!output) {
    throw new Error(`esbuild produced no output for package: ${packageName}`);
  }
  return { code: output.text };
}
