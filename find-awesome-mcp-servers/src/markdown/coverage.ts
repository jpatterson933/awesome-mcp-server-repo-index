import { CoverageAnalysis } from "../analysis/coverage.js";
import { EnrichedRepo } from "../schema/github.js";
import { repoLink } from "../utils/format.js";
import { centeredHeader, dashboardGrid, githubAlert } from "./components.js";
import { navigationBar, pageFooter } from "./navigation.js";
import { COLORS, LEADERBOARD_COPY } from "./theme.js";

function repoId(repo: EnrichedRepo): string {
  return `${repo.owner.login}/${repo.name}`.toLowerCase();
}

export function generateCoveragePage(
  repos: EnrichedRepo[],
  coverage: CoverageAnalysis,
  now: Date = new Date(),
): string {
  const generatedDate = now.toISOString().split("T")[0];
  const reposById = new Map(repos.map((repo) => [repoId(repo), repo]));
  const ranked = [...coverage.indexes].sort(
    (a, b) =>
      b.linkedRepositoryCount - a.linkedRepositoryCount ||
      b.uniqueLinkedRepositoryCount - a.uniqueLinkedRepositoryCount ||
      a.indexId.localeCompare(b.indexId),
  );

  const rows = ranked.map((index, position) => {
    const repo = reposById.get(index.indexId);
    const link = repo ? repoLink(repo) : index.indexId;
    const status = index.readmeStatus === "analyzed" ? "Analyzed" : "No README";
    return `| ${position + 1} | ${link} | ${status} | ${index.linkedRepositoryCount.toLocaleString()} | ${index.uniqueLinkedRepositoryCount.toLocaleString()} | ${index.sharedLinkedRepositoryCount.toLocaleString()} |`;
  });

  return [
    navigationBar("coverage"),
    centeredHeader(LEADERBOARD_COPY.coverage, generatedDate),
    githubAlert(
      "IMPORTANT",
      "Coverage counts unique GitHub repository links found in README files. A link is not automatically an MCP server or an endorsement.",
    ),
    "",
    dashboardGrid([
      {
        label: "Indexes Analyzed",
        value: coverage.summary.readmesAnalyzed,
        color: COLORS.active,
      },
      {
        label: "Unique Linked Repos",
        value: coverage.summary.uniqueLinkedRepositories,
        color: COLORS.totalRepos,
      },
      {
        label: "Index → Repo Links",
        value: coverage.summary.links,
        color: COLORS.subscribed,
      },
    ]),
    "",
    "| Rank | Index Repository | README | Linked Repos | Unique to Index | Shared |",
    "| ---: | ---------------- | ------ | -----------: | --------------: | -----: |",
    ...rows,
    pageFooter(),
  ].join("\n");
}
