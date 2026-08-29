import { GithubRepo } from "../schema/github.js";

export type IndexClassification = {
  included: boolean;
  reason: string;
};

const INDEX_DESCRIPTION_SIGNAL =
  /\b(catalog|collection|curated|curation|directory|index|list|marketplace|registry)\b/i;
const COPY_NAME_SIGNAL =
  /(?:^|[-_.])(bak|backup|copy|fork|imported|submit|submission)(?:$|[-_.])/i;
const SINGULAR_SERVER_NAME_SIGNAL = /(?:^|[-_.])mcp[-_.]?server$/i;
const SERVER_DESCRIPTION_SIGNAL =
  /\b(?:an?|my|this)\s+(?:[\w-]+\s+){0,4}(?:model context protocol\s+)?(?:\(mcp\)\s+)?server\b|\bmcp server\b\s+(?:built|for|providing|that|to|with)\b/i;
const GENERATED_EXAMPLE_SIGNAL =
  /\bcreated on icp ninja\b|\bmy first mcp server\b/i;

export function classifyIndexRepository(
  repo: GithubRepo,
): IndexClassification {
  if (repo.fork) {
    return { included: false, reason: "GitHub fork" };
  }

  if (COPY_NAME_SIGNAL.test(repo.name)) {
    return { included: false, reason: "copy, backup, or submission repository" };
  }

  const description = repo.description ?? "";
  if (
    SINGULAR_SERVER_NAME_SIGNAL.test(repo.name) ||
    SERVER_DESCRIPTION_SIGNAL.test(description) ||
    GENERATED_EXAMPLE_SIGNAL.test(description)
  ) {
    return { included: false, reason: "individual MCP server" };
  }

  if (!INDEX_DESCRIPTION_SIGNAL.test(description)) {
    return {
      included: false,
      reason: "description does not identify an index or curated collection",
    };
  }

  return { included: true, reason: "index metadata signal" };
}
