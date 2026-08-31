| Path                                                                   | Description                                                                |
|------------------------------------------------------------------------|----------------------------------------------------------------------------|
| [bin/](../bin)                                                         | CLI scripts                                                                |
| ·  [generate-project-layout.ts](../bin/generate-project-layout.ts)     | Generate markdown source tree with first-line comment and .folder info     |
| ·  [start.ts](../bin/start.ts)                                         | server entrypoint                                                          |
| ·  [sync-web-dependencies.ts](../bin/sync-web-dependencies.ts)         | Sync {package.json}.webDependencies with dependencies                      |
| [docs/](.)                                                             | documentation                                                              |
| [migrations/](../migrations)                                           | database schema and migrations                                             |
| [seeds/](../seeds)                                                     | initial seeds for the database                                             |
| [src/](../src)                                                         | project source                                                             |
| ·  [api/](../src/api)                                                  | API implementations                                                        |
| ·  ·  [auth.routes.ts](../src/api/auth.routes.ts)                      | authentication routes                                                      |
| ·  ·  [config.routes.ts](../src/api/config.routes.ts)                  | runtime config routes                                                      |
| ·  ·  [errorHandler.ts](../src/api/errorHandler.ts)                    | server errors                                                              |
| ·  ·  [router.ts](../src/api/router.ts)                                | root API router                                                            |
| ·  [auth/](../src/auth)                                                | authentication - sessions, tokens, roles, GitHub OAuth                     |
| ·  ·  [github.ts](../src/auth/github.ts)                               | handle github sign-in                                                      |
| ·  ·  [principal.ts](../src/auth/principal.ts)                         | middleware to put user on requests                                         |
| ·  ·  [roles.ts](../src/auth/roles.ts)                                 | middleware to require a role                                               |
| ·  ·  [session.ts](../src/auth/session.ts)                             | session information for express requests                                   |
| ·  ·  [tokens.ts](../src/auth/tokens.ts)                               | generate tokens                                                            |
| ·  [client/](../src/client)                                            | Preact UI, served to the browser                                           |
| ·  ·  [components/](../src/client/components)                          | shared, reusable UI components                                             |
| ·  ·  ·  [Field.ts](../src/client/components/Field.ts)                 | consistent form field                                                      |
| ·  ·  ·  [Header.ts](../src/client/components/Header.ts)               | dashboard page header                                                      |
| ·  ·  ·  [LoginPage.ts](../src/client/components/LoginPage.ts)         | "Log in with GitHub"                                                       |
| ·  ·  ·  [ResourceTable.ts](../src/client/components/ResourceTable.ts) | resource-aware, sortable HTML table component                              |
| ·  ·  ·  [Widget.ts](../src/client/components/Widget.ts)               | dashboard widget wrapper                                                   |
| ·  ·  [hooks/](../src/client/hooks)                                    | Preact hooks for auth and server-backed resources                          |
| ·  ·  ·  [authContext.ts](../src/client/hooks/authContext.ts)          | current user's context                                                     |
| ·  ·  ·  [useResource.ts](../src/client/hooks/useResource.ts)          | helper for accessing server-backed resources                               |
| ·  ·  [schemas/](../src/client/schemas)                                | zod schemas shared between client and API for request/response shapes      |
| ·  ·  ·  [page.schema.ts](../src/client/schemas/page.schema.ts)        | pagination schemas                                                         |
| ·  ·  [util/](../src/client/util)                                      | client-side helpers (html template tag, fetch wrappers, websocket)         |
| ·  ·  ·  [api.ts](../src/client/util/api.ts)                           | helper functions for API access                                            |
| ·  ·  ·  [html.ts](../src/client/util/html.ts)                         | provides `html` template function                                          |
| ·  ·  [App.ts](../src/client/App.ts)                                   | root dashboard component                                                   |
| ·  ·  [index.css](../src/client/index.css)                             | global stylesheet                                                          |
| ·  ·  [index.html](../src/client/index.html)                           | client root document                                                       |
| ·  ·  [index.ts](../src/client/index.ts)                               | Client entrypoint                                                          |
| ·  [config/](../src/config)                                            | env vars and database-backed runtime settings                              |
| ·  ·  [env.ts](../src/config/env.ts)                                   | configuration from the environment                                         |
| ·  ·  [runtimeConfig.ts](../src/config/runtimeConfig.ts)               | settings in the database                                                   |
| ·  ·  [sensitiveFields.ts](../src/config/sensitiveFields.ts)           | Redaction for sensitive fields to be passed to the client                  |
| ·  [db/](../src/db)                                                    | database connection, knex setup, and repositories                          |
| ·  ·  [repositories/](../src/db/repositories)                          | per-table data access                                                      |
| ·  ·  ·  [accessTokens.ts](../src/db/repositories/accessTokens.ts)     | API tokens table                                                           |
| ·  ·  ·  [config.ts](../src/db/repositories/config.ts)                 | general form for repository tables                                         |
| ·  ·  ·  [index.ts](../src/db/repositories/index.ts)                   | export barrel                                                              |
| ·  ·  ·  [listPage.ts](../src/db/repositories/listPage.ts)             | pagination                                                                 |
| ·  ·  ·  [users.ts](../src/db/repositories/users.ts)                   | users table                                                                |
| ·  ·  [connection.ts](../src/db/connection.ts)                         | build connection objects from connection strings                           |
| ·  ·  [json.ts](../src/db/json.ts)                                     | helpers for cross-platform concerns                                        |
| ·  ·  [knex.ts](../src/db/knex.ts)                                     | knex connection management                                                 |
| ·  ·  [knex_sqlite3.d.ts](../src/db/knex_sqlite3.d.ts)                 |                                                                            |
| ·  ·  [NodeSqlite.ts](../src/db/NodeSqlite.ts)                         |                                                                            |
| ·  ·  [types.ts](../src/db/types.ts)                                   | Database row types                                                         |
| ·  [util/](../src/util)                                                | shared, dependency-free helpers used across the app                        |
| ·  ·  [searchQuery/](../src/util/searchQuery)                          | tokenizer/parser/compiler for the search query language                    |
| ·  ·  ·  [asBadRequest.ts](../src/util/searchQuery/asBadRequest.ts)    | cast errors from a function as a bad request                               |
| ·  ·  ·  [ast.ts](../src/util/searchQuery/ast.ts)                      | search query AST                                                           |
| ·  ·  ·  [compile.ts](../src/util/searchQuery/compile.ts)              | search query compiler                                                      |
| ·  ·  ·  [parser.ts](../src/util/searchQuery/parser.ts)                | search query parser                                                        |
| ·  ·  ·  [tokenizer.ts](../src/util/searchQuery/tokenizer.ts)          | search query lexer                                                         |
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
| ·  ·  [typescriptAssets.ts](../src/web/typescriptAssets.ts)            | Serve .ts as stripped .mjs                                                 |
| ·  ·  [webDependencies.ts](../src/web/webDependencies.ts)              | dealing with .webDependencies                                              |
| ·  [hup.ts](../src/hup.ts)                                             | Canary file for restarting the server; touch this to restart               |
| ·  [index.ts](../src/index.ts)                                         | Service entrypoint                                                         |
| ·  [server.ts](../src/server.ts)                                       | Constructs the webserver                                                   |
| [test/](../test)                                                       | test cases                                                                 |
| ·  [integration/](../test/integration)                                 | real Express app + sqlite in-memory DB via knex                            |
| ·  [unit/](../test/unit)                                               | pure functions, UI components, no DB                                       |
| [.env.example](../.env.example)                                        | Copy this file to .env (or .env.development / .env.production / .env.test) |
| [.gitignore](../.gitignore)                                            | Files ignored by the project                                               |
| [.nvmrc](../.nvmrc)                                                    | nvm version spec                                                           |
| [eslint.config.js](../eslint.config.js)                                | basic eslint configuration                                                 |
| [knexfile.ts](../knexfile.ts)                                          | config file for knex                                                       |
| [package-lock.json](../package-lock.json)                              | node dependency lockfile                                                   |
| [package.json](../package.json)                                        | node package doc                                                           |
| [README.md](../README.md)                                              | Main documentation                                                         |
| [tsconfig.json](../tsconfig.json)                                      | TypeScript configuration                                                   |
