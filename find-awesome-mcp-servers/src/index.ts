import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import {
  buildCoverageAnalysis,
  crawlIndexReadmes,
  loadReadmeCache,
} from "./analysis/coverage.js";
import {
  generateCoverageDataset,
  generateDiscoveryAudit,
  generateIndexDataset,
} from "./data/datasets.js";
import {
  enrichAllRepos,
  fetchAwesomeMcpIndexes,
  fetchReadmeContent,
} from "./github/api.js";
import {
  GeneratedOutputs,
  validateGeneratedOutputs,
  writeGeneratedOutputs,
} from "./generation/output.js";
import { generateActivityTimeline } from "./markdown/activity.js";
import {
  generateAllReposPage,
  renderReadmeWithIndex,
} from "./markdown/allRepos.js";
import { generateTopTens } from "./markdown/leaderboards.js";
import { generateCoveragePage } from "./markdown/coverage.js";

const DEFAULT_MINIMUM_REPO_COUNT = 50;

export type MainOptions = {
  outputDir?: string;
  minimumRepoCount?: number;
  now?: Date;
};

function defaultOutputDir(): string {
  return fileURLToPath(new URL("../../", import.meta.url));
}

function configuredMinimumRepoCount(): number {
  const rawValue = process.env.MIN_REPO_COUNT;
  if (!rawValue) return DEFAULT_MINIMUM_REPO_COUNT;

  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`MIN_REPO_COUNT must be a positive integer; received ${rawValue}`);
  }

  return value;
}

export async function main(options: MainOptions = {}): Promise<void> {
  const outputDir = resolve(options.outputDir ?? defaultOutputDir());
  const now = options.now ?? new Date();
  if (Number.isNaN(now.getTime())) throw new Error("Generation clock is invalid");

  console.log("\n🔍 Phase 1/4 — Discovering MCP index repositories");
  const discovery = await fetchAwesomeMcpIndexes();
  const repos = discovery.repos;

  console.log("\n📡 Phase 2/4 — Enriching repo data");
  const enrichedRepos = await enrichAllRepos(repos);

  console.log("\n🕸️ Phase 3/4 — Analyzing index README coverage");
  const readmeCache = await loadReadmeCache(
    resolve(outputDir, "data/index-links.json"),
  );
  const readmes = await crawlIndexReadmes(
    enrichedRepos,
    fetchReadmeContent,
    readmeCache,
  );
  const coverage = buildCoverageAnalysis(readmes);
  console.log(`  ✔ Reused ${coverage.summary.cacheHits}/${enrichedRepos.length} README analyses`);

  console.log("\n📝 Phase 4/4 — Generating artifacts");
  const existingReadme = await readFile(resolve(outputDir, "README.md"), "utf8");
  const generatedAt = now.toISOString();
  const outputs: GeneratedOutputs = {
    "AWESOME-MCP-REPOS.md": generateAllReposPage(enrichedRepos, now),
    "TOP-TENS.md": generateTopTens(enrichedRepos, now),
    "ACTIVITY.md": generateActivityTimeline(enrichedRepos, now),
    "README.md": renderReadmeWithIndex(existingReadme, enrichedRepos, now),
    "INDEX-COVERAGE.md": generateCoveragePage(enrichedRepos, coverage, now),
    "data/indexes.json": generateIndexDataset(
      enrichedRepos,
      discovery,
      coverage,
      generatedAt,
    ),
    "data/discovery-audit.json": generateDiscoveryAudit(
      discovery,
      generatedAt,
    ),
    "data/index-links.json": generateCoverageDataset(coverage, generatedAt),
  };

  validateGeneratedOutputs(
    enrichedRepos,
    outputs,
    options.minimumRepoCount ?? configuredMinimumRepoCount(),
  );
  await writeGeneratedOutputs(outputDir, outputs);

  for (const filename of Object.keys(outputs)) {
    console.log(`  ✔ ${filename}`);
  }

  console.log(`\n🏁 Done — ${enrichedRepos.length} repos indexed\n`);
}

export async function runCli(
  task: () => Promise<void> = main,
  reportError: (error: unknown) => void = console.error,
): Promise<number> {
  try {
    await task();
    return 0;
  } catch (error) {
    reportError(error);
    return 1;
  }
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (entryPath === fileURLToPath(import.meta.url)) {
  void runCli().then((exitCode) => {
    process.exitCode = exitCode;
  });
}
