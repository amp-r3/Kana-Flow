import type { ReadonlySignal } from '@preact/signals';
import { signal } from '@preact/signals';
import type { ComponentType } from 'preact';
import type { RoutePath } from './route-paths';
import { EAGER_ROUTES, routes } from './routes';

// The screens loaded so far, and the routes whose chunk failed to load.
const _loaded = signal<ReadonlyMap<RoutePath, ComponentType>>(new Map(EAGER_ROUTES));
const _failed = signal<ReadonlySet<RoutePath>>(new Set());
const inflight = new Map<RoutePath, Promise<void>>();

export const loadedRoutes: ReadonlySignal<ReadonlyMap<RoutePath, ComponentType>> = _loaded;
export const failedRoutes: ReadonlySignal<ReadonlySet<RoutePath>> = _failed;

/** Loads the screen of a route once. A failure is recorded, not thrown, and a later call retries. */
export function ensureRoute(path: RoutePath): Promise<void> {
  if (_loaded.value.has(path)) return Promise.resolve();
  const pending = inflight.get(path);
  if (pending) return pending;

  _failed.value = new Set([..._failed.value].filter((failed) => failed !== path));
  const request = routes[path]
    .load()
    .then((page) => {
      _loaded.value = new Map(_loaded.value).set(path, page);
    })
    .catch(() => {
      _failed.value = new Set(_failed.value).add(path);
    })
    .finally(() => {
      inflight.delete(path);
    });
  inflight.set(path, request);
  return request;
}
