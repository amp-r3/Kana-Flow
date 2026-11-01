# Storage and sync

All data is written to IndexedDB on the device first. Changes accumulate in a single compacted delta; the server receives them as numbered batches and returns a merged snapshot. Results recorded while offline are counted at the next sync.

## Local storage (D18)

Database `kanaflow`, schema version 1. The IndexedDB wrapper is promise-based, dependency-free, about 1 KB.

| Store      | Key                                | Contents                                                                                                                                   |
| ---------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `settings` | `current`                          | `Settings`                                                                                                                                 |
| `results`  | `id` (indexes `endedAt`, `synced`) | `TestResult`; `synced` marks results acknowledged by the server                                                                            |
| `snapshot` | `current`                          | last server snapshot: kana statistics, counters, learning state, personal bests                                                            |
| `delta`    | `current`                          | one accumulator of changes since the last batch: kana statistic increments, counter increments, changed learning entries, changed settings |
| `outbox`   | `seq`                              | at most one batch awaiting acknowledgement                                                                                                 |
| `meta`     | key                                | `deviceId`, `userId`, `lastSeq`, `schemaVersion`                                                                                           |

- **Local view** = `decay(snapshot + delta)`. Snapshot and delta are never stored in the same record.
- **Compaction:** every change is merged into the single `delta` record; nothing is appended per event. Results live only in `results` and are referenced by id when a batch is built.
- **Client-side decay:** when a kana's `attempts` in `delta` exceeds 200, the decay function from `shared` halves its counters in `delta`. This bounds guest data, which never reaches the server. The server applies the same function after adding a delta.
- **Migration:** on first launch, `kanaflow:settings:v1` and `kanaflow:progress:v1` move into IndexedDB as the initial `settings` and `delta`, and the old keys are deleted. Field mapping: `a` → `attempts`; `m` (wrong keystrokes) → `wrongKeys`; `erroredAttempts` = `min(a, m)`; `timeCount` = `min(a, 10)`, `timeSumMs` = `t × timeCount` (the baseline `t` is an EMA). `kanaflow:locale` stays in localStorage because the language is needed synchronously before the first render.
- **Hot path:** no IndexedDB writes during a test. Writes happen at the end of a test or lesson and on `visibilitychange: hidden`.

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

The UI locale is device-local (`kanaflow:locale`) and is not synced.

## Merge rules

| Data                         | Rule                                                                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Settings                     | Last-write-wins on `updatedAt` for the whole document, except on the first batch of a new sign-in: if the account already has settings, the account settings win and the guest settings are discarded |
| Test results                 | Append-only; idempotent by `id`                                                                                                                                                                       |
| Kana statistics and counters | Server adds the delta, then applies decay                                                                                                                                                             |
| Learning entries             | Last-write-wins on `updatedAt` per kana                                                                                                                                                               |
| Unlocked groups              | Union                                                                                                                                                                                                 |
| Personal bests               | Recomputed by the server from inserted results                                                                                                                                                        |
| Content reports              | Sent separately via `POST /api/reports`                                                                                                                                                               |

## Batches

1. A new random `deviceId` is generated on every sign-in and stored in `meta` with `lastSeq` = 0. The server therefore never sees a reused `deviceId` with a reset `seq`, including after sign-out and sign-in to the same account.
2. Sync runs under the Web Lock `kanaflow-sync`, so only one tab of a device syncs at a time; all tabs share `deviceId`, `delta` and `outbox`.
3. If `outbox` holds an unacknowledged batch, it is resent unchanged. Otherwise a new batch is built with `seq = lastSeq + 1` from `delta` and up to 200 unsynced results, within 256 KB; it is written to `outbox` and `delta` is cleared in the same transaction.
4. The server keeps the last applied `seq` per `deviceId` and returns it in every sync response. `seq` ≤ last: not applied, the current snapshot is returned. `seq` = last + 1: applied atomically, snapshot returned. `seq` > last + 1: `409` with the server's last `seq`; the client keeps its batch and resends it as last + 1.
5. On acknowledgement the client stores the snapshot, sets `lastSeq`, marks the included results `synced` and clears `outbox`. If unsynced results remain, the next batch is sent 5 seconds later (the server's per-user interval), until none remain.
6. Entries in `user_stats.device_seq` not updated for 90 days are removed on the next write of that row.

## Sync triggers

- On application start, on network reconnect, and 10 seconds after a test or lesson ends.
- On `visibilitychange: hidden`, via `fetch` with `keepalive`. Browsers limit keepalive request bodies to 64 KB, so the body MUST be at most 60 KB. The handler requests the Web Lock `kanaflow-sync` with `ifAvailable`; if the lock is held by a running sync, nothing is sent. With the lock: if `outbox` holds a batch, that batch is resent unchanged when it fits in 60 KB, otherwise nothing is sent; if `outbox` is empty, a new batch is built by step 3 from `delta` only, with no results, and sent only if it fits in 60 KB. The response is processed by step 5 if the page is still alive; otherwise the batch stays in `outbox` and the next regular trigger resends it.
- At most one request per 10 seconds per device, except for catch-up batches (step 5 above), which are spaced 5 seconds apart.
- On a failed request (network error, `5xx`, D1 limit) or `429`, data stays in `outbox` and `delta`. After `429` the client waits for `Retry-After`; otherwise the next trigger retries.

## Guest, sign-in and sign-out

- A guest accumulates changes in `delta` from the first launch. On first sign-in, `delta` goes in the first batch and the guest's results follow in as many batches as needed (step 5). The server merges everything into the account by the rules above. Data from another device is combined, not overwritten.
- **Sign-out** first runs a sync. If unsent data remains (`outbox` or `delta` not empty, or unsynced results), a confirmation dialog states that this data will be lost. After sign-out all user stores on the device are cleared, including `deviceId`, and the application returns to guest mode.
