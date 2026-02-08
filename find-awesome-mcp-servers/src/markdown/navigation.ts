import { BADGE_STYLE, COLORS, LEADERBOARD_COPY, LeaderboardId } from "./theme.js";

type NavPage = {
  id: LeaderboardId;
  label: string;
  icon: string;
  color: string;
  path: string;
};

const NAV_PAGES: NavPage[] = [
  {
    id: "topStarred",
    label: "Starred",
    icon: "⭐",
    color: LEADERBOARD_COPY.topStarred.badgeColor,
    path: `./${LEADERBOARD_COPY.topStarred.filename}`,
  },
  {
    id: "topForked",
    label: "Forked",
    icon: "🍴",
    color: LEADERBOARD_COPY.topForked.badgeColor,
    path: `./${LEADERBOARD_COPY.topForked.filename}`,
  },
  {
    id: "topSubscribed",
    label: "Watched",
    icon: "👀",
    color: LEADERBOARD_COPY.topSubscribed.badgeColor,
    path: `./${LEADERBOARD_COPY.topSubscribed.filename}`,
  },
  {
    id: "topIssues",
    label: "Issues",
    icon: "🗂️",
    color: LEADERBOARD_COPY.topIssues.badgeColor,
    path: `./${LEADERBOARD_COPY.topIssues.filename}`,
  },
  {
    id: "topLargest",
    label: "Largest",
    icon: "💾",
    color: LEADERBOARD_COPY.topLargest.badgeColor,
    path: `./${LEADERBOARD_COPY.topLargest.filename}`,
  },
  {
    id: "activity",
    label: "Activity",
    icon: "🔥",
    color: LEADERBOARD_COPY.activity.badgeColor,
    path: `./${LEADERBOARD_COPY.activity.filename}`,
  },
  {
    id: "allRepos",
    label: "All Repos",
    icon: "📋",
    color: LEADERBOARD_COPY.allRepos.badgeColor,
    path: `./${LEADERBOARD_COPY.allRepos.filename}`,
  },
];

function navBadge(page: NavPage, isActive: boolean): string {
  const style = isActive ? BADGE_STYLE.header : BADGE_STYLE.table;
  const label = encodeURIComponent(`${page.icon} ${page.label}`);
  const badgeUrl = `https://img.shields.io/badge/${label}-${page.color}?style=${style}&logo=github`;
  return `[![${page.label}](${badgeUrl})](${page.path})`;
}

export function navigationBar(currentPage: LeaderboardId): string {
  const homeStyle =
    currentPage === "readme" ? BADGE_STYLE.header : BADGE_STYLE.table;
  const homeBadge = `[![Home](https://img.shields.io/badge/Home-${COLORS.allRepos}?style=${homeStyle}&logo=github)](./README.md)`;

  const badges = NAV_PAGES.map((page) =>
    navBadge(page, page.id === currentPage),
  );

  return [
    '<div align="center">',
    "",
    `${homeBadge} ${badges.join(" ")}`,
    "",
    "</div>",
    "",
    "<hr>",
  ].join("\n");
}

export function pageFooter(): string {
  return [
    "",
    "<hr>",
    "",
    '<p align="center">',
    '  <a href="#top">⬆ Back to Top</a>',
    "</p>",
    "",
    '<div align="center">',
    "",
    `[![Back to Index](https://img.shields.io/badge/←_Back_to_Index-${COLORS.allRepos}?style=${BADGE_STYLE.table}&logo=github)](./README.md)`,
    "",
    "</div>",
  ].join("\n");
}
