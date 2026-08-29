import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyIndexRepository } from "../github/classify.js";
import { GithubRepo } from "../schema/github.js";

function repo(overrides: Partial<GithubRepo> = {}): GithubRepo {
  return {
    name: "awesome-mcp-servers",
    html_url: "https://github.com/example/awesome-mcp-servers",
    owner: {
      login: "example",
      html_url: "https://github.com/example",
    },
    description: "A curated list of Model Context Protocol servers.",
    fork: false,
    topics: [],
    size: 1,
    stargazers_count: 1,
    forks_count: 0,
    open_issues_count: 0,
    created_at: "2026-01-01T00:00:00Z",
    pushed_at: "2026-01-02T00:00:00Z",
    license: null,
    ...overrides,
  };
}

test("includes repositories that identify themselves as curated indexes", () => {
  assert.equal(classifyIndexRepository(repo()).included, true);
});

test("excludes GitHub forks and obvious repository copies", () => {
  assert.equal(classifyIndexRepository(repo({ fork: true })).included, false);
  assert.equal(
    classifyIndexRepository(repo({ name: "awesome-mcp-servers-bak" })).included,
    false,
  );
  assert.equal(
    classifyIndexRepository(repo({ name: "awesome-mcp-servers-submit" }))
      .included,
    false,
  );
});

test("excludes individual MCP servers", () => {
  const individualServer = repo({
    name: "awesome-todo-mcp-server",
    description: "This project is an MCP server built for managing todo lists.",
  });
  assert.equal(classifyIndexRepository(individualServer).included, false);
});

test("requires an explicit index signal", () => {
  assert.equal(
    classifyIndexRepository(repo({ description: "Useful MCP utilities." }))
      .included,
    false,
  );
});
