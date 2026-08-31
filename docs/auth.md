# Authentication & Authorization

### Creating a GitHub OAuth App

1. GitHub → Settings → Developer settings → OAuth Apps → **New OAuth App**.
2. **Homepage URL**: your server's base URL (e.g. `http://localhost:3000`).
3. **Authorization callback URL**: must exactly match `GITHUB_CALLBACK_URL` in your `.env` (default `http://localhost:3000/auth/github/callback`).
4. Copy the generated **Client ID** and **Client Secret** into `.env`:
   ```
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   GITHUB_CALLBACK_URL=http://{hostname}:3000/auth/github/callback
   ```

### The flow

- `GET /auth/github` - redirects the browser to GitHub's authorize page (with a CSRF `state` value stored in a short-lived signed cookie).
- `GET /auth/github/callback` - GitHub redirects back here with a `code`; the server exchanges it for a GitHub access token, fetches the GitHub user, and upserts a local `users` row keyed by GitHub user id. A signed, httpOnly session cookie (`{project name}.sid`) is then set.
- `GET /auth/me` - returns the current principal (works for either auth method); useful to confirm you're logged in and see your role.
- `POST /auth/logout` - clears the session.

The session cookie is a signed `cookie-session` cookie (HMAC'd with `SESSION_SECRET`, not a server-side session store) - **`SESSION_SECRET` must be set to a long random value**, and rotating it invalidates all existing sessions.


## Roles

There are exactly two roles: `user` and `admin`, stored on the `users.role` column.

- **admin-only endpoints**: all of `/config`.
- **any authenticated principal**: managing your own tokens.

## Becoming an administrator

There is **no** "make me admin" API endpoint by design - role escalation only happens via one of these two paths:

### Path A - bootstrap via `ADMIN_GITHUB_LOGINS` (recommended for the first admin)

Set the `ADMIN_GITHUB_LOGINS` env var to a comma-separated list of GitHub usernames **before** those users first log in:

```
ADMIN_GITHUB_LOGINS=octocat,someteammate
```

This is checked at account-creation time only (`src/api/auth.routes.ts`): the very first time a matching GitHub login completes OAuth, their new `users` row is created with `role: admin`. It has **no effect on users who already have a row** - changing this env var and restarting does not retroactively promote or demote an existing account.

### Path B - promote an existing user directly in the database

If a user already signed in as `role: user` and you want to promote them (or you're not using GitHub OAuth's first-login path at all), update the row directly:

```sql
UPDATE users SET role = 'admin' WHERE github_login = 'someuser';
```

There's a `config`-table-backed runtime config system (`GET/PUT /config`) for other operational settings, but user roles are deliberately **not** exposed through it - that would let a `PUT /config` from a barely-privileged bug or bearer token self-escalate. Promotion is an operator (database) action.

After promotion, the user must either start a fresh session (log out/in) or use a freshly-minted API token - `req.principal.role` is read from the `users` table on every request, though, so an _existing_ session or token will pick up the new role on its very next request without needing to re-authenticate.
