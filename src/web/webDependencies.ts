// dealing with .webDependencies
import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { packagePath, projectPackage } from "../util/package.ts";

export class WebDependenciesNotInstalledError extends Error {
  missing: string[];

  constructor(missing: string[]) {
    super(
      `webDependencies not installed: ${missing.join(", ")}. ` +
        `package.json has been updated with these under "dependencies" - run \`npm install\` and restart.`,
    );
    this.missing = missing;
  }
}

/**
 * Reconciles package.json's `webDependencies` against `dependencies`:
 * any package named in `webDependencies` but absent from `dependencies` is
 * added to `dependencies` (package.json is rewritten on disk if anything
 * changed) using the webDependencies-declared version range. A name present
 * in both keeps its `dependencies` version untouched - dependencies always
 * wins on conflict, per spec.
 *
 * This function never runs npm itself - installing is the operator's
 * responsibility. After reconciling package.json, it checks whether every
 * webDependency is actually resolvable from node_modules; if not, it throws
 * WebDependenciesNotInstalledError so startup fails loudly with clear
 * next steps instead of serving broken /modules/* responses later.
 */
export async function reconcileWebDependencies(
  projectRootUrl: string | URL,
  skipResolutions: boolean = false,
): Promise<void> {
  const pkg = await projectPackage(projectRootUrl);

  const webDeps = pkg.webDependencies ?? {};
  const deps = pkg.dependencies ?? {};

  let changed = false;
  for (const [name, versionRange] of Object.entries(webDeps)) {
    if (versionRange === true) {
      continue;
    }
    if (!(name in deps)) {
      deps[name] = versionRange;
      changed = true;
    } else if (versionRange !== deps[name]) {
      webDeps[name] = deps[name];
      changed = true;
    }
  }

  if (changed) {
    pkg.dependencies = deps;
    pkg.webDependencies = webDeps;
    await writeFile(
      packagePath(projectRootUrl),
      `${JSON.stringify(pkg, null, 2)}\n`,
      "utf8",
    );
  }

  const missing: string[] = [];
  if (!skipResolutions) {
    for (const name of Object.keys(webDeps)) {
      if (!isResolvable(name, pathToFileURL(packagePath(projectRootUrl)))) {
        missing.push(name);
      }
    }

    if (missing.length > 0) {
      throw new WebDependenciesNotInstalledError(missing);
    }
  } else {
    if (changed) {
      // Exit with an error to force npm i again
      process.exit(1);
    }
  }
}

function isResolvable(packageName: string, projectRootUrl: string | URL): boolean {
  try {
    // A synthetic module specifier under the project root, purely to give
    // resolve() a parent context anchored at this project's node_modules.
    const base =
      typeof projectRootUrl === "string" ? new URL(projectRootUrl) : projectRootUrl;
    import.meta.resolve(packageName, new URL("package.json", base).toString());
    return true;
  } catch {
    return false;
  }
}

/**
 * The set of package names this server is allowed to bundle and serve under
 * /modules/{package} - anything named in webDependencies, full stop. This is
 * the allowlist typescriptAssets/importMap consult; a package not in
 * webDependencies is never served, even if it happens to exist in
 * node_modules as some other dependency's transitive install.
 */
export async function loadAllowedWebDependencyNames(
  projectRootUrl: URL,
): Promise<Set<string>> {
  const pkg = await projectPackage(projectRootUrl);
  return new Set(Object.keys(pkg.webDependencies ?? {}));
}
