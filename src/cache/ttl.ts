export const DEFAULT_TTL_MS: Record<string, number> = {
  "image.page": 30 * 24 * 60 * 60 * 1000,
};

export function ttlFor(method: string): number {
  return DEFAULT_TTL_MS[method] ?? 30 * 24 * 60 * 60 * 1000;
}
