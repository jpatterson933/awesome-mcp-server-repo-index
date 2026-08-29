import { z } from "zod";
import { CoverageAnalysis } from "../analysis/coverage.js";
import { IndexDiscovery } from "../github/api.js";
import { EnrichedRepo } from "../schema/github.js";

export const IndexDatasetSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string(),
  source: z.object({
    type: z.literal("github-repository-search"),
    query: z.string(),
    candidateCount: z.number().int().nonnegative(),
    includedCount: z.number().int().nonnegative(),
  }),
  indexes: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      fullName: z.string(),
      url: z.url(),
      owner: z.object({ login: z.string(), url: z.url() }),
      description: z.string().nullable(),
      topics: z.array(z.string()),
      metrics: z.object({
        stars: z.number().int().nonnegative(),
        forks: z.number().int().nonnegative(),
        subscribers: z.number().int().nonnegative(),
        openIssues: z.number().int().nonnegative(),
        sizeKb: z.number().int().nonnegative(),
      }),
      timestamps: z.object({
        createdAt: z.string(),
        pushedAt: z.string(),
      }),
      license: z.string().nullable(),
      provenance: z.object({
        source: z.literal("github"),
        classification: z.literal("index metadata signal"),
      }),
      analysis: z.object({
        readmeStatus: z.enum(["analyzed", "missing"]),
        linkedRepositoryCount: z.number().int().nonnegative(),
        uniqueLinkedRepositoryCount: z.number().int().nonnegative(),
        sharedLinkedRepositoryCount: z.number().int().nonnegative(),
      }),
    }),
  ),
});

export const CoverageDatasetSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string(),
  methodology: z.string(),
  summary: z.object({
    indexes: z.number().int().nonnegative(),
    readmesAnalyzed: z.number().int().nonnegative(),
    readmesMissing: z.number().int().nonnegative(),
    cacheHits: z.number().int().nonnegative(),
    uniqueLinkedRepositories: z.number().int().nonnegative(),
    links: z.number().int().nonnegative(),
  }),
  indexes: z.array(
    z.object({
      indexId: z.string(),
      pushedAt: z.string(),
      readmeStatus: z.enum(["analyzed", "missing"]),
      source: z.enum(["cache", "github"]),
      linkedRepositoryCount: z.number().int().nonnegative(),
      uniqueLinkedRepositoryCount: z.number().int().nonnegative(),
      sharedLinkedRepositoryCount: z.number().int().nonnegative(),
      repositories: z.array(z.string()),
    }),
  ),
  repositories: z.array(
    z.object({
      repositoryId: z.string(),
      indexCount: z.number().int().positive(),
      indexes: z.array(z.string()),
    }),
  ),
});

export const DiscoveryAuditSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string(),
  query: z.string(),
  summary: z.object({
    candidates: z.number().int().nonnegative(),
    included: z.number().int().nonnegative(),
    excluded: z.number().int().nonnegative(),
  }),
  decisions: z.array(
    z.object({
      fullName: z.string(),
      url: z.url(),
      included: z.boolean(),
      reason: z.string(),
    }),
  ),
});

function fullName(repo: EnrichedRepo): string {
  return `${repo.owner.login}/${repo.name}`;
}

export function generateIndexDataset(
  repos: EnrichedRepo[],
  discovery: IndexDiscovery,
  coverage: CoverageAnalysis,
  generatedAt: string,
): string {
  const coverageByIndex = new Map(
    coverage.indexes.map((index) => [index.indexId, index]),
  );
  const indexes = [...repos]
    .sort((a, b) =>
      fullName(a).toLowerCase().localeCompare(fullName(b).toLowerCase()),
    )
    .map((repo) => {
      const id = fullName(repo).toLowerCase();
      const indexCoverage = coverageByIndex.get(id);
      if (!indexCoverage) {
        throw new Error(`Missing README analysis for ${id}`);
      }

      return {
      id: fullName(repo).toLowerCase(),
      name: repo.name,
      fullName: fullName(repo),
      url: repo.html_url,
      owner: { login: repo.owner.login, url: repo.owner.html_url },
      description: repo.description,
      topics: [...repo.topics].sort(),
      metrics: {
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        subscribers: repo.subscribers_count,
        openIssues: repo.open_issues_count,
        sizeKb: repo.size,
      },
      timestamps: {
        createdAt: repo.created_at,
        pushedAt: repo.pushed_at,
      },
      license: repo.license?.name ?? null,
      provenance: {
        source: "github" as const,
        classification: "index metadata signal" as const,
      },
      analysis: {
        readmeStatus: indexCoverage.readmeStatus,
        linkedRepositoryCount: indexCoverage.linkedRepositoryCount,
        uniqueLinkedRepositoryCount:
          indexCoverage.uniqueLinkedRepositoryCount,
        sharedLinkedRepositoryCount:
          indexCoverage.sharedLinkedRepositoryCount,
      },
    };
    });

  const dataset = IndexDatasetSchema.parse({
    schemaVersion: 1,
    generatedAt,
    source: {
      type: "github-repository-search",
      query: discovery.query,
      candidateCount: discovery.candidateCount,
      includedCount: indexes.length,
    },
    indexes,
  });

  return `${JSON.stringify(dataset, null, 2)}\n`;
}

export function generateCoverageDataset(
  coverage: CoverageAnalysis,
  generatedAt: string,
): string {
  const dataset = CoverageDatasetSchema.parse({
    schemaVersion: 1,
    generatedAt,
    methodology:
      "Counts unique GitHub repository links extracted from each index README. Links are not guaranteed to represent MCP servers.",
    ...coverage,
  });

  return `${JSON.stringify(dataset, null, 2)}\n`;
}

export function generateDiscoveryAudit(
  discovery: IndexDiscovery,
  generatedAt: string,
): string {
  const decisions = discovery.decisions
    .map((decision) => ({
      fullName: `${decision.repo.owner.login}/${decision.repo.name}`,
      url: decision.repo.html_url,
      included: decision.included,
      reason: decision.reason,
    }))
    .sort((a, b) =>
      a.fullName.toLowerCase().localeCompare(b.fullName.toLowerCase()),
    );

  const included = decisions.filter((decision) => decision.included).length;
  const audit = DiscoveryAuditSchema.parse({
    schemaVersion: 1,
    generatedAt,
    query: discovery.query,
    summary: {
      candidates: decisions.length,
      included,
      excluded: decisions.length - included,
    },
    decisions,
  });

  return `${JSON.stringify(audit, null, 2)}\n`;
}
