import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildStatic, rewriteHtml } from "../../../src/web/staticBuild.ts";

async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), "static-build-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

describe("rewriteHtml", () => {
  const html = [
    "<head>",
    '    <script type="importmap">',
    "      ${JSON.stringify(await importMap())}",
    "    </script>",
    '    <script src="./index.ts" type="module"></script>',
    '    <link rel="stylesheet" href="index.css" />',
    "</head>",
  ].join("\n");

  it("drops the import map and points .ts scripts at their bundles", () => {
    const seen: string[] = [];
    const out = rewriteHtml(html, "index.html", (src) => {
      seen.push(src);
      return src.replace(".ts", ".js");
    });
    assert.deepEqual(seen, ["./index.ts"]);
    assert.equal(
      out,
      [
        "<head>",
        '    <script src="./index.js" type="module"></script>',
        '    <link rel="stylesheet" href="index.css" />',
        "</head>",
      ].join("\n"),
    );
  });

  it("refuses templates that need the server", () => {
    assert.throws(
      () => rewriteHtml("<p>${req.path}</p>", "page.html", (s) => s),
      /page\.html still has a template interpolation/,
    );
  });
});

describe("buildStatic", () => {
  it("bundles pages and their workers, and copies other assets", async () => {
    await withTempDir(async (dir) => {
      const src = path.join(dir, "src");
      const out = path.join(dir, "out");
      await mkdir(path.join(src, "lib"), { recursive: true });
      await writeFile(
        path.join(src, "index.html"),
        '<script type="importmap">${JSON.stringify(await importMap())}</script>\n<script src="./main.ts" type="module"></script>\n',
      );
      await writeFile(
        path.join(src, "main.ts"),
        'import { greet } from "./lib/greet.ts";\nconst w: Worker = new Worker(new URL("./lib/job.ts", import.meta.url), { type: "module" });\nw.postMessage(greet("x"));\n',
      );
      await writeFile(
        path.join(src, "lib/greet.ts"),
        "export const greet = (name: string): string => `hi ${name}`;\n",
      );
      await writeFile(
        path.join(src, "lib/job.ts"),
        'import { greet } from "./greet.ts";\npostMessage(greet("worker"));\n',
      );
      await writeFile(path.join(src, "style.css"), "body { color: red }\n");
      await writeFile(path.join(src, ".folder"), "placeholder\n");

      const { files } = await buildStatic({
        srcDir: src,
        outDir: out,
        minify: false,
      });

      assert.deepEqual(files, [
        "index.html",
        "job.js",
        "job.js.map",
        "main.js",
        "main.js.map",
        "style.css",
      ]);
      assert.equal(
        await readFile(path.join(out, "index.html"), "utf8"),
        '<script src="./main.js" type="module"></script>\n',
      );
      const main = await readFile(path.join(out, "main.js"), "utf8");
      assert.match(main, /new URL\("\.\/job\.js", import\.meta\.url\)/);
      assert.doesNotMatch(main, /\.ts"/);
      assert.match(main, /hi \$\{name\}/, "imports are bundled in");
      const job = await readFile(path.join(out, "job.js"), "utf8");
      assert.match(job, /hi \$\{name\}/);
    });
  });

  it("builds the real client", async () => {
    await withTempDir(async (dir) => {
      const srcDir = path.resolve(import.meta.dirname, "../../../src/client");
      const { files } = await buildStatic({ srcDir, outDir: dir });
      for (const file of [
        "index.html",
        "index.js",
        "generate.worker.js",
        "index.css",
        "favicon.svg",
      ]) {
        assert.ok(files.includes(file), file);
      }
      const html = await readFile(path.join(dir, "index.html"), "utf8");
      assert.match(html, /src="\.\/index\.js"/);
      assert.doesNotMatch(html, /importmap/);
    });
  });
});
