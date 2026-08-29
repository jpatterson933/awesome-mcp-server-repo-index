import dotenv from "dotenv";
import { Octokit } from "octokit";
import {
  EnrichedRepo,
  GithubRepo,
  GithubRepoSchema,
} from "../schema/github.js";
import { mapWithConcurrency, withGithubRetry } from "../utils/async.js";
import { delay } from "../utils/delay.js";
import { classifyIndexRepository } from "./classify.js";

dotenv.config({ quiet: true });
const octokit = new Octokit({
  auth:
    process.env.GITHUB_TOKEN ??
    process.env.GH_TOKEN ??
    process.env.REPO_INDEX_TOKEN,
});

const SEARCH_PAGE_DELAY_MS = 500;
const ENRICHMENT_CONCURRENCY = 8;
const GITHUB_SEARCH_RESULT_LIMIT = 1_000;
export const GITHUB_INDEX_SEARCH_QUERY =
  "awesome-mcp in:name archived:false fork:false";

export type DiscoveryDecision = {
  repo: GithubRepo;
  included: boolean;
  reason: string;
};

export type IndexDiscovery = {
  query: string;
  candidateCount: number;
  repos: GithubRepo[];
  decisions: DiscoveryDecision[];
};

function logProgress(current: number, total: number, label: string): void {
  const percentage = Math.round((current / total) * 100);
  const bar =
    "█".repeat(Math.floor(percentage / 5)) +
    "░".repeat(20 - Math.floor(percentage / 5));
  process.stdout.write(
    `\r  [${bar}] ${percentage}% (${current}/${total}) ${label}`,
  );
}

export async function fetchAwesomeMcpIndexes(): Promise<IndexDiscovery> {
  const searchQuery = GITHUB_INDEX_SEARCH_QUERY;
  const allRepos: GithubRepo[] = [];
  let page = 1;
  let hasMore = true;
  let totalCount = 0;

  while (hasMore) {
    const response = await withGithubRetry(() =>
      octokit.rest.search.repos({
        q: searchQuery,
        sort: "updated",
        order: "desc",
        per_page: 100,
        page,
      }),
    );

    if (page === 1) {
      totalCount = response.data.total_count;
      if (totalCount > GITHUB_SEARCH_RESULT_LIMIT) {
        throw new Error(
          `GitHub found ${totalCount} repositories, exceeding its ${GITHUB_SEARCH_RESULT_LIMIT}-result search limit`,
        );
      }
    }

    const repos = GithubRepoSchema.array().parse(response.data.items);
    allRepos.push(...repos);

    logProgress(allRepos.length, totalCount, `Page ${page}`);

    hasMore = repos.length === 100 && allRepos.length < totalCount;
    page++;

    if (hasMore) await delay(SEARCH_PAGE_DELAY_MS);
  }

  process.stdout.write("\n");
  const decisions = allRepos.map((repo) => ({
    repo,
    ...classifyIndexRepository(repo),
  }));
  const indexRepos = decisions
    .filter((decision) => decision.included)
    .map((decision) => decision.repo);
  console.log(
    `  ✔ Retained ${indexRepos.length}/${allRepos.length} repositories with index metadata`,
  );
  return {
    query: searchQuery,
    candidateCount: allRepos.length,
    repos: indexRepos,
    decisions,
  };
}

async function fetchRepoDetails(
  owner: string,
  repo: string,
): Promise<{ subscribers_count: number }> {
  const response = await withGithubRetry(() =>
    octokit.rest.repos.get({ owner, repo }),
  );
  return {
    subscribers_count: response.data.subscribers_count,
  };
}

export async function fetchReadmeContent(
  owner: string,
  repo: string,
): Promise<string | null> {
  try {
    const response = await withGithubRetry(() =>
      octokit.rest.repos.getReadme({ owner, repo }),
    );
    if (Array.isArray(response.data) || !("content" in response.data)) {
      throw new Error(`GitHub returned an unexpected README response for ${owner}/${repo}`);
    }

    return Buffer.from(response.data.content, "base64").toString("utf8");
  } catch (error) {
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? Number(error.status)
        : undefined;
    if (status === 404) return null;
    throw error;
  }
}

export async function enrichAllRepos(
  repos: GithubRepo[],
): Promise<EnrichedRepo[]> {
  const total = repos.length;
  let completed = 0;

  const enrichedRepos = await mapWithConcurrency(
    repos,
    ENRICHMENT_CONCURRENCY,
    async (repo) => {
    try {
      const details = await fetchRepoDetails(repo.owner.login, repo.name);
        completed++;
        logProgress(completed, total, repo.name);
        return { ...repo, ...details };
    } catch (error) {
      throw new Error(
        `Failed to enrich ${repo.owner.login}/${repo.name}; refusing to publish incomplete metrics`,
        { cause: error },
      );
    }
    },
  );

  process.stdout.write("\n");
  return enrichedRepos;
}
