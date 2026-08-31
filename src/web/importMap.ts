// Generate an import map
import { projectPackage } from "../util/package.ts";

export async function importMap(projectRootUrl: string | URL) {
  const pkg = await projectPackage(projectRootUrl);
  const map = {
    imports: {} as Record<string, string>,
  };
  if (pkg.webDependencies) {
    for (const key of Object.keys(pkg.webDependencies)) {
      map.imports[key] = `./modules/${key}`;
    }
  }
  return map;
}
