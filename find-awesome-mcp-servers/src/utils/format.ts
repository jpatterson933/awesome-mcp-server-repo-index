import { EnrichedRepo, MetricType } from "../schema/github.js";
import { LEADERBOARD_SIZE, MAX_DESCRIPTION_LENGTH } from "../markdown/theme.js";

export function sanitizeDescription(description: string | null): string {
  return (description || "-")
    .replace(/\|/g, "-")
    .replace(/\n/g, " ")
    .replace(/\r/g, "");
}

export function truncateDescription(description: string | null): string {
  const sanitized = sanitizeDescription(description);
  if (sanitized.length <= MAX_DESCRIPTION_LENGTH) return sanitized;
  return sanitized.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd() + "...";
}

export function topTenByMetric(
  repos: EnrichedRepo[],
  metric: MetricType,
): EnrichedRepo[] {
  const descending = (a: EnrichedRepo, b: EnrichedRepo) =>
    b[metric] - a[metric];
  return [...repos].sort(descending).slice(0, LEADERBOARD_SIZE);
}

export function repoLink(repo: EnrichedRepo): string {
  return `[${repo.owner.login}/${repo.name}](${repo.html_url})`;
}
