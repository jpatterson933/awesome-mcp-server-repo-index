export const LEADERBOARD_SIZE = 10;
export const MAX_DESCRIPTION_LENGTH = 100;

export const BADGE_STYLE = {
  header: "for-the-badge",
  table: "flat-square",
} as const;

export const COLORS = {
  starred: "F5A623",
  forked: "7C3AED",
  subscribed: "0891B2",
  issues: "DC2626",
  largest: "64748B",
  activity: "EA580C",
  allRepos: "0F172A",
  freshAf: "EF4444",
  hot: "F97316",
  active: "22C55E",
  stable: "3B82F6",
  zzz: "94A3B8",
  noLicense: "BE123C",
  generated: "059669",
  totalRepos: "1E40AF",
} as const;

export type LeaderboardId =
  | "topStarred"
  | "topForked"
  | "topSubscribed"
  | "topIssues"
  | "topLargest"
  | "activity"
  | "allRepos";

export type LeaderboardCopy = {
  title: string;
  subtitle: string;
  icon: string;
  badgeColor: string;
  badgeLabel: string;
  filename: string;
};

export const LEADERBOARD_COPY: Record<LeaderboardId, LeaderboardCopy> = {
  topStarred: {
    title: "Top 10 Starred MCP Repositories",
    subtitle:
      "The people have spoken. These are the repos they actually starred.",
    icon: "⭐",
    badgeColor: COLORS.starred,
    badgeLabel: "Top Starred",
    filename: "TOP-STARRED.md",
  },
  topForked: {
    title: "Top 10 Forked MCP Repositories",
    subtitle:
      "Forked, cloned, and probably already modified. The repos developers trust enough to build on.",
    icon: "🍴",
    badgeColor: COLORS.forked,
    badgeLabel: "Top Forked",
    filename: "TOP-FORKED.md",
  },
  topSubscribed: {
    title: "Top 10 Subscribed MCP Repositories",
    subtitle:
      "These repos are worth the inbox noise. The ones people actually want updates from.",
    icon: "👀",
    badgeColor: COLORS.subscribed,
    badgeLabel: "Top Watched",
    filename: "TOP-SUBSCRIBED.md",
  },
  topIssues: {
    title: "Top 10 Issues MCP Repositories",
    subtitle:
      "Open issues mean open doors. The most actively discussed MCP repos.",
    icon: "🗂️",
    badgeColor: COLORS.issues,
    badgeLabel: "Top Issues",
    filename: "TOP-ISSUES.md",
  },
  topLargest: {
    title: "Top 10 Largest MCP Repositories",
    subtitle:
      "Size isn't everything. But when a repo breaks 100MB, someone's committed to the cause.",
    icon: "💾",
    badgeColor: COLORS.largest,
    badgeLabel: "Top Largest",
    filename: "TOP-LARGEST.md",
  },
  activity: {
    title: "MCP Repo Activity Analysis",
    subtitle:
      "Stars are vanity. Commits are sanity. Here's who's actually shipping.",
    icon: "🔥",
    badgeColor: COLORS.activity,
    badgeLabel: "Activity",
    filename: "ACTIVITY.md",
  },
  allRepos: {
    title: "Awesome MCP Repos",
    subtitle:
      "Every awesome-mcp repository on GitHub. Sorted, enriched, and updated daily.",
    icon: "📋",
    badgeColor: COLORS.allRepos,
    badgeLabel: "All Repos",
    filename: "AWESOME-MCP-REPOS.md",
  },
};

export const MEDAL_EMOJIS: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};
