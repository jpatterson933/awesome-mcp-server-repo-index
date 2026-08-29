import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateTimePeriod } from "../utils/calculateFreshness.js";

const NOW = new Date("2026-08-28T12:00:00.000Z");

test("freshness boundaries are deterministic", () => {
  assert.equal(calculateTimePeriod("2026-08-27T13:00:00.000Z", NOW), "one_day");
  assert.equal(calculateTimePeriod("2026-08-26T12:00:00.000Z", NOW), "one_week");
  assert.equal(calculateTimePeriod("2026-08-14T12:00:00.000Z", NOW), "one_month");
  assert.equal(calculateTimePeriod("2026-06-01T12:00:00.000Z", NOW), "six_months");
  assert.equal(calculateTimePeriod("2025-01-01T12:00:00.000Z", NOW), "one_year");
});

test("freshness rejects invalid timestamps", () => {
  assert.throws(() => calculateTimePeriod("not-a-date", NOW), /valid dates/);
});
