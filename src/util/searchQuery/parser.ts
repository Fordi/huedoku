// search query parser
import {
  tokenize,
  SearchQuerySyntaxError,
  type Token,
  type TokenType,
} from "./tokenizer.ts";
import type { Atom, BoolNode, CompOp, DateLiteral } from "./ast.ts";

/**
 * Recursive-descent parser for the search-query grammar:
 *
 * expr        = or_expr ;
 * or_expr     = and_expr , { "|" , and_expr } ;
 * and_expr    = negation , { "&" , negation } ;
 * negation    = "!" , negation
 *             | bool_atom ;
 * bool_atom   = comparison
 *             | "(" , expr , ")" ;
 * comparison  = atom , comp_op , atom
 *             | atom , "in" , "(" , atom , { "," , atom } , ")" ;
 * comp_op     = "=" | "!=" | "<" | "<=" | ">" | ">=" ;
 *
 * atom        = identifier
 *             | number
 *             | string
 *             | date ;
 *
 * identifier  = letter , { letter | digit | "_" } ;
 * number      = [ "-" ] , digit , { digit } , [ "." , digit , { digit } ] ;
 * string      = "'" , { any_char_except_quote | "\\'" } , "'" ;
 *
 * date              = "@" , ( absolute_datetime | signed_duration ) ;
 * absolute_datetime = iso8601_date_or_datetime ;        (* e.g. 2026-07-27T12:00:00Z *)
 * signed_duration   = ( "+" | "-" ) , iso8601_duration ; (* e.g. -PT1M, +P1D *)
 * iso8601_duration  = "P" , { digit , duration_unit }- , [ "T" , { digit , time_unit }- ] ;
 * duration_unit     = "Y" | "M" | "D" | "W" ;
 * time_unit         = "H" | "M" | "S" ;
 *
 * The critical invariant this parser enforces: `&`, `|`, and `!` only ever
 * combine `BoolNode`s (comparison/in/not/and/or) - there is no production
 * that lets a bare Atom reach a boolean connective without first passing
 * through a comp_op or `in`. See ast.ts for why that matters.
 */

const COMP_OPS: Partial<Record<TokenType, CompOp>> = {
  eq: "=",
  neq: "!=",
  lt: "<",
  lte: "<=",
  gt: ">",
  gte: ">=",
};

// Both the date-part and time-part are individually optional (e.g. "PT1M"
// has no date-part, "P1D" has no time-part), but at least one component must
// be present overall - bare "P" is not a valid duration.
const DURATION_RE = /^P(?!$)(?:\d+[YMWD])*(?:T(?:\d+[HMS])+)?$/;
const DATETIME_RE =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

class Parser {
  private tokens: Token[];
  private i = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.i]!;
  }

  private advance(): Token {
    return this.tokens[this.i++]!;
  }

  private expect(type: TokenType, what: string): Token {
    const tok = this.peek();
    if (tok.type !== type) {
      throw new SearchQuerySyntaxError(
        `expected ${what}, got '${tok.value || tok.type}'`,
        tok.pos,
      );
    }
    return this.advance();
  }

  parseProgram(): BoolNode {
    const node = this.parseExpr();
    this.expect("eof", "end of input");
    return node;
  }

  private parseExpr(): BoolNode {
    return this.parseOr();
  }

  private parseOr(): BoolNode {
    let left = this.parseAnd();
    while (this.peek().type === "or") {
      this.advance();
      const right = this.parseAnd();
      left = { type: "or", left, right };
    }
    return left;
  }

  private parseAnd(): BoolNode {
    let left = this.parseNegation();
    while (this.peek().type === "and") {
      this.advance();
      const right = this.parseNegation();
      left = { type: "and", left, right };
    }
    return left;
  }

  private parseNegation(): BoolNode {
    if (this.peek().type === "not") {
      this.advance();
      const operand = this.parseNegation();
      return { type: "not", operand };
    }
    return this.parseBoolAtom();
  }

  private parseBoolAtom(): BoolNode {
    if (this.peek().type === "lparen") {
      this.advance();
      const inner = this.parseExpr();
      this.expect("rparen", "')'");
      return inner;
    }
    return this.parseComparison();
  }

  private parseComparison(): BoolNode {
    const left = this.parseAtom();

    if (this.peek().type === "in") {
      this.advance();
      this.expect("lparen", "'(' after 'in'");
      const values: Atom[] = [this.parseAtom()];
      while (this.peek().type === "comma") {
        this.advance();
        values.push(this.parseAtom());
      }
      this.expect("rparen", "')' to close 'in (...)'");
      return { type: "in", left, values };
    }

    const opTok = this.peek();
    const op = COMP_OPS[opTok.type];
    if (!op) {
      throw new SearchQuerySyntaxError(
        `expected a comparison operator (=, !=, <, <=, >, >=) or 'in', got '${opTok.value || opTok.type}' - a bare value is not a valid expression`,
        opTok.pos,
      );
    }
    this.advance();
    const right = this.parseAtom();
    return { type: "comparison", op, left, right };
  }

  private parseAtom(): Atom {
    const tok = this.peek();
    switch (tok.type) {
      case "identifier":
        this.advance();
        return { type: "identifier", name: tok.value };
      case "number":
        this.advance();
        return { type: "number", value: Number(tok.value) };
      case "string":
        this.advance();
        return { type: "string", value: tok.value };
      case "date":
        this.advance();
        return parseDateLiteral(tok.value, tok.pos);
      default:
        throw new SearchQuerySyntaxError(
          `expected an identifier, number, string, or date, got '${tok.value || tok.type}'`,
          tok.pos,
        );
    }
  }
}

function parseDateLiteral(raw: string, pos: number): DateLiteral {
  const sign = raw[0] === "+" ? 1 : raw[0] === "-" ? -1 : undefined;
  if (sign !== undefined) {
    const duration = raw.slice(1);
    if (!DURATION_RE.test(duration)) {
      throw new SearchQuerySyntaxError(
        `invalid ISO 8601 duration '${duration}' after '${raw[0]}'`,
        pos,
      );
    }
    return { type: "date", kind: "relative", sign, duration };
  }
  if (!DATETIME_RE.test(raw)) {
    throw new SearchQuerySyntaxError(
      `invalid ISO 8601 date/datetime '${raw}'`,
      pos,
    );
  }
  return { type: "date", kind: "absolute", iso: raw };
}

/** Parses a search-query string into its AST. Throws SearchQuerySyntaxError on malformed input. */
export function parseSearchQuery(input: string): BoolNode {
  const tokens = tokenize(input);
  return new Parser(tokens).parseProgram();
}

export { SearchQuerySyntaxError } from "./tokenizer.ts";
