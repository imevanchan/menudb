import assert from "node:assert/strict";
import test from "node:test";
import { publishStatus } from "../lib/integrations/uber/publish-status.ts";

test("only a verified matching version without an unresolved problem is up to date", () => {
  assert.equal(publishStatus({ unavailable: false, current: true, latestStatus: "verified" }).label, "Up to date");
  assert.equal(publishStatus({ unavailable: false, current: false, latestStatus: "verified" }).label, "Unpublished changes");
  assert.equal(publishStatus({ unavailable: false, current: false }).label, "Unpublished changes");
});

test("failed or unavailable publishing is not hidden by an older matching success", () => {
  for (const latestStatus of ["failed", "mismatch", "uncertain", "accepted"]) {
    assert.equal(publishStatus({ unavailable: false, current: true, latestStatus }).label, "Needs attention");
  }
  assert.equal(publishStatus({ unavailable: true, current: true }).label, "Needs attention");
  assert.equal(publishStatus({ unavailable: true, current: true, activeStatus: "running" }).label, "Publishing");
});
