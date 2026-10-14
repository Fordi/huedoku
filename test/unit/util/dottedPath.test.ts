import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getAtPath, withAtPath } from "../../../src/util/dottedPath.ts";

describe("dottedPath", () => {
  it("getAtPath reads a top-level field", () => {
    assert.equal(getAtPath({ password: "secret" }, "password"), "secret");
  });

  it("getAtPath reads a nested field via a dotted path", () => {
    assert.equal(
      getAtPath({ auth: { password: "secret" } }, "auth.password"),
      "secret",
    );
  });

  it("getAtPath returns undefined for a missing field, at any depth", () => {
    assert.equal(getAtPath({}, "password"), undefined);
    assert.equal(getAtPath({ auth: {} }, "auth.password"), undefined);
    assert.equal(getAtPath({}, "auth.password"), undefined);
  });

  it("getAtPath returns undefined rather than throwing when an intermediate segment isn't an object", () => {
    assert.equal(
      getAtPath({ auth: "not an object" }, "auth.password"),
      undefined,
    );
    assert.equal(getAtPath(null, "password"), undefined);
    assert.equal(getAtPath("a string", "password"), undefined);
  });

  it("getAtPath does not treat an array as a traversable object", () => {
    assert.equal(getAtPath({ list: ["a", "b"] }, "list.0"), undefined);
  });

  it("withAtPath replaces a top-level field without mutating the original", () => {
    const original = { host: "h", password: "secret" };
    const result = withAtPath(original, "password", "[REDACTED]");
    assert.deepEqual(result, { host: "h", password: "[REDACTED]" });
    assert.equal(
      original.password,
      "secret",
      "the original object must not be mutated",
    );
  });

  it("withAtPath replaces a nested field, cloning every intermediate level", () => {
    const original = { auth: { host: "h", password: "secret" } };
    const result = withAtPath(original, "auth.password", "[REDACTED]");
    assert.deepEqual(result, { auth: { host: "h", password: "[REDACTED]" } });
    assert.equal(
      original.auth.password,
      "secret",
      "the original nested object must not be mutated",
    );
    assert.notEqual(result, original, "the top level must be a new object");
    assert.notEqual(
      (result as { auth: unknown }).auth,
      original.auth,
      "the intermediate level must also be a new object",
    );
  });

  it("withAtPath is a no-op when the path doesn't exist in the value", () => {
    const original = { host: "h" };
    const result = withAtPath(original, "password", "[REDACTED]");
    assert.deepEqual(result, { host: "h" });
  });

  it("withAtPath is a no-op through a missing intermediate segment, rather than fabricating structure", () => {
    const original = { host: "h" };
    const result = withAtPath(original, "auth.password", "[REDACTED]");
    assert.deepEqual(result, { host: "h" });
  });

  it("withAtPath leaves sibling fields untouched", () => {
    const original = { host: "h", username: "u", password: "secret" };
    const result = withAtPath(original, "password", "[REDACTED]");
    assert.deepEqual(result, {
      host: "h",
      username: "u",
      password: "[REDACTED]",
    });
  });
});
