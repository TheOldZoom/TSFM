export function cacheKey(
  method: string,
  params: Record<string, unknown>,
): string {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${String(params[key])}`)
    .join("&");
  return `${method}?${sorted}`;
}
