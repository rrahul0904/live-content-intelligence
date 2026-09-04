import assert from "node:assert/strict";
import test from "node:test";
import { decryptSecret, encryptSecret } from "./crypto.js";

const key = "this-is-a-test-key-with-more-than-32-characters";

test("secret encryption round trips", () => {
  const encrypted = encryptSecret("oauth-token-value", key);
  assert.notEqual(encrypted, "oauth-token-value");
  assert.equal(decryptSecret(encrypted, key), "oauth-token-value");
});

test("different encryptions use different IVs", () => {
  const first = encryptSecret("same-value", key);
  const second = encryptSecret("same-value", key);
  assert.notEqual(first, second);
});
