import { EnrichedRepo } from "../schema/github.js";
import { TimePeriodType } from "../types/badges.js";
import { calculateTimePeriod } from "../utils/calculateFreshness.js";
import { repoLink } from "../utils/format.js";
import { freshnessBadge, freshnessEmoji, licenseBadge } from "./badges.js";
import {
  activitySummaryStats,
  centeredHeader,
  dashboardGrid,
  freshnessLegend,
  githubAlert,
} from "./components.js";
import { navigationBar, pageFooter } from "./navigation.js";
import { COLORS, LEADERBOARD_COPY } from "./theme.js";

type FreshnessTier = {
  period: TimePeriodType;
  label: string;
  emoji: string;
  collapsed: boolean;
};

const FRESHNESS_TIERS: FreshnessTier[] = [
  { period: "one_day", label: "FRESH AF", emoji: "🔥", collapsed: false },
  { period: "one_week", label: "HOT", emoji: "🌶️", collapsed: false },
  { period: "one_month", label: "ACTIVE", emoji: "✅", collapsed: false },
  { period: "six_months", label: "STABLE", emoji: "📘", collapsed: true },
  { period: "one_year", label: "ZZZ", emoji: "💤", collapsed: true },
];

function activityTableHeader(): string {
  return [
    "| # | Repository | Freshness | Last Push | Created | License |",
    "| ---: | ---------- | --------- | --------- | ------- | ------- |",
  ].join("\n");
}

function activityRow(
  repo: EnrichedRepo,
  rank: number,
  period: TimePeriodType,
): string {
  const emoji = freshnessEmoji(period);
  const link = `${emoji} ${repoLink(repo)}`;
  const badge = freshnessBadge(period);
  const lastPush = repo.pushed_at.split("T")[0];
  const created = repo.created_at.split("T")[0];
  const license = licenseBadge(repo.license);

  return `| ${rank} | ${link} | ${badge} | ${lastPush} | ${created} | ${license} |`;
}

function groupReposByFreshness(
  repos: EnrichedRepo[],
): Map<TimePeriodType, EnrichedRepo[]> {
  const groups = new Map<TimePeriodType, EnrichedRepo[]>();

  for (const tier of FRESHNESS_TIERS) {
    groups.set(tier.period, []);
  }

  const sorted = [...repos].sort(
    (a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime(),
  );

  for (const repo of sorted) {
    const period = calculateTimePeriod(repo.pushed_at);
    groups.get(period)!.push(repo);
  }

  return groups;
}

function renderTierSection(
  tier: FreshnessTier,
  repos: EnrichedRepo[],
  startRank: number,
): string {
  if (repos.length === 0) return "";

  const sectionTitle = `### ${tier.emoji} ${tier.label} (${repos.length} repos)`;
  const table = activityTableHeader();
  const rows = repos.map((repo, i) =>
    activityRow(repo, startRank + i, tier.period),
  );
  const tableContent = [table, ...rows].join("\n");

  if (tier.collapsed) {
    return [
      "",
      `<details>`,
      `<summary><b>${tier.emoji} ${tier.label} (${repos.length} repos)</b></summary>`,
      "",
      tableContent,
      "",
      "</details>",
    ].join("\n");
  }

  return ["", sectionTitle, "", tableContent].join("\n");
}

export function generateActivityTimeline(repos: EnrichedRepo[]): string {
  const copy = LEADERBOARD_COPY.activity;
  const generatedDate = new Date().toISOString().split("T")[0];
  const groups = groupReposByFreshness(repos);
  const stats = activitySummaryStats(repos);

  const sections = [
    navigationBar("activity"),
    centeredHeader(copy, generatedDate),
    githubAlert(
      "TIP",
      "FRESH AF and HOT repos are shown expanded. STABLE and ZZZ repos are collapsed — click to expand.",
    ),
    "",
    "## Freshness Legend",
    "",
    freshnessLegend(),
    "",
    "## Dashboard",
    "",
    dashboardGrid([
      { label: "Pushed Today", value: stats.freshCount, color: COLORS.freshAf },
      { label: "Pushed This Week", value: stats.hotCount, color: COLORS.hot },
      {
        label: "Pushed This Month",
        value: stats.activeCount,
        color: COLORS.active,
      },
      { label: "Stable", value: stats.stableCount, color: COLORS.stable },
      { label: "Dormant", value: stats.zzzCount, color: COLORS.zzz },
      {
        label: "No License",
        value: stats.noLicenseCount,
        color: COLORS.noLicense,
      },
    ]),
    "",
    "---",
  ];

  let rank = 1;
  for (const tier of FRESHNESS_TIERS) {
    const tierRepos = groups.get(tier.period) ?? [];
    if (tierRepos.length > 0) {
      sections.push(renderTierSection(tier, tierRepos, rank));
      rank += tierRepos.length;
    }
  }

  sections.push(pageFooter());

  return sections.join("\n");
}
