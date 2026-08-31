// typedefs for package.json
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

type Contact = {
  url?: string;
  email?: string;
};

type Person =
  | string
  | (Contact & {
      name: string;
    });

type Exports = null | string | Array<string | ExportConditions> | ExportConditions;

type ExportConditions = {
  [condition: string]: Exports;
};

type Imports = {
  [key: `#${string}`]: Exports;
};

type DependencyOverrides = {
  [packageName in string]: string | undefined | DependencyOverrides;
};
type DevEngineDependency = {
  name: string;
  version?: string;
  onFail?: "ignore" | "warn" | "error" | "download";
};

export type ProjectPackage = {
  /**
		The name of the package.
		*/
  name?: string;

  /**
		Package version, parseable by [`node-semver`](https://github.com/npm/node-semver).
		*/
  version?: string;

  /**
		Package description, listed in `npm search`.
		*/
  description?: string;

  /**
		Keywords associated with package, listed in `npm search`.
		*/
  keywords?: string[];

  /**
		The URL to the package's homepage.
		*/
  homepage?: "." | string;

  /**
		The URL to the package's issue tracker and/or the email address to which issues should be reported.
		*/
  bugs?: string | Contact;

  /**
		The license for the package.
		*/
  license?: string;

  /**
		The licenses for the package.
		*/
  licenses?: Array<{
    type?: string;
    url?: string;
  }>;

  author?: Person;

  /**
		A list of people who contributed to the package.
		*/
  contributors?: Person[];

  /**
		A list of people who maintain the package.
		*/
  maintainers?: Person[];

  /**
		The files included in the package.
		*/
  files?: string[];

  /**
		Resolution algorithm for importing ".js" files from the package's scope.

		[Read more.](https://nodejs.org/api/esm.html#esm_package_json_type_field)
		*/
  type?: "module" | "commonjs";

  /**
		The module ID that is the primary entry point to the program.
		*/
  main?: string;

  /**
		Subpath exports to define entry points of the package.

		[Read more.](https://nodejs.org/api/packages.html#subpath-exports)
		*/
  exports?: Exports;

  /**
		Subpath imports to define internal package import maps that only apply to import specifiers from within the package itself.

		[Read more.](https://nodejs.org/api/packages.html#subpath-imports)
		*/
  imports?: Imports;

  /**
		The executable files that should be installed into the `PATH`.
		*/
  bin?: string | Partial<Record<string, string>>;

  /**
		Filenames to put in place for the `man` program to find.
		*/
  man?: string | string[];

  /**
		Indicates the structure of the package.
		*/
  directories?: {
    [directoryType: string]: unknown | undefined;

    /**
      Location for executable scripts. Sugar to generate entries in the `bin` property by walking the folder.
      */
    bin?: string;

    /**
      Location for Markdown files.
      */
    doc?: string;

    /**
      Location for example scripts.
      */
    example?: string;

    /**
      Location for the bulk of the library.
      */
    lib?: string;

    /**
      Location for man pages. Sugar to generate a `man` array by walking the folder.
      */
    man?: string;

    /**
      Location for test files.
      */
    test?: string;
  };

  /**
		Location for the code repository.
		*/
  repository?:
    | string
    | {
        type: string;
        url: string;

        /**
			Relative path to package.json if it is placed in non-root directory (for example if it is part of a monorepo).

			[Read more.](https://github.com/npm/rfcs/blob/latest/implemented/0010-monorepo-subdirectory-declaration.md)
			*/
        directory?: string;
      };

  /**
		Script commands that are run at various times in the lifecycle of the package. The key is the lifecycle event, and the value is the command to run at that point.
		*/
  scripts?: {
    /**
		Run **before** the package is published (Also run on local `npm install` without any arguments).
		*/
    prepublish?: string;

    /**
		Run both **before** the package is packed and published, and on local `npm install` without any arguments. This is run **after** `prepublish`, but **before** `prepublishOnly`.
		*/
    prepare?: string;

    /**
		Run **before** the package is prepared and packed, **only** on `npm publish`.
		*/
    prepublishOnly?: string;

    /**
		Run **before** a tarball is packed (on `npm pack`, `npm publish`, and when installing git dependencies).
		*/
    prepack?: string;

    /**
		Run **after** the tarball has been generated and moved to its final destination.
		*/
    postpack?: string;

    /**
		Run **after** the package is published.
		*/
    publish?: string;

    /**
		Run **after** the package is published.
		*/
    postpublish?: string;

    /**
		Run **before** the package is installed.
		*/
    preinstall?: string;

    /**
		Run **after** the package is installed.
		*/
    install?: string;

    /**
		Run **after** the package is installed and after `install`.
		*/
    postinstall?: string;

    /**
		Run **before** the package is uninstalled and before `uninstall`.
		*/
    preuninstall?: string;

    /**
		Run **before** the package is uninstalled.
		*/
    uninstall?: string;

    /**
		Run **after** the package is uninstalled.
		*/
    postuninstall?: string;

    /**
		Run **before** bump the package version and before `version`.
		*/
    preversion?: string;

    /**
		Run **before** bump the package version.
		*/
    version?: string;

    /**
		Run **after** bump the package version.
		*/
    postversion?: string;

    /**
		Run with the `npm test` command, before `test`.
		*/
    pretest?: string;

    /**
		Run with the `npm test` command.
		*/
    test?: string;

    /**
		Run with the `npm test` command, after `test`.
		*/
    posttest?: string;

    /**
		Run with the `npm stop` command, before `stop`.
		*/
    prestop?: string;

    /**
		Run with the `npm stop` command.
		*/
    stop?: string;

    /**
		Run with the `npm stop` command, after `stop`.
		*/
    poststop?: string;

    /**
		Run with the `npm start` command, before `start`.
		*/
    prestart?: string;

    /**
		Run with the `npm start` command.
		*/
    start?: string;

    /**
		Run with the `npm start` command, after `start`.
		*/
    poststart?: string;

    /**
		Run with the `npm restart` command, before `restart`. Note: `npm restart` will run the `stop` and `start` scripts if no `restart` script is provided.
		*/
    prerestart?: string;

    /**
		Run with the `npm restart` command. Note: `npm restart` will run the `stop` and `start` scripts if no `restart` script is provided.
		*/
    restart?: string;

    /**
		Run with the `npm restart` command, after `restart`. Note: `npm restart` will run the `stop` and `start` scripts if no `restart` script is provided.
		*/
    postrestart?: string;
  } & Partial<Record<string, string>>;

  /**
		Is used to set configuration parameters used in package scripts that persist across upgrades.
		*/
  config?: unknown;

  /**
		The dependencies of the package.
		*/
  dependencies?: Partial<Record<string, string>>;

  /**
		Additional tooling dependencies that are not required for the package to work. Usually test, build, or documentation tooling.
		*/
  devDependencies?: Partial<Record<string, string>>;

  /**
		Dependencies that are skipped if they fail to install.
		*/
  optionalDependencies?: Partial<Record<string, string>>;

  /**
		Dependencies that will usually be required by the package user directly or via another dependency.
		*/
  peerDependencies?: Partial<Record<string, string>>;

  /**
		Indicate peer dependencies that are optional.
		*/
  peerDependenciesMeta?: Partial<Record<string, { optional: true }>>;

  /**
		Package names that are bundled when the package is published.
		*/
  bundledDependencies?: string[];

  /**
		Alias of `bundledDependencies`.
		*/
  bundleDependencies?: string[];

  /**
    Dependencies for the web application
     */
  webDependencies?: Partial<Record<string, string | true>>;

  /**
		Overrides is used to support selective version overrides using npm, which lets you define custom package versions or ranges inside your dependencies.
		*/
  overrides?: DependencyOverrides;

  /**
		Engines that this package runs on.
		*/
  engines?: {
    [EngineName in "npm" | "node" | string]?: string;
  };

  /**
		Operating systems the module runs on.
		*/
  os?: Array<
    | "aix"
    | "darwin"
    | "freebsd"
    | "linux"
    | "openbsd"
    | "sunos"
    | "win32"
    | "!aix"
    | "!darwin"
    | "!freebsd"
    | "!linux"
    | "!openbsd"
    | "!sunos"
    | "!win32"
    | string
  >;

  /**
		CPU architectures the module runs on.
		*/
  cpu?: Array<
    | "arm"
    | "arm64"
    | "ia32"
    | "mips"
    | "mipsel"
    | "ppc"
    | "ppc64"
    | "s390"
    | "s390x"
    | "x32"
    | "x64"
    | "!arm"
    | "!arm64"
    | "!ia32"
    | "!mips"
    | "!mipsel"
    | "!ppc"
    | "!ppc64"
    | "!s390"
    | "!s390x"
    | "!x32"
    | "!x64"
    | string
  >;

  /**
		Define the runtime and package manager for developing the current project.
		*/
  devEngines?: {
    os?: DevEngineDependency | DevEngineDependency[];
    cpu?: DevEngineDependency | DevEngineDependency[];
    libc?: DevEngineDependency | DevEngineDependency[];
    runtime?: DevEngineDependency | DevEngineDependency[];
    packageManager?: DevEngineDependency | DevEngineDependency[];
  };

  /**
		If set to `true`, then npm will refuse to publish it.
		*/
  private?: boolean;

  /**
		A set of config values that will be used at publish-time. It's especially handy to set the tag, registry or access, to ensure that a given package is not tagged with 'latest', published to the global public registry or that a scoped module is private by default.
		*/
  publishConfig?: {
    /**
      Additional, less common properties from the [npm docs on `publishConfig`](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#publishconfig).
      */
    [additionalProperties: string]: unknown | undefined;

    /**
      When publishing scoped packages, the access level defaults to restricted. If you want your scoped package to be publicly viewable (and installable) set `--access=public`. The only valid values for access are public and restricted. Unscoped packages always have an access level of public.
      */
    access?: "public" | "restricted";

    /**
      The base URL of the npm registry.

      Default: `'https://registry.npmjs.org/'`
      */
    registry?: string;

    /**
      The tag to publish the package under.

      Default: `'latest'`
      */
    tag?: string;
  };

  /**
		Describes and notifies consumers of a package's monetary support information.

		[Read more.](https://github.com/npm/rfcs/blob/main/implemented/0017-add-funding-support.md)
		*/
  funding?:
    | string
    | {
        /**
			The type of funding.
			*/
        type?:
          | "github"
          | "opencollective"
          | "patreon"
          | "individual"
          | "foundation"
          | "corporation"
          | string;

        /**
			The URL to the funding page.
			*/
        url: string;
      };

  /**
		Used to configure [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) / [Yarn workspaces](https://classic.yarnpkg.com/docs/workspaces/).

		Workspaces allow you to manage multiple packages within the same repository in such a way that you only need to run your install command once in order to install all of them in a single pass.

		Please note that the top-level `private` property of `package.json` **must** be set to `true` in order to use workspaces.
		*/
  workspaces?:
    | string[]
    | {
        /**
      An array of workspace pattern strings which contain the workspace packages.
      */
        packages?: string[];

        /**
      Designed to solve the problem of packages which break when their `node_modules` are moved to the root workspace directory - a process known as hoisting. For these packages, both within your workspace, and also some that have been installed via `node_modules`, it is important to have a mechanism for preventing the default Yarn workspace behavior. By adding workspace pattern strings here, Yarn will resume non-workspace behavior for any package which matches the defined patterns.

      [Supported](https://classic.yarnpkg.com/blog/2018/02/15/nohoist/) by Yarn.
      [Not supported](https://github.com/npm/rfcs/issues/287) by npm.
      */
        nohoist?: string[];
      };
};

export function packagePath(
  projectRootUrl: string | URL = new URL("../..", import.meta.url),
) {
  const rootStr = String(projectRootUrl);
  const projectRoot = rootStr.startsWith("file:")
    ? fileURLToPath(projectRootUrl)
    : rootStr;
  return join(projectRoot, "package.json");
}

export async function projectPackage(
  projectRootUrl: string | URL,
  _skipResolutions: boolean = false,
): Promise<ProjectPackage> {
  return JSON.parse(
    await readFile(packagePath(projectRootUrl), "utf8"),
  ) as ProjectPackage;
}
