# Backend

The backend is a Hono application running as Cloudflare Pages Functions on the existing Pages project, with a D1 database; sign-in is Google and GitHub only, via the Arctic library. One finished test costs 4–5 written D1 rows.

## Free-tier limits that constrain the design

| Limit                                                                                                                  | Value                                     | Design response                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [CPU per Functions request](https://developers.cloudflare.com/workers/platform/limits)                                 | 10 ms                                     | OAuth only, no password hashing; small JSON documents                                                  |
| Functions requests                                                                                                     | 100,000 per day, shared with Workers Free | `_routes.json` limits Functions to `/api/*`; batched sync at most once per 10 s per device             |
| [D1 reads / writes](https://developers.cloudflare.com/d1/platform/limits)                                              | 5 million / 100,000 rows per day          | Statistics stored as one JSON document per user                                                        |
| D1 database size                                                                                                       | 500 MB                                    | Sufficient for the MVP                                                                                 |
| [D1 over-limit behaviour](https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/) | Queries fail until midnight UTC           | The client keeps data in `outbox` and `delta` and retries later; the application keeps working locally |

**Row budget per finished test:** result row 1 + automatic primary-key index entry 1 (a `TEXT PRIMARY KEY` creates one) + `results_user_time` index entry 1 + `user_stats` 1 + `user_settings` 0–1 = 4–5 rows. The authoritative figure is `meta.rows_written` returned by D1; the acceptance limit is 6. At 6 rows the daily write limit allows about 16,000 tests.

## D1 schema

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY, email TEXT, display_name TEXT, avatar_url TEXT, created_at INTEGER NOT NULL
);
CREATE TABLE oauth_accounts (
  provider TEXT NOT NULL, provider_user_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (provider, provider_user_id)
);
CREATE TABLE sessions (
  id_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE user_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  json TEXT NOT NULL, updated_at INTEGER NOT NULL
);
-- statistics, counters, learning, personal bests and last applied seq per device in one row
CREATE TABLE user_stats (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  kana_stats TEXT NOT NULL, counters TEXT NOT NULL, learn TEXT NOT NULL,
  personal_bests TEXT NOT NULL, device_seq TEXT NOT NULL, last_sync_at INTEGER NOT NULL
);
CREATE TABLE results (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ended_at INTEGER NOT NULL, content TEXT NOT NULL, script TEXT NOT NULL, strictness TEXT NOT NULL,
  config TEXT NOT NULL, kpm REAL NOT NULL, kana_accuracy REAL NOT NULL, json TEXT NOT NULL
);
CREATE INDEX results_user_time ON results(user_id, ended_at DESC);
CREATE TABLE content_reports (
  id TEXT PRIMARY KEY, user_id TEXT, item_id TEXT NOT NULL, content_version TEXT NOT NULL,
  reason TEXT, created_at INTEGER NOT NULL
);
```

`user_stats.device_seq` maps `deviceId` → last applied `seq` (see [Batches](storage-sync.md#batches)).

## API

| Method and path                    | Purpose                                                                                                                                                    |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/auth/:provider`          | Start OAuth (`google` with PKCE, `github`): state cookie and redirect                                                                                      |
| `GET /api/auth/:provider/callback` | Verify state, fetch profile, create or find user, set session, redirect to `/`                                                                             |
| `POST /api/auth/logout`            | Delete session and cookie                                                                                                                                  |
| `GET /api/me`                      | Profile or 401                                                                                                                                             |
| `DELETE /api/me`                   | Delete the account and all its data; set `content_reports.user_id` to NULL for its reports                                                                 |
| `POST /api/sync`                   | Body: `deviceId`, `seq`, batch. Response: snapshot of settings, statistics, counters, learning, personal bests, and the last applied seq for this deviceId |
| `GET /api/sync`                    | Snapshot and the last applied seq for the deviceId query parameter, used after a `409`                                                                     |
| `GET /api/results?before=&limit=`  | Paginated test history (at most 50 per request)                                                                                                            |
| `POST /api/reports`                | Content reports from guests and signed-in users; requires a valid Cloudflare Turnstile token; one report and at most 8 KB per request                      |

## Authentication and security

- **Session:** a random 32-byte token in cookie `kf_session` (`HttpOnly; Secure; SameSite=Lax; Path=/`); D1 stores only its SHA-256 hash. Lifetime 30 days, renewed when less than 15 days remain.
- **CSRF:** `SameSite=Lax` plus an `Origin` header check on every POST and DELETE.
- **Accounts from different providers** are linked by verified email (Google `email_verified`, GitHub primary verified address). Without a verified email a separate account is created.
- **Sync request limits:** body at most 256 KB, at most 200 results per batch, at most one request per 5 s per user (checked against `last_sync_at`, no extra writes). Input is validated with valibot schemas from `shared`.
- **Report abuse:** per-request caps above, plus a Cloudflare Turnstile token verified server-side on every request to `/api/reports`. WAF rate-limiting rules are not used: they require an own DNS zone, and \*.pages.dev is not one. The Turnstile script loads only when the report dialog opens, outside the initial budget.
- Client-submitted results are accepted without server-side verification in the MVP; there are no leaderboards.
- OAuth secrets are stored as Pages project secrets; schema changes are applied via `wrangler d1 migrations`.
- **Local development:** `wrangler pages dev` with a local D1; Vite proxies `/api` to it.

* **Environments:** production binds the production D1. Pages preview deployments bind a separate preview D1 and hide sign-in. OAuth clients:
  - Google: one OAuth client with two registered redirect URIs, for `kana-flow.pages.dev` and for `localhost`. Google does not accept wildcard redirect URIs, so preview subdomains cannot sign in.
  - GitHub: two OAuth Apps, because an OAuth App has one callback URL: one for `kana-flow.pages.dev` (production secrets) and one for `localhost` (development secrets in `.dev.vars`).
  - Turnstile uses separate site keys per environment.
