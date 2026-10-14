# Development

## Native TypeScript, no build step

The server for this project runs `.ts` source directly via Node's native TypeScript support (v24.18.0+) - there is no compile/bundle step for the server. Two constraints fall out of that:

- **`erasableSyntaxOnly`** (see [tsconfig.json](../tsconfig.json)) is on, so only TypeScript syntax that Node can strip at parse time is allowed - no `enum`, no parameter-property shorthand (`constructor(private x: string)`), no `namespace`. Use plain classes/objects/interfaces instead.
- Imports must include the `.ts` extension (`allowImportingTsExtensions`), matching how Node itself resolves them at runtime.

The client is different: browser code is served through [src/web/typescriptAssets.ts](../src/web/typescriptAssets.ts), which strips types from `.ts` files per-request (no bundler, no build, no cache) - so the same constraints apply there too.

There is a build step available, so as to run the client as a static page without `.ts` type stripping.  Running `npm run build` will output to `./dist`.

## Running tests

```sh
npm test              # full suite (node --test)
npm run only          # only tests marked with `.only`
npm run coverage      # c8 coverage report (html + lcov) under coverage/
```

- [test/unit/](../test/unit) - pure functions and UI components, no DB.
- [test/integration/](../test/integration) - a real Express app driven via supertest ([test/integration/helpers/testApp.ts](../test/integration/helpers/testApp.ts) builds the app with a fixed `TEST_ENV`).

## Adding an API route

Routes are built with [TrackedRouter](../src/util/trackedRouter.ts) and [typedVia](../src/util/typedVia.ts) so each route's params/body/response are validated with `zod` and discoverable via reflection (see [src/util/inspectRouter.ts](../src/util/inspectRouter.ts)). Mount the new router in [src/api/router.ts](../src/api/router.ts).

## Linting and formatting

```sh
npm run lint         # eslint .
npm run lint:fix      # eslint --fix, then regenerates docs/project-layout.md
npm run format        # prettier --write .
npm run format:check
```

`docs/project-layout.md` is generated from source comments and `.folder` files - see the doc comment at the top of [bin/generate-project-layout.ts](../bin/generate-project-layout.ts) for the format, and re-run `npm run lint:fix` (or `node bin/generate-project-layout.ts` directly) after adding/removing/renaming files.
