# Deployment

## Loading configuration

On startup, `src/index.ts` looks for an env file to load (via Node's native `process.loadEnvFile`) in this order, using the **first one that exists**:

1. `.env.${NODE_ENV}` - e.g. `.env.production`, `.env.test` - lets you keep separate config per environment side by side in the same checkout.
2. `.env` - the plain fallback.
3. **Neither** - silently skipped. This is the normal case under most PaaS platforms, where the platform injects environment variables directly into the process and no `.env` file exists on disk at all; `loadEnv()` then just reads whatever's already in `process.env`.

Variables already present in `process.env` are never overridden by a loaded file (Node's own `loadEnvFile` behavior) - so shell/platform-injected values always win over anything in a `.env*` file.

## Deploying as a systemd service

The app can run as a **user-level** systemd service via [`sdn`](https://github.com/Fordi/sdn#sdn) (`@fordi-org/sdn`), a zero-config wrapper that generates a unit file from `package.json` and links it with `systemctl --user`. See sdn's own README for what it is and its full verb list (`install`, `uninstall`, `control <verb>`, `logs`); this repo only scripts the common path as `svc:*` in `package.json`:

```sh
cp .env.example .env
# fill in SESSION_SECRET, GITHUB_CLIENT_ID/SECRET, ADMIN_GITHUB_LOGINS, DATABASE_URL
npm install
npm run svc:install   # generates and links the unit
npm run svc:start
npm run svc:logs      # live-tails the service's journal (x or Esc to exit)
```

`svc:install` (`sdn install --force`) derives the service name from `package.json`'s `name` and the entrypoint from `.main` (`bin/start.ts`), writes `{name}.service` into the repo root, and `systemctl --user link`s it into `~/.config/systemd/user/`. `--force` overwrites a previously-linked unit instead of erroring if one already exists, which is why `svc:install` is safe to re-run after a config change (e.g. adding an `After=` dependency via `package.json`'s `systemd` field) or after moving the checkout to a new path. `WorkingDirectory` is set to the repo root, so [the `.env`/`.env.production` loading described above](#loading-configuration) works exactly as it does when running `npm start` by hand from that directory. The generated `my-app.service` in the repo root is a staging artifact `systemctl --user link` reads once - the real unit lives under `~/.config/systemd/user/` afterward, not in the checkout, which is why it's gitignored rather than deleted by the script.

**The service runs under `nodemon`, not `node` directly** (sdn wraps the entrypoint in nodemon internally) - the process auto-restarts both on crash and whenever a watched source file changes. That's convenient for iterating in place on a VM, but it means an in-place `git pull` on a running deployment triggers a restart on its own; no separate `svc:stop`/`svc:start` cycle is needed after pulling new code, only after changing `.env` (env vars are still only read once, at process start).

### Starting on boot / after logout

`sdn install` only links the unit - it does not enable it, and this is a **user** unit, so two extra steps make the service durable across reboots and after your SSH session ends:

```sh
systemctl --user enable my-app     # start automatically on future logins/boots
loginctl enable-linger "$USER"      # let user units run without an active login session
```

Without `enable-linger`, the service stops as soon as your last session for that user logs out - fine for a quick foreground test via `svc:start`, not for a real deployment. From here, ordinary `systemctl --user` / `journalctl --user-unit` verbs (`status`, `restart`, `stop`, ...) work directly against the unit (named by `name` in package.json) - see `man systemctl`, or [sdn's README](https://github.com/Fordi/sdn#sdn) for its `sdn control <verb>` pass-through shorthand.

### Migrations under systemd

There's no automated migration step chained before a restart - `src/index.ts`'s own **first-boot auto-migration** (see [Operational notes](#operational-notes) below) still covers a fresh database automatically, but upgrading an already-initialized deployment needs an explicit, separate step:

```sh
npm run migrate
npx @fordi-org/sdn control restart
```

## Serving under a path prefix

Set `BASE_PATH` to mount the entire API (REST + WebSocket) under a prefix instead of the domain root - useful when reverse-proxying several apps off one nginx/Caddy/etc host, e.g. `https://example.com/my-app/...` alongside other services at their own paths.

```
BASE_PATH=/my-app
```

What this affects:

- Every REST route is mounted under the prefix (`GET /my-app/config`, not `GET /config`) - requests to the unprefixed path get a normal `404`, they're not silently accepted.
- The session cookie's `path` is scoped to the prefix, so it isn't sent on requests to other apps sharing the same domain.
- WebSocket upgrade requests are only accepted on the configured prefix; an upgrade attempt outside it is rejected at the socket level before authentication even runs.
- The post-login HTML redirect (after a successful GitHub OAuth callback) goes to `{BASE_PATH}/` instead of `/`.

**`GITHUB_CALLBACK_URL` must include the prefix yourself** - it's a full absolute URL you configure independently (and it must match what you registered in the GitHub OAuth App), e.g.:

```
BASE_PATH=/my-app
GITHUB_CALLBACK_URL=https://example.com/my-app/auth/github/callback
```

### Example nginx config

```nginx
location ^~ /my-app/ {
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto https;
  proxy_set_header Host $http_host;
  proxy_http_version 1.1;

  # required for the WebSocket upgrade to pass through
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";

  proxy_pass http://127.0.0.1:3000;
}
```

Because the app's own routing already expects the `BASE_PATH` prefix, `proxy_pass` here should **not** strip it (no trailing `/` after the upstream address/port) - the full incoming path, prefix included, is forwarded straight through and matched by the app itself.

## Environment variables reference

| Variable               | Required | Default              | Notes                                                                                                                                  |
| ---------------------- | -------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`             | no       | `development`        | `development \| test \| production`                                                                                                    |
| `PORT`                 | no       | `3000`               |                                                                                                                                        |
| `SESSION_SECRET`       | **yes**  | -                    | Min 16 chars. Signs the session cookie; rotating it logs everyone out.                                                                 |
| `GITHUB_CLIENT_ID`     | **yes**  | -                    | From your GitHub OAuth App.                                                                                                            |
| `GITHUB_CLIENT_SECRET` | **yes**  | -                    | From your GitHub OAuth App.                                                                                                            |
| `GITHUB_CALLBACK_URL`  | **yes**  | -                    | Must exactly match the OAuth App's configured callback URL, including `BASE_PATH` if set.                                              |
| `DATABASE_URL`         | **yes**  | -                    | Its scheme selects the driver (`mysql://` / `postgres://` / a relative sqlite path / `:memory:`). See [docs/database.md](database.md). |
| `ADMIN_GITHUB_LOGINS`  | no       | _(empty)_            | Comma-separated GitHub logins bootstrapped to `admin` on first login. See [docs/auth.md](auth.md#becoming-an-administrator).           |
| `BASE_PATH`            | no       | _(empty, no prefix)_ | Mounts the whole API under a path prefix. See above.                                                                                   |

## Operational notes

- **First-boot auto-migration**: `src/index.ts` checks whether the `config` table exists on startup and runs `knex.migrate.latest()` automatically if not, so a fresh database self-initializes on first `npm start`/container boot. `npm run migrate` remains the explicit way to apply new migrations to an already-initialized database after an upgrade.
