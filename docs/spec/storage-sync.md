# Storage and sync

All data is written to IndexedDB on the device first. Changes accumulate in a single compacted delta; the server receives them as numbered batches and returns a merged snapshot. Results recorded while offline are counted at the next sync.

## Local storage (D18)

Database `nekotype`, schema version 1. The IndexedDB wrapper is promise-based, dependency-free, about 1 KB.

| Store      | Key                                | Contents                                                                                                                                                                               |
| ---------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `settings` | `current`                          | `Settings`                                                                                                                                                                             |
| `results`  | `id` (indexes `endedAt`, `synced`) | `TestResult` plus `synced: 0 \| 1`, where 1 marks a result acknowledged by the server. A number, because a boolean is not a valid IndexedDB key and such a record would not be indexed |
| `snapshot` | `current`                          | last server snapshot: kana statistics, counters, learning state, personal bests; empty for a guest                                                                                     |
| `delta`    | `current`                          | one accumulator of changes since the last batch: kana statistic increments, counter increments, changed learning entries, unlocked groups, changed settings                            |
| `outbox`   | `seq`                              | at most one batch awaiting acknowledgement                                                                                                                                             |
| `bests`    | `current`                          | `PersonalBests` shown on this device                                                                                                                                                   |
| `meta`     | key                                | `deviceId`, `userId`, `lastSeq`, `schemaVersion`, `syncBlockedAtVersion`, `sessionExpired`                                                                                             |

- **Local view** = `decay(snapshot + outbox delta + delta)`. A batch moves changes out of `delta` until the server acknowledges it, so the view includes `outbox`; without it a signed-in user's statistics would disappear while a batch is unacknowledged. Snapshot and delta are never stored in the same record.
- **Personal bests.** `bests` is updated in the same transaction as the result that set the record, for guests and signed-in users alike. On acknowledgement each entry becomes the maximum of its local and server values. Every local record comes from a result that reaches the server and both sides use the same rule, so they converge.
- **Compaction:** every change is merged into the single `delta` record; nothing is appended per event. Results live only in `results` and are referenced by id when a batch is built.
- **Client-side decay:** when a kana's `attempts` in `delta` exceeds 200, the decay function from `shared` halves its counters in `delta`. This bounds guest data, which never reaches the server. The server applies the same function after adding a delta.
- **Migration:** on first launch, `kanaflow:settings:v1` and `kanaflow:progress:v1` move into IndexedDB as the initial `settings` and `delta`, and the old keys are deleted. Field mapping: `a` → `attempts`; `m` (wrong keystrokes) → `wrongKeys`; `erroredAttempts` = `min(a, m)`; `timeCount` = `min(a, 10)`, `timeSumMs` = `t × timeCount` (the baseline `t` is an EMA). `nekotype:locale` stays in localStorage because the language is needed synchronously before the first render.
- **Settings migration:** `script`, `strictness`, `rowIds`, `weakFocus` and `test` move into `speed` unchanged. `content` maps `single` → `kana`; `words` and `phrases` stay. New fields get defaults: `showTranslation` = true, `learn` = `{ strictness: 'learner', track: 'hiragana' }`, `updatedAt` = 0. Row ids unknown to the table are dropped, as in the baseline. A value that fails validation, or a row list left empty, is replaced by the defaults.
- **Migration safety:** the old keys are deleted only after the IndexedDB transaction commits, so an interrupted migration runs again.
- **Startup:** the application shell renders synchronously; the training screen renders once `settings` has loaded.
- **IndexedDB unavailable** (blocked by the browser or failing to open): the application runs from memory for that page load and shows a notice that data will not be saved; the old keys are not deleted.
- **Hot path:** no IndexedDB writes during a test. Writes happen at the end of a test or lesson, when a test is discarded (the `started` counter only), and on `visibilitychange: hidden`, which also ends a running test (see "Test end" in [Metrics and statistics](metrics.md)).

## Settings

```ts
type Settings = {
  speed: {
    script: 'hiragana' | 'katakana' | 'both';
    content: 'kana' | 'words' | 'phrases';
    strictness: Strictness;
    rowIds: string[];
    weakFocus: boolean;
    test: { kind: 'time'; seconds: number } | { kind: 'count'; prompts: number } | { kind: 'zen' };
    showTranslation: boolean;
  };
  learn: { strictness: Strictness; track: 'hiragana' | 'katakana' };
  updatedAt: number;
};
```

The UI locale is device-local (`nekotype:locale`) and is not synced.

## Merge rules

| Data                         | Rule                                                                                                                                                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Settings                     | Last-write-wins on `updatedAt` for the whole document, except on a batch with `seq` = 1, which is the first batch of a new sign-in: if the account already has settings, the account settings win and the guest settings are discarded |
| Test results                 | Append-only; idempotent by `id`                                                                                                                                                                                                        |
| Kana statistics and counters | Server adds the delta, then applies decay                                                                                                                                                                                              |
| Learning entries             | Last-write-wins on `updatedAt` per kana                                                                                                                                                                                                |
| Unlocked groups              | Union                                                                                                                                                                                                                                  |
| Personal bests               | The server takes the maximum over all results of the batch, whether newly inserted or not, so that applying a batch again changes nothing                                                                                              |
| Content reports              | Sent separately via `POST /api/reports`                                                                                                                                                                                                |

