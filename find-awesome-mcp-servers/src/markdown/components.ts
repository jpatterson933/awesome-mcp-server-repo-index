import { EnrichedRepo } from "../schema/github.js";
import { TimePeriodType } from "../types/badges.js";
import { calculateTimePeriod } from "../utils/calculateFreshness.js";
import { BADGE_STYLE, COLORS, LeaderboardCopy } from "./theme.js";

export function centeredHeader(
  copy: LeaderboardCopy,
  generatedDate: string,
): string {
  return [
    '<div align="center">',
    "",
    `# ${copy.icon} ${copy.title}`,
    "",
    `**${copy.subtitle}**`,
    "",
    `![Generated](https://img.shields.io/badge/Generated-${generatedDate.replace(/-/g, "--")}-${COLORS.generated}?style=${BADGE_STYLE.table})`,
    "",
    "</div>",
    "",
  ].join("\n");
}

export function githubAlert(
  type: "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION",
  message: string,
): string {
  return `\n> [!${type}]\n> ${message}\n`;
}

export function dashboardStatCell(
  label: string,
  value: string | number,
  color: string,
): string {
  const badgeUrl = `https://img.shields.io/badge/${encodeURIComponent(String(value))}-${color}?style=${BADGE_STYLE.header}`;
  return [
    '    <td align="center">',
    `      <img src="${badgeUrl}" /><br>`,
    `      <sub>${label}</sub>`,
    "    </td>",
  ].join("\n");
}

export function dashboardGrid(
  stats: { label: string; value: string | number; color: string }[],
): string {
  const cells = stats.map((s) => dashboardStatCell(s.label, s.value, s.color));
  return [
    '<div align="center">',
    "",
    "<table>",
    "  <tr>",
    cells.join("\n"),
    "  </tr>",
    "</table>",
    "",
    "</div>",
  ].join("\n");
}

export function freshnessLegend(): string {
  const tiers: { label: string; color: string; description: string }[] = [
    { label: "FRESH AF", color: COLORS.freshAf, description: "Pushed in the last 24 hours" },
    { label: "HOT", color: COLORS.hot, description: "Pushed in the last week" },
    { label: "ACTIVE", color: COLORS.active, description: "Pushed in the last month" },
    { label: "STABLE", color: COLORS.stable, description: "Pushed in the last 6 months" },
    { label: "ZZZ", color: COLORS.zzz, description: "No push in 6+ months" },
  ];

  const cells = tiers
    .map((t) => {
      const badgeUrl = `https://img.shields.io/badge/${encodeURIComponent(t.label)}-${t.color}?style=${BADGE_STYLE.table}`;
      return `    <td align="center"><img src="${badgeUrl}" alt="${t.label}" /><br><sub>${t.description}</sub></td>`;
    })
    .join("\n");

  return [
    '<div align="center">',
    "",
    "<table>",
    "  <tr>",
    cells,
    "  </tr>",
    "</table>",
    "",
    "</div>",
  ].join("\n");
}

export function mermaidPieChart(
  title: string,
  data: Record<string, number>,
): string {
  const entries = Object.entries(data)
    .filter(([, count]) => count > 0)
    .map(([label, count]) => `    "${label}" : ${count}`)
    .join("\n");

  return ["```mermaid", `pie title ${title}`, entries, "```"].join("\n");
}

export function activitySummaryStats(repos: EnrichedRepo[]): {
  freshCount: number;
  hotCount: number;
  activeCount: number;
  stableCount: number;
  zzzCount: number;
  noLicenseCount: number;
} {
  const counts = {
    freshCount: 0,
    hotCount: 0,
    activeCount: 0,
    stableCount: 0,
    zzzCount: 0,
    noLicenseCount: 0,
  };

  for (const repo of repos) {
    const period = calculateTimePeriod(repo.pushed_at);
    const tierMap: Record<TimePeriodType, keyof typeof counts> = {
      one_day: "freshCount",
      one_week: "hotCount",
      one_month: "activeCount",
      six_months: "stableCount",
      one_year: "zzzCount",
    };
    counts[tierMap[period]]++;
    if (!repo.license) counts.noLicenseCount++;
  }

  return counts;
}

export function licenseDistribution(
  repos: EnrichedRepo[],
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const repo of repos) {
    const name = repo.license?.name ?? "No License";
    const simplified = simplifyLicenseName(name);
    counts[simplified] = (counts[simplified] || 0) + 1;
  }

  return counts;
}

function simplifyLicenseName(name: string): string {
  if (name.includes("MIT")) return "MIT";
  if (name.includes("Apache")) return "Apache 2.0";
  if (name.includes("GPL")) return "GPL";
  if (name.includes("Creative Commons")) return "Creative Commons";
  if (name.includes("BSD")) return "BSD";
  if (name.includes("ISC")) return "ISC";
  if (name === "No License" || name === "-") return "No License";
  return "Other";
}
