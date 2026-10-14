// build the client as a static site (default: dist/)
import { fileURLToPath } from "node:url";
import path from "node:path";
import { buildStatic } from "../src/web/staticBuild.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const outDir = path.resolve(root, process.argv[2] ?? "dist");

const { files } = await buildStatic({
  srcDir: path.join(root, "src/client"),
  outDir,
});
console.log(
  `Built ${files.length} files into ${path.relative(root, outDir)}/:`,
);
for (const file of files) console.log(`  ${file}`);
