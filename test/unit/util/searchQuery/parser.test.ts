import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseSearchQuery } from "../../../../src/util/searchQuery/parser.ts";
import { SearchQuerySyntaxError } from "../../../../src/util/searchQuery/tokenizer.ts";
import type { BoolNode } from "../../../../src/util/searchQuery/ast.ts";

describe("searchQuery.parser", () => {
  it("parses a simple comparison", () => {
    const node = parseSearchQuery("status = 'running'");
    assert.deepEqual(node, {
      type: "comparison",
      op: "=",
      left: { type: "identifier", name: "status" },
      right: { type: "string", value: "running" },
    });
  });

  it("parses 'in' with multiple values", () => {
    const node = parseSearchQuery("status in ('pending', 'running', 'filing')");
    assert.equal(node.type, "in");
    const inNode = node as Extract<BoolNode, { type: "in" }>;
    assert.deepEqual(inNode.left, { type: "identifier", name: "status" });
    assert.deepEqual(
      inNode.values.map((v) => (v as { value: string }).value),
      ["pending", "running", "filing"],
    );
  });

  it("| has lower precedence than &", () => {
    // a | b & c   should parse as   a | (b & c)
    const node = parseSearchQuery("a = 1 | b = 2 & c = 3");
    assert.equal(node.type, "or");
    const or = node as Extract<BoolNode, { type: "or" }>;
    assert.equal(or.left.type, "comparison");
    assert.equal(or.right.type, "and");
  });

  it("parentheses override default precedence", () => {
    const node = parseSearchQuery("(a = 1 | b = 2) & c = 3");
    assert.equal(node.type, "and");
    const and = node as Extract<BoolNode, { type: "and" }>;
    assert.equal(and.left.type, "or");
    assert.equal(and.right.type, "comparison");
  });

  it("! negates a full comparison", () => {
    const node = parseSearchQuery("!status = 'failed'");
    assert.equal(node.type, "not");
    const not = node as Extract<BoolNode, { type: "not" }>;
    assert.equal(not.operand.type, "comparison");
  });

  it("! negates a parenthesized expression", () => {
    const node = parseSearchQuery("!(status = 'failed' | status = 'complete')");
    assert.equal(node.type, "not");
    const not = node as Extract<BoolNode, { type: "not" }>;
    assert.equal(not.operand.type, "or");
  });

  it("column-to-column comparison parses fine (compiler's job to allow/reject)", () => {
    const node = parseSearchQuery("created_at < completed_at");
    assert.deepEqual(node, {
      type: "comparison",
      op: "<",
      left: { type: "identifier", name: "created_at" },
      right: { type: "identifier", name: "completed_at" },
    });
  });

  it("parses an absolute date literal", () => {
    const node = parseSearchQuery("completed_at > @2026-07-27T12:00:00Z");
    const cmp = node as Extract<BoolNode, { type: "comparison" }>;
    assert.deepEqual(cmp.right, {
      type: "date",
      kind: "absolute",
      iso: "2026-07-27T12:00:00Z",
    });
  });

  it("parses a relative (signed duration) date literal", () => {
    const node = parseSearchQuery("completed_at > @-PT1M");
    const cmp = node as Extract<BoolNode, { type: "comparison" }>;
    assert.deepEqual(cmp.right, {
      type: "date",
      kind: "relative",
      sign: -1,
      duration: "PT1M",
    });
  });

  it("parses a positive-signed relative duration", () => {
    const node = parseSearchQuery("expires_at < @+P1D");
    const cmp = node as Extract<BoolNode, { type: "comparison" }>;
    assert.deepEqual(cmp.right, {
      type: "date",
      kind: "relative",
      sign: 1,
      duration: "P1D",
    });
  });

  it("the target expression from the original request parses end to end", () => {
    const node = parseSearchQuery(
      "status in ('pending', 'running', 'filing') | status = 'failed' | (status = 'complete' & completed_at > @-PT1M)",
    );
    assert.equal(node.type, "or");
  });

  it("supports escaped quotes in string literals", () => {
    const node = parseSearchQuery("source_url = 'it\\'s here'");
    const cmp = node as Extract<BoolNode, { type: "comparison" }>;
    assert.deepEqual(cmp.right, { type: "string", value: "it's here" });
  });

  // --- rejection cases: the whole point of this grammar is that a bare value
  // can never reach a boolean connective without passing through a real
  // comparison operator first. ---

  it("rejects a bare identifier as a whole expression", () => {
    assert.throws(() => parseSearchQuery("status"), SearchQuerySyntaxError);
  });

  it("rejects ! applied to a bare identifier", () => {
    assert.throws(() => parseSearchQuery("!status"), SearchQuerySyntaxError);
  });

  it("rejects a parenthesized bare identifier", () => {
    assert.throws(() => parseSearchQuery("(status)"), SearchQuerySyntaxError);
  });

  it("rejects & combining a bare identifier with a comparison", () => {
    assert.throws(
      () => parseSearchQuery("status & other = 1"),
      SearchQuerySyntaxError,
    );
  });

  it("rejects | combining a comparison with a bare identifier", () => {
    assert.throws(
      () => parseSearchQuery("status = 'x' | other"),
      SearchQuerySyntaxError,
    );
  });

  it("rejects an unterminated string", () => {
    assert.throws(
      () => parseSearchQuery("status = 'unterminated"),
      SearchQuerySyntaxError,
    );
  });

  it("rejects an unbalanced paren", () => {
    assert.throws(() => parseSearchQuery("(status = 'x'"), SearchQuerySyntaxError);
  });

  it("rejects trailing garbage after a complete expression", () => {
    assert.throws(
      () => parseSearchQuery("status = 'x' status"),
      SearchQuerySyntaxError,
    );
  });

  it("rejects a malformed date literal", () => {
    assert.throws(
      () => parseSearchQuery("completed_at > @not-a-date"),
      SearchQuerySyntaxError,
    );
  });

  it("rejects an empty 'in' list start (no values)", () => {
    assert.throws(() => parseSearchQuery("status in ()"), SearchQuerySyntaxError);
  });
});
