# Deployment

## Loading configuration

On startup, `src/index.ts` looks for an env file to load (via Node's native `process.loadEnvFile`) in this order, using the **first one that exists**:

1. `.env.${NODE_ENV}` - e.g. `.env.production`, `.env.test` - lets you keep separate config per environment side by side in the same checkout.
2. `.env` - the plain fallback.
3. **Neither** - silently skipped. This is the normal case under most PaaS platforms, where the platform injects environment variables directly into the process and no `.env` file exists on disk at all; `loadEnv()` then just reads whatever's already in `process.env`.

Variables already present in `process.env` are never overridden by a loaded file (Node's own `loadEnvFile` behavior) - so shell/platform-injected values always win over anything in a `.env*` file.

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

## Environment variables reference

| Variable   | Required | Default       | Notes                               |
| ---------- | -------- | ------------- | ----------------------------------- |
| `NODE_ENV` | no       | `development` | `development \| test \| production` |
| `PORT`     | no       | `3000`        |                                     |
