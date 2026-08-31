# Database

The app and the `knex` CLI both read a single `DATABASE_URL` (see [src/db/connection.ts](../src/db/connection.ts)); its scheme selects the driver, so there's one connection string to configure instead of a separate scheme per client.

| `DATABASE_URL` value                 | Driver           | Notes                                                              |
| ------------------------------------- | ---------------- | ------------------------------------------------------------------- |
| `mysql://user:pass@host:3306/dbname`  | `mysql2`         | `mysql:`/`mysql2:` both accepted; default port `3306` if omitted.  |
| `postgres://user:pass@host:5432/dbname` | `pg`           | `postgres:`/`postgresql:`/`pg:` all accepted; default port `5432`. |
| `./relative/path.sqlite3`             | `better-sqlite3` | Resolved relative to the process's cwd. File is created if missing. |
| `:memory:`                            | `better-sqlite3` | In-memory only - used automatically for `NODE_ENV=test`.            |

## Migrations

```sh
npm run migrate           # apply pending migrations (knex migrate:latest)
npm run migrate:make <name>  # scaffold a new migration under migrations/
```

On a fresh database, `src/index.ts` also runs migrations automatically on first boot (see [docs/deployment.md](deployment.md#operational-notes)) - `npm run migrate` is the explicit path for upgrading an already-initialized database.

## Seeds

```sh
npm run seed
```

Seed files live under `seeds/`; `knexfile.ts` points the `development` environment at `seeds/dev`.
