import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  reconcileWebDependencies,
  loadAllowedWebDependencyNames,
  WebDependenciesNotInstalledError,
} from "../../../src/web/webDependencies.ts";

async function withTempProject(
  packageJson: Record<string, unknown>,
  fn: (dir: string) => Promise<void>,
): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), "my-app-webdeps-"));
  try {
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify(packageJson, null, 2),
    );
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

describe("webDependencies", () => {
  it("adds a webDependency to dependencies when missing", async () => {
    await withTempProject(
      { dependencies: {}, webDependencies: { zod: "^4.0.0" } },
      async (dir) => {
        await symlink(path.resolve("node_modules"), path.join(dir, "node_modules"));
        await reconcileWebDependencies(new URL(`file://${dir}/`));
        const pkg = JSON.parse(
          await readFile(path.join(dir, "package.json"), "utf8"),
        );
        assert.equal(pkg.dependencies.zod, "^4.0.0");
      },
    );
  });

  it("dependencies wins on a name conflict, package.json is left untouched for that name", async () => {
    await withTempProject(
      { dependencies: { zod: "^4.4.3" }, webDependencies: { zod: "^3.0.0" } },
      async (dir) => {
        await symlink(path.resolve("node_modules"), path.join(dir, "node_modules"));
        await reconcileWebDependencies(new URL(`file://${dir}/`));
        const pkg = JSON.parse(
          await readFile(path.join(dir, "package.json"), "utf8"),
        );
        assert.equal(pkg.dependencies.zod, "^4.4.3");
      },
    );
  });

  it("throws WebDependenciesNotInstalledError for a package not resolvable in node_modules", async () => {
    await withTempProject(
      {
        dependencies: {},
        webDependencies: { "totally-not-a-real-package-xyz": "^1.0.0" },
      },
      async (dir) => {
        await symlink(path.resolve("node_modules"), path.join(dir, "node_modules"));
        await assert.rejects(
          () => reconcileWebDependencies(new URL(`file://${dir}/`)),
          (err: unknown) => {
            assert.ok(err instanceof WebDependenciesNotInstalledError);
            assert.deepEqual(err.missing, ["totally-not-a-real-package-xyz"]);
            return true;
          },
        );
      },
    );
  });

  it("still writes package.json even though the missing package causes a throw", async () => {
    await withTempProject(
      {
        dependencies: {},
        webDependencies: { "totally-not-a-real-package-xyz": "^2.0.0" },
      },
      async (dir) => {
        await symlink(path.resolve("node_modules"), path.join(dir, "node_modules"));
        await assert.rejects(() =>
          reconcileWebDependencies(new URL(`file://${dir}/`)),
        );
        const pkg = JSON.parse(
          await readFile(path.join(dir, "package.json"), "utf8"),
        );
        assert.equal(pkg.dependencies["totally-not-a-real-package-xyz"], "^2.0.0");
      },
    );
  });

  it("loadAllowedWebDependencyNames returns exactly the webDependencies keys", async () => {
    await withTempProject(
      { dependencies: {}, webDependencies: { zod: "^4.0.0", express: "^5.0.0" } },
      async (dir) => {
        const names = await loadAllowedWebDependencyNames(
          new URL(`file://${dir}/`),
        );
        assert.deepEqual([...names].sort(), ["express", "zod"]);
      },
    );
  });

  it("loadAllowedWebDependencyNames returns an empty set when webDependencies is absent", async () => {
    await withTempProject({ dependencies: { zod: "^4.0.0" } }, async (dir) => {
      const names = await loadAllowedWebDependencyNames(new URL(`file://${dir}/`));
      assert.equal(names.size, 0);
    });
  });
});
