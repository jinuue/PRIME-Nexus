export function navigateLegacy(hash: string): void {
  window.APP?.navigate?.(hash);
}

export function renderLegacy(): void {
  window.APP?.render?.();
}

export function getLegacyUser<T = unknown>(): T | null {
  return (window.APP?.user as T) ?? null;
}
