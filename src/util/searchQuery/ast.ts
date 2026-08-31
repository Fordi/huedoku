// search query AST
/**
 * AST for the search-query grammar. Mirrors the EBNF in parser.ts: the only
 * way to produce a boolean node is `Comparison` or `Not`/`And`/`Or` wrapping
 * other boolean nodes - there is no node type that lets a bare `Atom` (an
 * Identifier/NumberLiteral/StringLiteral/DateLiteral) stand in as a boolean
 * on its own. Column-type/coercion decisions are deliberately *not* made
 * here - the parser has no notion of column types, so e.g. comparing two
 * identifiers, or an identifier to a date literal, is syntactically valid
 * AST; rejecting that (or not) is entirely the compiler's job.
 */

export type Atom = Identifier | NumberLiteral | StringLiteral | DateLiteral;

export interface Identifier {
  type: "identifier";
  name: string;
}

export interface NumberLiteral {
  type: "number";
  value: number;
}

export interface StringLiteral {
  type: "string";
  value: string;
}

/** An absolute ISO 8601 instant, e.g. from `@2026-07-27T12:00:00Z`. */
export interface AbsoluteDateLiteral {
  type: "date";
  kind: "absolute";
  /** The raw ISO 8601 text as written, e.g. "2026-07-27T12:00:00Z". */
  iso: string;
}

/** A signed ISO 8601 duration relative to evaluation time, e.g. from `@-PT1M`. */
export interface RelativeDateLiteral {
  type: "date";
  kind: "relative";
  sign: 1 | -1;
  /** The raw ISO 8601 duration text as written (without the sign), e.g. "PT1M". */
  duration: string;
}

export type DateLiteral = AbsoluteDateLiteral | RelativeDateLiteral;

export type CompOp = "=" | "!=" | "<" | "<=" | ">" | ">=";

export interface Comparison {
  type: "comparison";
  op: CompOp;
  left: Atom;
  right: Atom;
}

export interface InComparison {
  type: "in";
  left: Atom;
  values: Atom[];
}

export interface Not {
  type: "not";
  operand: BoolNode;
}

export interface And {
  type: "and";
  left: BoolNode;
  right: BoolNode;
}

export interface Or {
  type: "or";
  left: BoolNode;
  right: BoolNode;
}

export type BoolNode = Comparison | InComparison | Not | And | Or;
