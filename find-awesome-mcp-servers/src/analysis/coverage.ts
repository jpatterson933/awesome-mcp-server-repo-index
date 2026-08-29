import { readFile } from "node:fs/promises";
import { EnrichedRepo } from "../schema/github.js";
import { mapWithConcurrency } from "../utils/async.js";

export type ReadmeStatus = "analyzed" | "missing";

export type IndexReadmeLinks = {
  indexId: string;
  pushedAt: string;
  status: ReadmeStatus;
  source: "cache" | "github";
  repositories: string[];
};

export type IndexCoverage = {
  indexId: string;
  pushedAt: string;
  readmeStatus: ReadmeStatus;
  source: "cache" | "github";
  linkedRepositoryCount: number;
  uniqueLinkedRepositoryCount: number;
  sharedLinkedRepositoryCount: number;
  repositories: string[];
};

export type LinkedRepositoryCoverage = {
  repositoryId: string;
  indexCount: number;
  indexes: string[];
};

export type CoverageAnalysis = {
  summary: {
    indexes: number;
    readmesAnalyzed: number;
    readmesMissing: number;
    cacheHits: number;
    uniqueLinkedRepositories: number;
    links: number;
  };
  indexes: IndexCoverage[];
  repositories: LinkedRepositoryCoverage[];
};

export type ReadmeFetcher = (
  owner: string,
  repo: string,
) => Promise<string | null>;

export type ReadmeCache = Map<
  string,
  Pick<IndexReadmeLinks, "pushedAt" | "status" | "repositories">
>;

const README_CONCURRENCY = 6;

const RESERVED_GITHUB_PATHS = new Set([
  "about",
  "apps",
  "collections",
  "customer-stories",
  "enterprise",
  "events",
  "explore",
  "features",
  "issues",
  "login",
  "marketplace",
  "new",
  "orgs",
  "organizations",
  "pricing",
  "search",
  "security",
  "settings",
  "site",
  "sponsors",
  "team",
  "topics",
]);

export function extractLinkedGitHubRepositories(
  markdown: string,
  currentIndexId?: string,
): string[] {
  const repositoryPattern =
    /https?:\/\/(?:www\.)?github\.com\/([a-z0-9_.-]+)\/([a-z0-9_.-]+)/gi;
  const repositories = new Set<string>();

  for (const match of markdown.matchAll(repositoryPattern)) {
    const owner = match[1].toLowerCase();
    const repo = match[2].replace(/\.git$/i, "").toLowerCase();
    if (RESERVED_GITHUB_PATHS.has(owner) || !repo) continue;

    const id = `${owner}/${repo}`;
    if (id === currentIndexId?.toLowerCase()) continue;
    repositories.add(id);
  }

  return [...repositories].sort();
}

function indexId(repo: EnrichedRepo): string {
  return `${repo.owner.login}/${repo.name}`.toLowerCase();
}

export async function loadReadmeCache(path: string): Promise<ReadmeCache> {
  try {
    const raw = JSON.parse(await readFile(path, "utf8")) as {
      indexes?: unknown[];
    };
    const cache: ReadmeCache = new Map();

    for (const value of raw.indexes ?? []) {
      if (typeof value !== "object" || value === null) continue;
      const entry = value as Record<string, unknown>;
      if (
        typeof entry.indexId !== "string" ||
        typeof entry.pushedAt !== "string" ||
        (entry.readmeStatus !== "analyzed" && entry.readmeStatus !== "missing") ||
        !Array.isArray(entry.repositories) ||
        !entry.repositories.every((item) => typeof item === "string")
      ) {
        continue;
      }

      cache.set(entry.indexId, {
        pushedAt: entry.pushedAt,
        status: entry.readmeStatus,
        repositories: entry.repositories,
      });
    }

    return cache;
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : undefined;
    if (code === "ENOENT" || error instanceof SyntaxError) return new Map();
    throw error;
  }
}

export async function crawlIndexReadmes(
  repos: EnrichedRepo[],
  fetchReadme: ReadmeFetcher,
  cache: ReadmeCache = new Map(),
): Promise<IndexReadmeLinks[]> {
  let completed = 0;
  const results = await mapWithConcurrency(
    repos,
    README_CONCURRENCY,
    async (repo) => {
    const id = indexId(repo);
      const cached = cache.get(id);
      if (cached?.pushedAt === repo.pushed_at) {
        completed++;
        process.stdout.write(
          `\r  README ${completed}/${repos.length} — ${id.padEnd(60).slice(0, 60)}`,
        );
        return {
          indexId: id,
          pushedAt: repo.pushed_at,
          status: cached.status,
          source: "cache" as const,
          repositories: cached.repositories,
        };
      }

    const readme = await fetchReadme(repo.owner.login, repo.name);
      completed++;
      process.stdout.write(
        `\r  README ${completed}/${repos.length} — ${id.padEnd(60).slice(0, 60)}`,
      );
      return {
        indexId: id,
        pushedAt: repo.pushed_at,
        status: readme === null ? ("missing" as const) : ("analyzed" as const),
        source: "github" as const,
        repositories:
          readme === null ? [] : extractLinkedGitHubRepositories(readme, id),
      };
    },
  );

  if (repos.length > 0) process.stdout.write("\n");
  return results;
}

export function buildCoverageAnalysis(
  readmes: IndexReadmeLinks[],
): CoverageAnalysis {
  const repositoryIndexes = new Map<string, Set<string>>();

  for (const readme of readmes) {
    for (const repositoryId of readme.repositories) {
      const indexes = repositoryIndexes.get(repositoryId) ?? new Set<string>();
      indexes.add(readme.indexId);
      repositoryIndexes.set(repositoryId, indexes);
    }
  }

  const indexes = readmes
    .map((readme) => {
      const uniqueLinkedRepositoryCount = readme.repositories.filter(
        (repositoryId) => repositoryIndexes.get(repositoryId)?.size === 1,
      ).length;
      return {
        indexId: readme.indexId,
        pushedAt: readme.pushedAt,
        readmeStatus: readme.status,
        source: readme.source,
        linkedRepositoryCount: readme.repositories.length,
        uniqueLinkedRepositoryCount,
        sharedLinkedRepositoryCount:
          readme.repositories.length - uniqueLinkedRepositoryCount,
        repositories: readme.repositories,
      };
    })
    .sort((a, b) => a.indexId.localeCompare(b.indexId));

  const repositories = [...repositoryIndexes.entries()]
    .map(([repositoryId, linkedIndexes]) => ({
      repositoryId,
      indexCount: linkedIndexes.size,
      indexes: [...linkedIndexes].sort(),
    }))
    .sort(
      (a, b) =>
        b.indexCount - a.indexCount ||
        a.repositoryId.localeCompare(b.repositoryId),
    );

  return {
    summary: {
      indexes: readmes.length,
      readmesAnalyzed: readmes.filter((readme) => readme.status === "analyzed")
        .length,
      readmesMissing: readmes.filter((readme) => readme.status === "missing")
        .length,
      cacheHits: readmes.filter((readme) => readme.source === "cache").length,
      uniqueLinkedRepositories: repositories.length,
      links: indexes.reduce(
        (total, index) => total + index.linkedRepositoryCount,
        0,
      ),
    },
    indexes,
    repositories,
  };
}
