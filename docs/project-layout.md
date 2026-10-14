| Path                                                                   | Description                                                                |
|------------------------------------------------------------------------|----------------------------------------------------------------------------|
| [bin/](../bin)                                                         | CLI scripts                                                                |
| ·  [build-static.ts](../bin/build-static.ts)                           | build the client as a static site (default: dist/)                         |
| ·  [generate-project-layout.ts](../bin/generate-project-layout.ts)     | Generate markdown source tree with first-line comment and .folder info     |
| ·  [start.ts](../bin/start.ts)                                         | server entrypoint                                                          |
| ·  [sync-web-dependencies.ts](../bin/sync-web-dependencies.ts)         | Sync {package.json}.webDependencies with dependencies                      |
| [docs/](.)                                                             | documentation                                                              |
| [src/](../src)                                                         | project source                                                             |
| ·  [api/](../src/api)                                                  | API implementations                                                        |
| ·  ·  [errorHandler.ts](../src/api/errorHandler.ts)                    | server errors                                                              |
| ·  ·  [router.ts](../src/api/router.ts)                                | root API router                                                            |
| ·  [client/](../src/client)                                            | Preact UI, served to the browser                                           |
| ·  ·  [components/](../src/client/components)                          | shared, reusable UI components                                             |
| ·  ·  ·  [Field.ts](../src/client/components/Field.ts)                 | consistent form field                                                      |
| ·  ·  ·  [Header.ts](../src/client/components/Header.ts)               | page header                                                                |
| ·  ·  ·  [Huedoku.ts](../src/client/components/Huedoku.ts)             | huedoku game board                                                         |
| ·  ·  ·  [ResourceTable.ts](../src/client/components/ResourceTable.ts) | resource-aware, sortable HTML table component                              |
| ·  ·  ·  [Widget.ts](../src/client/components/Widget.ts)               | dashboard widget wrapper                                                   |
| ·  ·  [game/](../src/client/game)                                      | game logic (pure, DOM-free)                                                |
| ·  ·  ·  [generate.worker.ts](../src/client/game/generate.worker.ts)   | web worker that generates puzzles off the main thread                      |
| ·  ·  ·  [grade.ts](../src/client/game/grade.ts)                       | grade puzzles by the deductions a person needs to solve them               |
| ·  ·  ·  [huedoku.ts](../src/client/game/huedoku.ts)                   | huedoku puzzle generation, solving, and game-state transitions             |
| ·  ·  ·  [puzzleWorker.ts](../src/client/game/puzzleWorker.ts)         | generate puzzles without blocking the UI                                   |
| ·  ·  ·  [score.ts](../src/client/game/score.ts)                       | points for each thing the player does                                      |
| ·  ·  ·  [storage.ts](../src/client/game/storage.ts)                   | save and restore the game in localStorage                                  |
| ·  ·  [hooks/](../src/client/hooks)                                    | Preact hooks for server-backed resources                                   |
| ·  ·  ·  [useResource.ts](../src/client/hooks/useResource.ts)          | helper for accessing server-backed resources                               |
| ·  ·  [schemas/](../src/client/schemas)                                | zod schemas shared between client and API for request/response shapes      |
| ·  ·  ·  [page.schema.ts](../src/client/schemas/page.schema.ts)        | pagination schemas                                                         |
| ·  ·  [util/](../src/client/util)                                      | client-side helpers (html template tag, fetch wrappers, websocket)         |
| ·  ·  ·  [api.ts](../src/client/util/api.ts)                           | helper functions for API access                                            |
| ·  ·  ·  [haptics.ts](../src/client/util/haptics.ts)                   | haptic feedback, where the browser supports it                             |
| ·  ·  ·  [html.ts](../src/client/util/html.ts)                         | provides `html` template function                                          |
| ·  ·  [App.ts](../src/client/App.ts)                                   | root component                                                             |
| ·  ·  [favicon.svg](../src/client/favicon.svg)                         | site icon: four region colors, one found                                   |
| ·  ·  [index.css](../src/client/index.css)                             | global stylesheet                                                          |
| ·  ·  [index.html](../src/client/index.html)                           | client root document                                                       |
| ·  ·  [index.ts](../src/client/index.ts)                               | Client entrypoint                                                          |
| ·  [config/](../src/config)                                            | env vars and database-backed runtime settings                              |
| ·  ·  [env.ts](../src/config/env.ts)                                   | configuration from the environment                                         |
| ·  [util/](../src/util)                                                | shared, dependency-free helpers used across the app                        |
| ·  ·  [dottedPath.ts](../src/util/dottedPath.ts)                       | helpers for redacting sensitive content                                    |
| ·  ·  [errors.ts](../src/util/errors.ts)                               | HTTP and other API errors                                                  |
| ·  ·  [handle.ts](../src/util/handle.ts)                               | UUID, but terse                                                            |
| ·  ·  [inspectRouter.ts](../src/util/inspectRouter.ts)                 | reflection for express router                                              |
| ·  ·  [package.ts](../src/util/package.ts)                             | typedefs for package.json                                                  |
| ·  ·  [params.ts](../src/util/params.ts)                               | parameter validation                                                       |
| ·  ·  [toFilename.ts](../src/util/toFilename.ts)                       | Slug a string to a valid filename                                          |
| ·  ·  [trackedRouter.ts](../src/util/trackedRouter.ts)                 | Helper to make API discoverable from router                                |
| ·  ·  [typedVia.ts](../src/util/typedVia.ts)                           | Uses zod to make request typing explicit                                   |
| ·  ·  [via.ts](../src/util/via.ts)                                     | Helper function for express request handlers                               |
| ·  [web/](../src/web)                                                  | serving the dashboard's HTML/JS/npm-dependency assets                      |
| ·  ·  [htmlTemplates.ts](../src/web/htmlTemplates.ts)                  | Serve HTML as template literals                                            |
| ·  ·  [importMap.ts](../src/web/importMap.ts)                          | Generate an import map                                                     |
| ·  ·  [moduleServer.ts](../src/web/moduleServer.ts)                    | Serve NPM modules listed under .webDependencies                            |
| ·  ·  [staticBuild.ts](../src/web/staticBuild.ts)                      | Build the client as a static site                                          |
| ·  ·  [typescriptAssets.ts](../src/web/typescriptAssets.ts)            | Serve .ts as stripped .mjs                                                 |
| ·  ·  [webDependencies.ts](../src/web/webDependencies.ts)              | dealing with .webDependencies                                              |
| ·  [hup.ts](../src/hup.ts)                                             | Canary file for restarting the server; touch this to restart               |
| ·  [index.ts](../src/index.ts)                                         | Service entrypoint                                                         |
| ·  [server.ts](../src/server.ts)                                       | Constructs the webserver                                                   |
| [test/](../test)                                                       | test cases                                                                 |
| ·  [integration/](../test/integration)                                 | real Express app, driven via supertest                                     |
| ·  ·  [helpers/](../test/integration/helpers)                          |                                                                            |
| ·  ·  ·  [testApp.ts](../test/integration/helpers/testApp.ts)          |                                                                            |
| ·  ·  [basePath.test.ts](../test/integration/basePath.test.ts)         |                                                                            |
| ·  [unit/](../test/unit)                                               | pure functions, UI components, no DB                                       |
| [.env.example](../.env.example)                                        | Copy this file to .env (or .env.development / .env.production / .env.test) |
| [.gitignore](../.gitignore)                                            | Files ignored by the project                                               |
| [.nvmrc](../.nvmrc)                                                    | nvm version spec                                                           |
| [eslint.config.js](../eslint.config.js)                                | basic eslint configuration                                                 |
| [package-lock.json](../package-lock.json)                              | node dependency lockfile                                                   |
| [package.json](../package.json)                                        | node package doc                                                           |
| [README.md](../README.md)                                              | Main documentation                                                         |
| [tsconfig.json](../tsconfig.json)                                      | TypeScript configuration                                                   |
