export function shouldAbsorb(
  exts: ReadonlySet<string>,
  completedAt: number,
  now: number,
  key: string,
  windowMs = 250,
): boolean {
  if (now < completedAt) return false;
  if (now - completedAt > windowMs) return false;
  return exts.has(key);
}
