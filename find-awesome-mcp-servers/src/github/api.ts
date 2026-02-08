import dotenv from "dotenv";
import { Octokit } from "octokit";
import { EnrichedRepo, GithubRepo } from "../schema/github.js";
import { delay } from "../utils/delay.js";

dotenv.config();
const octokit = new Octokit({
  auth: process.env.REPO_INDEX_TOKEN,
});

const DELAY_MS = 500;

function logProgress(current: number, total: number, label: string): void {
  const percentage = Math.round((current / total) * 100);
  const bar =
    "█".repeat(Math.floor(percentage / 5)) +
    "░".repeat(20 - Math.floor(percentage / 5));
  process.stdout.write(
    `\r  [${bar}] ${percentage}% (${current}/${total}) ${label}`,
  );
}

export async function fetchAwesomeMcpRepos(): Promise<GithubRepo[]> {
  const searchQuery = "awesome-mcp in:name archived:false";
  const allRepos: GithubRepo[] = [];
  let page = 1;
  let hasMore = true;
  let totalCount = 0;

  while (hasMore) {
    const response = await octokit.rest.search.repos({
      q: searchQuery,
      sort: "updated",
      order: "desc",
      per_page: 100,
      page,
    });

    if (page === 1) totalCount = response.data.total_count;

    const repos = response.data.items as GithubRepo[];
    allRepos.push(...repos);

    logProgress(allRepos.length, totalCount, `Page ${page}`);

    hasMore = repos.length === 100;
    page++;

    if (hasMore) await delay(DELAY_MS);
  }

  process.stdout.write("\n");
  return allRepos;
}

async function fetchRepoDetails(
  owner: string,
  repo: string,
): Promise<{ subscribers_count: number }> {
  const response = await octokit.rest.repos.get({ owner, repo });
  return {
    subscribers_count: response.data.subscribers_count,
  };
}

export async function enrichAllRepos(
  repos: GithubRepo[],
): Promise<EnrichedRepo[]> {
  const total = repos.length;
  const enrichedRepos: EnrichedRepo[] = [];

  for (const [index, repo] of repos.entries()) {
    logProgress(index + 1, total, repo.name);
    await delay(DELAY_MS);
    try {
      const details = await fetchRepoDetails(repo.owner.login, repo.name);
      enrichedRepos.push({ ...repo, ...details });
    } catch (error) {
      process.stdout.write(`\n  ⚠ Failed to enrich ${repo.name}\n`);
      enrichedRepos.push({
        ...repo,
        subscribers_count: 0,
      });
    }
  }

  process.stdout.write("\n");
  return enrichedRepos;
}
