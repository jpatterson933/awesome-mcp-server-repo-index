import { writeFileSync } from "fs";
import { join } from "path";
import { enrichAllRepos, fetchAwesomeMcpRepos } from "./github/api.js";
import { generateActivityTimeline } from "./markdown/activity.js";
import {
  generateAllReposPage,
  updateReadmeWithIndex,
} from "./markdown/allRepos.js";
import {
  generateTopForked,
  generateTopIssues,
  generateTopLargest,
  generateTopStarred,
  generateTopSubscribed,
} from "./markdown/leaderboards.js";

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

  const leaderboards = [
    { filename: "TOP-STARRED.md", generator: generateTopStarred },
    { filename: "TOP-SUBSCRIBED.md", generator: generateTopSubscribed },
    { filename: "TOP-FORKED.md", generator: generateTopForked },
    { filename: "TOP-ISSUES.md", generator: generateTopIssues },
    { filename: "TOP-LARGEST.md", generator: generateTopLargest },
    { filename: "ACTIVITY.md", generator: generateActivityTimeline },
  ];

  for (const { filename, generator } of leaderboards) {
    const markdown = generator(enrichedRepos);
    writeFileSync(join(outputDir, filename), markdown);
    console.log(`  ✔ ${filename}`);
  }

  const readmePath = join(outputDir, "README.md");
  const updatedReadme = updateReadmeWithIndex(readmePath, enrichedRepos.length);
  writeFileSync(readmePath, updatedReadme);
  console.log("  ✔ README.md (index updated)");

  console.log(`\n🏁 Done — ${enrichedRepos.length} repos indexed\n`);
}

main().catch(console.error);
