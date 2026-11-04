import type { ComponentType, JSX } from 'preact';
import { TrainerPage } from '@/pages/trainer';
import type { RoutePath } from './route-paths';

export type Route = {
  // Resolves to the screen. Every route but `/` is a dynamic import, so it is a separate chunk.
  readonly load: () => Promise<ComponentType>;
};

// `/` is in the initial chunk; it is the screen the application opens on.
function TrainerRoute(): JSX.Element {
  return <TrainerPage />;
}

export const EAGER_ROUTES: readonly (readonly [RoutePath, ComponentType])[] = [['/', TrainerRoute]];

export const routes: Readonly<Record<RoutePath, Route>> = {
  '/': { load: () => Promise.resolve(TrainerRoute) },
  '/learn': { load: () => import('@/pages/learn').then((m) => m.LearnPage) },
  '/stats': { load: () => import('@/pages/stats').then((m) => m.StatsPage) },
  '/settings': { load: () => import('@/pages/settings').then((m) => m.SettingsPage) },
  '/about': { load: () => import('@/pages/about').then((m) => m.AboutPage) },
};
