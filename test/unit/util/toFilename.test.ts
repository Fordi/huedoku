import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { toFilename } from "../../../src/util/toFilename.ts";

describe("toFilename", () => {
  it("replaces control characters", () => {
    const result = toFilename("a\x00b\nc");
    // eslint-disable-next-line no-control-regex -- asserting control chars are absent
    assert.doesNotMatch(result, /[\x00-\x1f]/);
  });

  it("substitutes a colon followed by a space with ' - '", () => {
    assert.equal(toFilename("Title: Subtitle"), "Title - Subtitle");
  });

  it("substitutes a bare colon (no trailing space) so it never survives unescaped", () => {
    // A bare/trailing colon has no " " to pair with the ": " rule above, but
    // is just as unsafe on Windows/exFAT as one that does - this is the gap
    // that let a value like "Colon:NoSpace" or a trailing "Title:" through
    // unescaped before this rule was added.
    assert.doesNotMatch(toFilename("Colon:NoSpace"), /:/);
    assert.doesNotMatch(toFilename("Trailing:"), /:/);
  });

  it("substitutes ? @ + ... with readable look-alikes", () => {
    assert.equal(toFilename("what?"), "what？");
    assert.equal(toFilename("user@host"), "user at host");
    assert.equal(toFilename("a+b"), "a＋b");
    assert.equal(toFilename("wait..."), "wait…");
  });

  it("substitutes both forward and back slashes so neither can introduce path structure", () => {
    assert.doesNotMatch(toFilename("a/b"), /\//);
    assert.doesNotMatch(toFilename("a\\b"), /\\/);
    // A single backslash (not just a doubled one) must be caught too.
    assert.doesNotMatch(toFilename("single\\backslash"), /\\/);
  });

  it("substitutes quoted text with curly quotes, and a lone double-quote with a fullwidth one", () => {
    assert.equal(toFilename('say "hi" now'), "say “hi” now");
    assert.equal(toFilename('trailing"'), "trailing＂");
  });

  it("substitutes asterisk and angle brackets", () => {
    assert.equal(toFilename("a*b"), "a٭b");
    assert.equal(toFilename("a<b>c"), "a‹b›c");
  });

  it("substitutes the pipe character, which was previously left untouched entirely", () => {
    assert.doesNotMatch(toFilename("a|b"), /\|/);
  });

  it("leaves ordinary text and unicode untouched", () => {
    assert.equal(toFilename("héllo wörld"), "héllo wörld");
    assert.equal(toFilename("Weezer (Blue Album)"), "Weezer (Blue Album)");
  });
});
