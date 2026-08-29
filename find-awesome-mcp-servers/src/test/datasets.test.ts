import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CoverageDatasetSchema,
  DiscoveryAuditSchema,
  generateCoverageDataset,
  generateDiscoveryAudit,
  generateIndexDataset,
  IndexDatasetSchema,
} from "../data/datasets.js";
import { CoverageAnalysis } from "../analysis/coverage.js";
import { IndexDiscovery } from "../github/api.js";
import { EnrichedRepo } from "../schema/github.js";

const GENERATED_AT = "2026-08-29T00:00:00.000Z";

function repo(name: string): EnrichedRepo {
  return {
    name,
    html_url: `https://github.com/example/${name}`,
    owner: { login: "example", html_url: "https://github.com/example" },
    description: "A curated list of MCP servers.",
    fork: false,
    topics: ["mcp", "awesome-list"],
    size: 10,
    stargazers_count: 20,
    forks_count: 2,
    open_issues_count: 1,
    subscribers_count: 3,
    created_at: "2026-01-01T00:00:00Z",
    pushed_at: "2026-08-01T00:00:00Z",
    license: { name: "MIT License" },
  };
}

function discovery(repos: EnrichedRepo[]): IndexDiscovery {
  return {
    query: "awesome-mcp in:name",
    candidateCount: repos.length,
    repos,
    decisions: repos.map((item) => ({
      repo: item,
      included: true,
      reason: "index metadata signal",
    })),
  };
}

function coverage(repos: EnrichedRepo[]): CoverageAnalysis {
  return {
    summary: {
      indexes: repos.length,
      readmesAnalyzed: repos.length,
      readmesMissing: 0,
      cacheHits: 0,
      uniqueLinkedRepositories: 1,
      links: repos.length,
    },
    indexes: repos.map((item) => ({
      indexId: `${item.owner.login}/${item.name}`.toLowerCase(),
      pushedAt: item.pushed_at,
      readmeStatus: "analyzed",
      source: "github",
      linkedRepositoryCount: 1,
      uniqueLinkedRepositoryCount: repos.length === 1 ? 1 : 0,
      sharedLinkedRepositoryCount: repos.length === 1 ? 0 : 1,
      repositories: ["vendor/server"],
    })),
    repositories: [
      {
        repositoryId: "vendor/server",
        indexCount: repos.length,
        indexes: repos.map(
          (item) => `${item.owner.login}/${item.name}`.toLowerCase(),
        ),
      },
    ],
  };
}

test("index dataset is normalized, sorted, and schema-valid", () => {
  const repos = [repo("z-index"), repo("a-index")];
  const parsed = IndexDatasetSchema.parse(
    JSON.parse(
      generateIndexDataset(
        repos,
        discovery(repos),
        coverage(repos),
        GENERATED_AT,
      ),
    ),
  );

  assert.equal(parsed.generatedAt, GENERATED_AT);
  assert.deepEqual(
    parsed.indexes.map((item) => item.name),
    ["a-index", "z-index"],
  );
  assert.equal(parsed.indexes[0].metrics.stars, 20);
  assert.equal(parsed.indexes[0].analysis.linkedRepositoryCount, 1);
});

test("coverage dataset carries an explicit methodology disclaimer", () => {
  const repos = [repo("a-index")];
  const parsed = CoverageDatasetSchema.parse(
    JSON.parse(generateCoverageDataset(coverage(repos), GENERATED_AT)),
  );
  assert.match(parsed.methodology, /not guaranteed/);
  assert.equal(parsed.repositories[0].repositoryId, "vendor/server");
});

test("discovery audit records inclusion decisions and summary", () => {
  const repos = [repo("a-index")];
  const source = discovery(repos);
  source.decisions.push({
    repo: repo("rejected-server"),
    included: false,
    reason: "individual MCP server",
  });
  source.candidateCount = 2;

  const parsed = DiscoveryAuditSchema.parse(
    JSON.parse(generateDiscoveryAudit(source, GENERATED_AT)),
  );
  assert.deepEqual(parsed.summary, { candidates: 2, included: 1, excluded: 1 });
});
