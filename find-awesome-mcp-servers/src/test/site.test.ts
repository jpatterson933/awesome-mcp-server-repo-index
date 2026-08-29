import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test } from "node:test";

test("static catalog assets and generated dataset are deployment-ready", async () => {
  const repositoryRoot = resolve(process.cwd(), "..");
  const [html, script, styles, dataset] = await Promise.all([
    readFile(resolve(repositoryRoot, "site/index.html"), "utf8"),
    readFile(resolve(repositoryRoot, "site/app.js"), "utf8"),
    readFile(resolve(repositoryRoot, "site/styles.css"), "utf8"),
    readFile(resolve(repositoryRoot, "data/indexes.json"), "utf8"),
  ]);

  assert.match(html, /\.\/app\.js/);
  assert.match(html, /\.\/styles\.css/);
  assert.match(script, /\.\/data\/indexes\.json/);
  assert.ok(styles.length > 1_000);
  assert.ok(JSON.parse(dataset).indexes.length >= 50);
});
