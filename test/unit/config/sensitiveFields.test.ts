import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  redactSensitiveFields,
  mergeSensitiveFields,
  REDACTED_SENTINEL,
  markSensitive,
} from "../../../src/config/sensitiveFields.ts";

describe("sensitiveFields", () => {
  beforeEach(() => {
    markSensitive("bespokeService", "password");
  });

  it("redactSensitiveFields replaces a registered field with the sentinel", () => {
    const value = { host: "http://x", username: "u", password: "hunter2" };
    const redacted = redactSensitiveFields("bespokeService", value);
    assert.deepEqual(redacted, {
      host: "http://x",
      username: "u",
      password: REDACTED_SENTINEL,
    });
  });

  it("redactSensitiveFields leaves non-sensitive fields untouched", () => {
    const value = { host: "http://x", apiKey: "secret-key" };
    const redacted = redactSensitiveFields("plex", value);
    assert.equal((redacted as { host: string }).host, "http://x");
  });

  it("redactSensitiveFields is a no-op for a config key with no registered sensitive fields", () => {
    const value = { anything: "goes", here: 123 };
    assert.deepEqual(redactSensitiveFields("ytdlp.url_patterns", value), value);
  });

  it("redactSensitiveFields doesn't fabricate a redacted field that wasn't present", () => {
    const value = { host: "http://x" }; // no password key at all
    const redacted = redactSensitiveFields("bespokeService", value);
    assert.deepEqual(redacted, { host: "http://x" });
  });

  it("mergeSensitiveFields keeps the stored secret when the incoming value is the sentinel", () => {
    const stored = { host: "http://x", username: "u", password: "hunter2" };
    const incoming = {
      host: "http://y",
      username: "u2",
      password: REDACTED_SENTINEL,
    };
    const merged = mergeSensitiveFields("bespokeService", incoming, stored);
    assert.deepEqual(merged, {
      host: "http://y",
      username: "u2",
      password: "hunter2",
    });
  });

  it("mergeSensitiveFields treats any non-sentinel value as a real, deliberate update - including an intentionally-cleared empty string", () => {
    const stored = { host: "http://x", username: "u", password: "hunter2" };
    const incoming = { host: "http://x", username: "u", password: "new-password" };
    assert.deepEqual(
      mergeSensitiveFields("bespokeService", incoming, stored),
      incoming,
    );

    const clearing = { host: "http://x", username: "u", password: "" };
    assert.deepEqual(
      mergeSensitiveFields("bespokeService", clearing, stored),
      clearing,
    );
  });

  it("mergeSensitiveFields is a no-op when there's no prior stored value (first-time save)", () => {
    const incoming = {
      host: "http://x",
      username: "u",
      password: REDACTED_SENTINEL,
    };
    // Nothing to merge from - the sentinel is saved as a literal string here,
    // which is unusual but reflects there being no real secret to preserve;
    // callers should never actually send the sentinel on a first save since
    // the client could only have gotten it from a prior GET.
    assert.deepEqual(
      mergeSensitiveFields("bespokeService", incoming, undefined),
      incoming,
    );
  });

  it("mergeSensitiveFields is a no-op for a config key with no registered sensitive fields", () => {
    const stored = { anything: "old" };
    const incoming = { anything: "new" };
    assert.deepEqual(
      mergeSensitiveFields("ytdlp.url_patterns", incoming, stored),
      incoming,
    );
  });

  it("redact then merge round-trips an untouched form back to the real stored value", () => {
    const stored = { host: "http://x", username: "u", password: "hunter2" };
    const redacted = redactSensitiveFields("bespokeService", stored);
    // Simulates a widget that loaded the redacted GET response into form
    // state, the user only changed "username", and it PUTs the whole form
    // back including the untouched (redacted) password field.
    const submittedByWidget = { ...(redacted as object), username: "new-username" };
    const merged = mergeSensitiveFields("bespokeService", submittedByWidget, stored);
    assert.deepEqual(merged, {
      host: "http://x",
      username: "new-username",
      password: "hunter2",
    });
  });
});
