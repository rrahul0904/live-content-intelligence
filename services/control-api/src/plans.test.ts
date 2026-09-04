import assert from "node:assert/strict";
import test from "node:test";
import { assertChannelCapacity, channelLimitForPlan } from "./plans.js";

test("known plan limits are stable", () => {
  assert.equal(channelLimitForPlan("free"), 1);
  assert.equal(channelLimitForPlan("starter"), 3);
  assert.equal(channelLimitForPlan("pro"), 10);
});

test("unknown plans fail closed to free", () => {
  assert.equal(channelLimitForPlan("unknown"), 1);
});

test("capacity guard rejects full plan", () => {
  assert.throws(() => assertChannelCapacity("free", 1));
});