## Batches

1. A new random `deviceId` is generated on every sign-in that starts from guest mode and stored in `meta` with `lastSeq` = 0. The server therefore never sees a reused `deviceId` with a reset `seq`, including after sign-out and sign-in to the same account. Renewing an expired session keeps them (see "Guest, sign-in and sign-out").
2. Sync runs under the Web Lock `nekotype-sync`, so only one tab of a device syncs at a time; all tabs share `deviceId`, `delta` and `outbox`.
3. If `outbox` holds an unacknowledged batch, it is resent unchanged. Otherwise a new batch is built with `seq = lastSeq + 1` from `delta` and up to 200 unsynced results, within 256 KB; it is written to `outbox` and `delta` is cleared in the same transaction.
4. The server keeps the last applied `seq` per `deviceId` and returns it in every sync response. `seq` ≤ last: not applied, the current snapshot is returned. `seq` = last + 1: applied atomically, snapshot returned. `seq` > last + 1: `409` with the server's last `seq`; the client keeps its batch and resends it as last + 1.
5. On acknowledgement the client stores the snapshot, sets `lastSeq`, marks the included results `synced` and clears `outbox`. If unsynced results remain, the next batch is sent 5 seconds later (the server's per-user interval), until none remain.
6. Entries in `user_stats.device_seq` not updated for 90 days are removed on the next write of that row.

## Sync triggers

- On application start, on network reconnect, and 10 seconds after a test or lesson ends.
- On `visibilitychange: hidden`, via `fetch` with `keepalive`. Browsers limit keepalive request bodies to 64 KB, so the body MUST be at most 60 KB. The handler requests the Web Lock `nekotype-sync` with `ifAvailable`; if the lock is held by a running sync, nothing is sent. With the lock: if `outbox` holds a batch, that batch is resent unchanged when it fits in 60 KB, otherwise nothing is sent; if `outbox` is empty, a new batch is built by step 3 from `delta` only, with no results, and sent only if it fits in 60 KB. The response is processed by step 5 if the page is still alive; otherwise the batch stays in `outbox` and the next regular trigger resends it.
- At most one request per 10 seconds per device, except for catch-up batches (step 5 above), which are spaced 5 seconds apart.

## Failed requests

In every case below the data stays in `outbox` and `delta`. Nothing is dropped automatically.

| Response                       | Client behaviour                                                                                                                                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Network error, `5xx`, D1 limit | The next trigger retries. A `503` carrying `Retry-After` is handled like `429`                                                                                                                                        |
| `429`                          | Wait for `Retry-After`, then the next trigger retries                                                                                                                                                                 |
| `409`                          | Resend the batch as last + 1 (step 4)                                                                                                                                                                                 |
| `401`                          | Set `meta.sessionExpired`, stop syncing, keep working locally and show "Sign in again"                                                                                                                                |
| `400`, `413`                   | The batch cannot succeed unchanged. Store the current `appVersion` in `meta.syncBlockedAtVersion`, stop syncing and show the status. Retry only when `appVersion` differs, because a new release may accept the batch |

## History

- `/stats` reads from the local `results` store, newest first, so it works offline and shows unsynced results immediately.
- For a signed-in user, when the local store runs out of results for a page and the network is available, the client requests the next page from `GET /api/results` with the oldest local result as the cursor, and stores the response with `synced` = 1. Inserting by `id` makes this idempotent. A new device therefore fills its history on demand; the sync snapshot does not carry results.
- **Retention:** unsynced results are never evicted, and a guest's results are never evicted, because they are the only copy. For a signed-in user, when the store holds more than 1,000 results, the oldest synced results above that limit are removed after a sync. The server stays the full copy. `bests` does not depend on these rows.

## Guest, sign-in and sign-out

- A guest accumulates changes in `delta` from the first launch. On first sign-in, `delta` goes in the first batch and the guest's results follow in as many batches as needed (step 5). The server merges everything into the account by the rules above. Data from another device is combined, not overwritten.
- **Session state:** at start the client calls `GET /api/me` when `meta.userId` is set or a sign-in redirect has just returned. A `401` follows the `401` rule above; it does not switch the application to guest mode or clear data.
- **Sign-in after an expired session,** compared with `meta.userId`:
  - Same user: `deviceId`, `lastSeq`, `outbox` and `delta` are kept and syncing resumes. Resending under the same `deviceId` keeps the batch idempotent.
  - Different user: the device holds another account's unsent data, which MUST NOT be merged into this account. If any is unsent, a dialog offers to cancel or to discard it. On discard, or if nothing is unsent, all user stores are cleared and the new user starts with no local data. On cancel, the new session is deleted through `POST /api/auth/logout`.
- **OAuth failure:** the callback redirects to `/?auth_error=denied` or `/?auth_error=failed`. The client shows a notice and removes the parameter from the URL.
- **Account deletion** clears all user stores after `DELETE /api/me` succeeds and returns to guest mode.
- **Sign-out** first runs a sync. If unsent data remains (`outbox` or `delta` not empty, or unsynced results), a confirmation dialog states that this data will be lost. After sign-out all user stores on the device are cleared, including `deviceId`, and the application returns to guest mode.
