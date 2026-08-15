export function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () =>
    new Array(cols).fill(0),
  );

  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[a.length][b.length];
}

export function suggestClosest(
  input: string,
  candidates: Iterable<string>,
  maxDistance = 2,
): string[] {
  const lowerInput = input.toLowerCase();

  const scored = [...new Set(candidates)]
    .map((candidate) => ({
      candidate,
      distance: levenshtein(lowerInput, candidate.toLowerCase()),
    }))
    .filter(({ distance }) => distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);

  if (scored.length === 0) return [];

  const best = scored[0].distance;
  return scored.filter((s) => s.distance === best).map((s) => s.candidate);
}

export function didYouMean(suggestions: string[]): string {
  if (suggestions.length === 0) return "";
  if (suggestions.length === 1) return `Did you mean "${suggestions[0]}"?`;
  return `Did you mean one of: ${suggestions.map((s) => `"${s}"`).join(", ")}?`;
}
