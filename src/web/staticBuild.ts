// Build the client as a static site
import * as esbuild from "esbuild";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Bundles the client under `srcDir` into a self-contained static site in
 * `outDir` - no server, no import map, no type stripping at request time:
 *
 * - Each .html file has its `<script type="importmap">` dropped (npm
 *   packages are bundled in instead) and its `<script src="*.ts">`s bundled
 *   by esbuild and pointed at the resulting .js. A template interpolation
 *   (`${...}`) left over after that fails the build, since there's no server
 *   to evaluate it.
 * - Workers (`new URL("./x.ts", import.meta.url)`, as passed to `new Worker`)
 *   are bundled as their own entry points, and the reference rewritten to
 *   the .js. Everything lands flat in `outDir`, so names must be unique.
 * - Every other file (CSS, images...) is copied as-is; dotfiles are skipped.
 */
export async function buildStatic({
  srcDir,
  outDir,
  minify = true,
}: {
  srcDir: string;
  outDir: string;
  minify?: boolean;
}): Promise<{ files: string[] }> {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const files = await listFiles(srcDir);
  const entries = new Set<string>();

  for (const file of files.filter((f) => f.endsWith(".html"))) {
    const source = await readFile(path.join(srcDir, file), "utf8");
    const html = rewriteHtml(source, file, (src) => {
      const entry = path.resolve(srcDir, path.dirname(file), src);
      entries.add(entry);
      return src.replace(/\.ts$/, ".js");
    });
    await mkdir(path.dirname(path.join(outDir, file)), { recursive: true });
    await writeFile(path.join(outDir, file), html);
  }

  // Bundle in rounds: each round's workers are the next round's entries.
  const built = new Set<string>();
  const names = new Map<string, string>();
  for (let round = [...entries]; round.length;) {
    const workers = new Set<string>();
    for (const entry of round) {
      const name = path.basename(entry, ".ts");
      const clash = names.get(name);
      if (clash && clash !== entry) {
        throw new Error(`two entry points named ${name}: ${clash}, ${entry}`);
      }
      names.set(name, entry);
      built.add(entry);
    }
    await esbuild.build({
      entryPoints: round,
      outdir: outDir,
      entryNames: "[name]",
      bundle: true,
      format: "esm",
      target: "es2022",
      minify,
      sourcemap: "linked",
      logLevel: "warning",
      plugins: [workerUrls(workers)],
    });
    round = [...workers].filter((w) => !built.has(w));
  }

  for (const file of files) {
    if (file.endsWith(".ts") || file.endsWith(".html")) continue;
    await mkdir(path.dirname(path.join(outDir, file)), { recursive: true });
    await cp(path.join(srcDir, file), path.join(outDir, file));
  }

  return { files: await listFiles(outDir) };
}

/** Drop the import map, and point .ts scripts (via `rename`) at their bundles. */
export function rewriteHtml(
  source: string,
  name: string,
  rename: (src: string) => string,
): string {
  const html = source
    .replace(
      /^[ \t]*<script\s+type="importmap"[^>]*>[\s\S]*?<\/script>[ \t]*\r?\n?/gm,
      "",
    )
    .replace(
      /(<script\b[^>]*\bsrc=")([^"]+\.ts)(")/g,
      (_, before: string, src: string, after: string) =>
        `${before}${rename(src)}${after}`,
    );
  if (html.includes("${")) {
    throw new Error(
      `${name} still has a template interpolation (\${...}), which needs the server`,
    );
  }
  return html;
}

const WORKER_URL =
  /new URL\(\s*(["'])(\.{1,2}\/[^"']+)\.ts\1\s*,\s*import\.meta\.url\s*\)/g;

/** Rewrite `new URL("./x.ts", import.meta.url)` to the bundled x.js, noting x.ts in `found`. */
function workerUrls(found: Set<string>): esbuild.Plugin {
  return {
    name: "worker-urls",
    setup(build) {
      build.onLoad({ filter: /\.ts$/ }, async ({ path: file }) => {
        const source = await readFile(file, "utf8");
        const contents = source.replace(
          WORKER_URL,
          (_, quote: string, ref: string) => {
            const target = path.resolve(path.dirname(file), `${ref}.ts`);
            found.add(target);
            const js = `./${path.basename(target, ".ts")}.js`;
            return `new URL(${quote}${js}${quote}, import.meta.url)`;
          },
        );
        return { contents, loader: "ts" };
      });
    },
  };
}

/** Every file under `dir` (relative paths), skipping dotfiles. */
async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => path.relative(dir, path.join(e.parentPath, e.name)))
    .filter((f) => !f.split(path.sep).some((part) => part.startsWith(".")))
    .sort();
}
