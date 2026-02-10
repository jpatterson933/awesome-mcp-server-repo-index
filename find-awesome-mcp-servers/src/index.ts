import { writeFileSync } from "fs";
import { join } from "path";
import { enrichAllRepos, fetchAwesomeMcpRepos } from "./github/api.js";
import { generateActivityTimeline } from "./markdown/activity.js";
import {
  generateAllReposPage,
  updateReadmeWithIndex,
} from "./markdown/allRepos.js";
import { generateTopTens } from "./markdown/leaderboards.js";

async function main(): Promise<void> {
  console.log("\n🔍 Phase 1/3 — Discovering repos");
  const repos = await fetchAwesomeMcpRepos();

  console.log("\n📡 Phase 2/3 — Enriching repo data");
  const enrichedRepos = await enrichAllRepos(repos);

  console.log("\n📝 Phase 3/3 — Generating markdown");
  const outputDir = join(process.cwd(), "..");

  const mainMarkdown = generateAllReposPage(enrichedRepos);
  writeFileSync(join(outputDir, "AWESOME-MCP-REPOS.md"), mainMarkdown);
  console.log("  ✔ AWESOME-MCP-REPOS.md");

  const topTensMarkdown = generateTopTens(enrichedRepos);
  writeFileSync(join(outputDir, "TOP-TENS.md"), topTensMarkdown);
  console.log("  ✔ TOP-TENS.md");

  const activityMarkdown = generateActivityTimeline(enrichedRepos);
  writeFileSync(join(outputDir, "ACTIVITY.md"), activityMarkdown);
  console.log("  ✔ ACTIVITY.md");

  const readmePath = join(outputDir, "README.md");
  const updatedReadme = updateReadmeWithIndex(readmePath, enrichedRepos);
  writeFileSync(readmePath, updatedReadme);
  console.log("  ✔ README.md (index updated)");

  console.log(`\n🏁 Done — ${enrichedRepos.length} repos indexed\n`);
}

main().catch(console.error);
