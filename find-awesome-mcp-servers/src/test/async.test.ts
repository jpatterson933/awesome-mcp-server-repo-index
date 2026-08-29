import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mapWithConcurrency,
  withGithubRetry,
} from "../utils/async.js";

test("bounded mapping preserves input order", async () => {
  let active = 0;
  let maximumActive = 0;
  const results = await mapWithConcurrency([1, 2, 3, 4], 2, async (value) => {
    active++;
    maximumActive = Math.max(maximumActive, active);
    await new Promise((resolve) => setTimeout(resolve, 2));
    active--;
    return value * 2;
  });

  assert.deepEqual(results, [2, 4, 6, 8]);
  assert.equal(maximumActive, 2);
});

test("GitHub retries transient failures without retrying authentication errors", async () => {
  let transientAttempts = 0;
  const waits: number[] = [];
  const value = await withGithubRetry(
    async () => {
      transientAttempts++;
      if (transientAttempts < 3) throw { status: 503 };
      return "ok";
    },
    { sleep: async (ms) => void waits.push(ms), baseDelayMs: 1 },
  );
  assert.equal(value, "ok");
  assert.equal(transientAttempts, 3);
  assert.equal(waits.length, 2);

  let authAttempts = 0;
  await assert.rejects(
    withGithubRetry(async () => {
      authAttempts++;
      throw { status: 401 };
    }),
  );
  assert.equal(authAttempts, 1);
});
