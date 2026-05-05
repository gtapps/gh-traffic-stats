import { test } from "node:test";
import assert from "node:assert/strict";
import { formatMessage, mergeDaily } from "./update-gh-traffic.mjs";

test("formatMessage: under 1000 returns the number as a string", () => {
  assert.equal(formatMessage(0), "0");
  assert.equal(formatMessage(1), "1");
  assert.equal(formatMessage(999), "999");
});

test("formatMessage: at and above 1000 truncates to 'Nk+'", () => {
  assert.equal(formatMessage(1000), "1k+");
  assert.equal(formatMessage(1500), "1k+");
  assert.equal(formatMessage(12345), "12k+");
});

test("mergeDaily: empty existing + API window → all entries sorted ascending", () => {
  const api = [
    { timestamp: "2026-05-02T00:00:00Z", count: 7, uniques: 4 },
    { timestamp: "2026-05-01T00:00:00Z", count: 5, uniques: 3 },
  ];
  const result = mergeDaily([], api);
  assert.equal(result.length, 2);
  assert.equal(result[0].timestamp, "2026-05-01T00:00:00Z");
  assert.equal(result[1].timestamp, "2026-05-02T00:00:00Z");
});

test("mergeDaily: preserves entries older than the 14-day API window", () => {
  const existing = [
    { timestamp: "2026-04-01T00:00:00Z", count: 9, uniques: 5 },
  ];
  const api = [
    { timestamp: "2026-05-01T00:00:00Z", count: 2, uniques: 1 },
  ];
  const result = mergeDaily(existing, api);
  assert.equal(result.length, 2);
  assert.equal(result[0].timestamp, "2026-04-01T00:00:00Z");
  assert.equal(result[1].timestamp, "2026-05-01T00:00:00Z");
});

test("mergeDaily: same-timestamp re-run overwrites with API counts", () => {
  const existing = [
    { timestamp: "2026-05-05T00:00:00Z", count: 3, uniques: 2 },
  ];
  const api = [
    { timestamp: "2026-05-05T00:00:00Z", count: 8, uniques: 5 },
  ];
  const [merged] = mergeDaily(existing, api);
  assert.equal(merged.count, 8);
  assert.equal(merged.uniques, 5);
});

test("mergeDaily: out-of-order API series → sorted ascending", () => {
  const api = [
    { timestamp: "2026-05-03T00:00:00Z", count: 1, uniques: 1 },
    { timestamp: "2026-05-01T00:00:00Z", count: 1, uniques: 1 },
    { timestamp: "2026-05-02T00:00:00Z", count: 1, uniques: 1 },
  ];
  const result = mergeDaily([], api);
  assert.deepEqual(
    result.map((d) => d.timestamp),
    [
      "2026-05-01T00:00:00Z",
      "2026-05-02T00:00:00Z",
      "2026-05-03T00:00:00Z",
    ]
  );
});

test("mergeDaily: empty API + non-empty existing → existing returned sorted", () => {
  const existing = [
    { timestamp: "2026-04-15T00:00:00Z", count: 2, uniques: 1 },
    { timestamp: "2026-04-10T00:00:00Z", count: 4, uniques: 2 },
  ];
  const result = mergeDaily(existing, []);
  assert.deepEqual(
    result.map((d) => d.timestamp),
    ["2026-04-10T00:00:00Z", "2026-04-15T00:00:00Z"]
  );
});
