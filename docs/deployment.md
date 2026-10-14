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
cp .env.example .env   # optional: PORT, BASE_PATH
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

## Deploying as a static site

The game itself needs no server: everything runs in the browser. `npm run build` bundles `src/client` with esbuild into `dist/` (or `npm run build -- some/dir`), ready for any static host - GitHub Pages, Netlify, an S3 bucket, nginx `root`, `python3 -m http.server`:

```sh
npm run build
npx serve dist   # or any static file server, to try it locally
```

What the build ([src/web/staticBuild.ts](../src/web/staticBuild.ts)) does:

- **HTML** - drops the `<script type="importmap">` (npm packages are bundled in instead) and points each `<script src="*.ts">` at its bundled `.js`. Any other `${...}` template interpolation fails the build, since there's no server to evaluate it.
- **Scripts** - each one is bundled, minified, with a linked source map. A worker referenced as `new URL("./x.ts", import.meta.url)` is bundled as its own `x.js`, and the reference rewritten to match. Output is flat, so entry and worker file names must be unique.
- **Everything else** (CSS, the favicon) is copied as-is; dotfiles are skipped.

All paths are relative, so `dist/` works from any URL prefix without configuration.

## Serving under a path prefix

Set `BASE_PATH` to mount the entire API (REST + WebSocket) under a prefix instead of the domain root - useful when reverse-proxying several apps off one nginx/Caddy/etc host, e.g. `https://example.com/my-app/...` alongside other services at their own paths.

```
BASE_PATH=/my-app
```

What this affects:

- The client and every REST route are mounted under the prefix (`GET /my-app/index.css`, not `GET /index.css`) - requests to the unprefixed path get a normal `404`, they're not silently accepted.

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
| `BASE_PATH`            | no       | _(empty, no prefix)_ | Mounts the whole API under a path prefix. See above.                                                                                   |
