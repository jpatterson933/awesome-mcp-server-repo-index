import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildCoverageAnalysis,
  crawlIndexReadmes,
  extractLinkedGitHubRepositories,
} from "../analysis/coverage.js";
import { EnrichedRepo } from "../schema/github.js";

test("extracts, normalizes, and deduplicates GitHub repository links", () => {
  const markdown = [
    "https://github.com/Vendor/Server",
    "https://github.com/vendor/server/blob/main/README.md",
    "https://github.com/Other/Tool.git",
    "https://github.com/topics/model-context-protocol",
    "https://github.com/Index/Current",
  ].join("\n");

  assert.deepEqual(
    extractLinkedGitHubRepositories(markdown, "index/current"),
    ["other/tool", "vendor/server"],
  );
});

test("calculates shared and index-unique repository coverage", () => {
  const analysis = buildCoverageAnalysis([
    {
      indexId: "indexes/alpha",
      pushedAt: "2026-08-01T00:00:00Z",
      status: "analyzed",
      source: "github",
      repositories: ["shared/server", "unique/alpha"],
    },
    {
      indexId: "indexes/beta",
      pushedAt: "2026-08-01T00:00:00Z",
      status: "analyzed",
      source: "github",
      repositories: ["shared/server"],
    },
    {
      indexId: "indexes/empty",
      pushedAt: "2026-08-01T00:00:00Z",
      status: "missing",
      source: "cache",
      repositories: [],
    },
  ]);

  assert.deepEqual(analysis.summary, {
    indexes: 3,
    readmesAnalyzed: 2,
    readmesMissing: 1,
    cacheHits: 1,
    uniqueLinkedRepositories: 2,
    links: 3,
  });
  assert.deepEqual(analysis.indexes[0], {
    indexId: "indexes/alpha",
    pushedAt: "2026-08-01T00:00:00Z",
    readmeStatus: "analyzed",
    source: "github",
    linkedRepositoryCount: 2,
    uniqueLinkedRepositoryCount: 1,
    sharedLinkedRepositoryCount: 1,
    repositories: ["shared/server", "unique/alpha"],
  });
});

test("README crawling reuses unchanged cached analysis", async () => {
  const repo = {
    name: "awesome-mcp",
    owner: { login: "Example" },
    pushed_at: "2026-08-01T00:00:00Z",
  } as EnrichedRepo;
  let fetches = 0;

  const results = await crawlIndexReadmes(
    [repo],
    async () => {
      fetches++;
      return "https://github.com/should/not-run";
    },
    new Map([
      [
        "example/awesome-mcp",
        {
          pushedAt: repo.pushed_at,
          status: "analyzed",
          repositories: ["cached/server"],
        },
      ],
    ]),
  );

  assert.equal(fetches, 0);
  assert.equal(results[0].source, "cache");
  assert.deepEqual(results[0].repositories, ["cached/server"]);
});
