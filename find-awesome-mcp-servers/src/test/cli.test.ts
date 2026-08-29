import assert from "node:assert/strict";
import { test } from "node:test";
import { runCli } from "../index.js";

test("runCli returns zero when generation succeeds", async () => {
  assert.equal(await runCli(async () => undefined), 0);
});

test("runCli reports failures and returns a non-zero exit code", async () => {
  const expectedError = new Error("bad credentials");
  let reportedError: unknown;

  const exitCode = await runCli(
    async () => {
      throw expectedError;
    },
    (error) => {
      reportedError = error;
    },
  );

  assert.equal(exitCode, 1);
  assert.equal(reportedError, expectedError);
});
