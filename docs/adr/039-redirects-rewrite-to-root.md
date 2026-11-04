# ADR 039: `_redirects` Rewrites to `/`

- **Status:** In force. Amends the `_redirects` item of [ADR 037](037-router-and-application-shell.md).
- **Context:** ADR 037 rewrote each client-side route to `/index.html` with status 200. On Cloudflare Pages that answers `308` with `Location: /`: Pages redirects `/index.html` to `/`, and the rewrite resolves into that redirect. A reload of `/learn`, `/stats`, `/settings` or `/about` ended on `/` and showed the trainer. The dev server and the unit test did not show it, and the problem reached production with PR #32. It was found by requesting the deployed routes.
- **Decision:**
  - The destination is `/`, with status 200. Checked with the Pages emulator (`wrangler pages dev apps/web/dist`): each route answers `200` with the application shell, `ETag` and `Cache-Control: must-revalidate` of `index.html`, `/index.html` still redirects to `/`, and `/assets/missing.js` and unknown paths still answer `404.html` with status 404.
  - A trailing slash is the same route, as in the router: `/learn/` has its own rule, because Pages does not match it with `/learn`.
  - `redirects.test.ts` fails on any rule whose destination is `/index.html`.
- **Justification:** The destination must be a URL Pages serves without redirecting. A catch-all is still rejected (ADR 037). Alternative rejected: removing `404.html` to get Pages' single-page mode (a missing `/assets/*` file would again answer `index.html`, cached as immutable).
- **Follow-up:** the check that would have caught it is a request to the deployed preview. A post-deploy smoke step in CI (each route answers 200 with the application, a missing asset answers 404) is proposed separately: it changes the workflow.
