import { EnrichedRepo, MetricType } from "../schema/github.js";
import {
  repoLink,
  topTenByMetric,
  truncateDescription,
} from "../utils/format.js";
import { statBadge } from "./badges.js";
import { centeredHeader, githubAlert } from "./components.js";
import { navigationBar, pageFooter } from "./navigation.js";
import { LEADERBOARD_COPY, LeaderboardId, MEDAL_EMOJIS } from "./theme.js";

function leaderboardTable(
  repos: EnrichedRepo[],
  stat: MetricType,
  columnName: string,
  badgeLabel: string,
  badgeColor: string,
): string[] {
  const header = [
    `| Rank | Repository | ${columnName} | Description |`,
    `| ---: | ---------- | ---: | ----------- |`,
  ];

  const rows = repos.map((repo, index) => {
    const rank = index + 1;
    const medal = MEDAL_EMOJIS[rank] ?? "";
    const rankDisplay = medal ? `${medal} ${rank}` : `${rank}`;
    const link = repoLink(repo);
    const badge = statBadge(badgeLabel, repo[stat], badgeColor);
    const description = truncateDescription(repo.description);

    return `| ${rankDisplay} | ${link} | ${badge} | ${description} |`;
  });

  return [...header, ...rows];
}

function generateLeaderboard(
  repos: EnrichedRepo[],
  leaderboardId: LeaderboardId,
  stat: MetricType,
  columnName: string,
  highlightNote?: string,
): string {
  const copy = LEADERBOARD_COPY[leaderboardId];
  const topRepos = topTenByMetric(repos, stat);
  const generatedDate = new Date().toISOString().split("T")[0];

  const sections = [
    navigationBar(leaderboardId),
    centeredHeader(copy, generatedDate),
  ];

  if (highlightNote) {
    sections.push(githubAlert("NOTE", highlightNote));
    sections.push("");
  }

  sections.push(
    ...leaderboardTable(topRepos, stat, columnName, copy.icon, copy.badgeColor),
  );

  sections.push(pageFooter());

  return sections.join("\n");
}

export function generateTopStarred(repos: EnrichedRepo[]): string {
  const top = topTenByMetric(repos, "stargazers_count");
  const topCount = top[0]?.stargazers_count.toLocaleString() ?? "0";
  return generateLeaderboard(
    repos,
    "topStarred",
    "stargazers_count",
    "Stars",
    `#1 has ${topCount} stars. That's more than most frameworks.`,
  );
}

export function generateTopSubscribed(repos: EnrichedRepo[]): string {
  return generateLeaderboard(
    repos,
    "topSubscribed",
    "subscribers_count",
    "Subscribers",
  );
}

export function generateTopForked(repos: EnrichedRepo[]): string {
  return generateLeaderboard(repos, "topForked", "forks_count", "Forks");
}

export function generateTopIssues(repos: EnrichedRepo[]): string {
  return generateLeaderboard(
    repos,
    "topIssues",
    "open_issues_count",
    "Open Issues + PRs",
  );
}

export function generateTopLargest(repos: EnrichedRepo[]): string {
  return generateLeaderboard(repos, "topLargest", "size", "Size (KB)");
}

type LeaderboardSection = {
  id: LeaderboardId;
  stat: MetricType;
  columnName: string;
  anchor: string;
};

const TOP_TEN_SECTIONS: LeaderboardSection[] = [
  {
    id: "topStarred",
    stat: "stargazers_count",
    columnName: "Stars",
    anchor: "top-starred",
  },
  {
    id: "topForked",
    stat: "forks_count",
    columnName: "Forks",
    anchor: "top-forked",
  },
  {
    id: "topSubscribed",
    stat: "subscribers_count",
    columnName: "Subscribers",
    anchor: "top-watched",
  },
  {
    id: "topIssues",
    stat: "open_issues_count",
    columnName: "Open Issues + PRs",
    anchor: "top-issues",
  },
  {
    id: "topLargest",
    stat: "size",
    columnName: "Size (KB)",
    anchor: "top-largest",
  },
];

function tableOfContents(): string {
  const links = TOP_TEN_SECTIONS.map((section) => {
    const copy = LEADERBOARD_COPY[section.id];
    return `[${copy.icon} ${copy.title.replace("Top 10 ", "")}](#${section.anchor})`;
  });

  return [
    "## Quick Navigation",
    "",
    `| ${links.join(" | ")} |`,
    `| ${links.map(() => ":---:").join(" | ")} |`,
  ].join("\n");
}

function leaderboardSection(
  repos: EnrichedRepo[],
  section: LeaderboardSection,
): string {
  const copy = LEADERBOARD_COPY[section.id];
  const topRepos = topTenByMetric(repos, section.stat);
  const table = leaderboardTable(
    topRepos,
    section.stat,
    section.columnName,
    copy.icon,
    copy.badgeColor,
  );

  return [
    "",
    `<a id="${section.anchor}"></a>`,
    "",
    `## ${copy.icon} ${copy.title}`,
    "",
    `**${copy.subtitle}**`,
    "",
    ...table,
  ].join("\n");
}

export function generateTopTens(repos: EnrichedRepo[]): string {
  const copy = LEADERBOARD_COPY.topTens;
  const generatedDate = new Date().toISOString().split("T")[0];

  const sections = [
    navigationBar("topTens"),
    centeredHeader(copy, generatedDate),
    githubAlert(
      "TIP",
      "Use the quick navigation below to jump to any leaderboard.",
    ),
    "",
    tableOfContents(),
  ];

  for (const section of TOP_TEN_SECTIONS) {
    sections.push(leaderboardSection(repos, section));
  }

  sections.push(pageFooter());

  return sections.join("\n");
}
