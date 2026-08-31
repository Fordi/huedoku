# spinnerette

A project template for a webserver with GitHub as primary authentication, a Preact dashboard, and no build step.

## Using this template

Click **Use this template** on GitHub (or `gh repo create my-app --template <owner>/spinnerette`) to create a new repository seeded from this one, then:

1. Rename `"name"` in [package.json](package.json) from `"my-app"` to your project's name - it drives the process title, the systemd service name (see [docs/deployment.md](docs/deployment.md)), and the session cookie name (see [docs/auth.md](docs/auth.md)).
2. Replace the `<h1>My App</h1>` in [src/client/components/Header.ts](src/client/components/Header.ts) and the `<title>` in [src/client/index.html](src/client/index.html) with your app's name.
3. Follow the quick start below.

## Quick start

Requires Node.js **v24.18.0+** (native TypeScript execution, no build step). If you use [nvm](https://github.com/nvm-sh/nvm):

```sh
nvm install
nvm use
```

Install dependencies and copy the example env file:

```sh
npm install
cp .env.example .env
```

Fill in `.env` (see [docs/auth.md](docs/auth.md) for creating a GitHub OAuth App and [docs/database.md](docs/database.md) for `DATABASE_URL`), then run migrations and start the server:

```sh
npm run migrate
npm start
```

The server listens on `PORT` (default `3000`).

To become an admin, add your GitHub username to `ADMIN_GITHUB_LOGINS` in `.env` **before** your first login - see [docs/auth.md](docs/auth.md#becoming-an-administrator) for full detail on how this works and how to promote a user after the fact.

## Documentation

- [docs/auth.md](docs/auth.md) - OAuth setup, API tokens, roles, becoming an administrator
- [docs/database.md](docs/database.md) - configuring MySQL, Postgres, or SQLite
- [docs/deployment.md](docs/deployment.md) - Docker, environment variables, operational notes
- [docs/development.md](docs/development.md) - running tests, adding a route or table, native-TS constraints
- [docs/project-layout.md](docs/project-layout.md) - project layout
