// search query lexer
/**
 * Lexer for the search-query grammar (see parser.ts for the full EBNF).
 * Terminals: identifiers, numbers, quoted strings, `@`-prefixed dates
 * (absolute ISO 8601 instants or signed ISO 8601 durations), operators
 * (comparison, boolean, `in`), and parens.
 */
export type TokenType =
  | "identifier"
  | "number"
  | "string"
  | "date"
  | "and"
  | "or"
  | "not"
  | "in"
  | "lparen"
  | "rparen"
  | "comma"
  | "eq"
  | "neq"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "eof";

export interface Token {
  type: TokenType;
  /** Raw text this token was lexed from (for identifiers/numbers/dates) or the decoded value (for strings). */
  value: string;
  pos: number;
}

export class SearchQuerySyntaxError extends Error {
  pos: number;
  constructor(message: string, pos: number) {
    super(`${message} (at position ${pos})`);
    this.pos = pos;
  }
}

const SIMPLE_TOKENS: Record<string, TokenType> = {
  "(": "lparen",
  ")": "rparen",
  ",": "comma",
  "&": "and",
  "|": "or",
  "!": "not",
};

function isIdentStart(ch: string): boolean {
  return /[A-Za-z_]/.test(ch);
}
function isIdentPart(ch: string): boolean {
  return /[A-Za-z0-9_]/.test(ch);
}
function isDigit(ch: string): boolean {
  return /[0-9]/.test(ch);
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const peek = () => input[i];

  while (i < input.length) {
    const ch = input[i]!;

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === "'") {
      const start = i;
      i++;
      let value = "";
      while (true) {
        if (i >= input.length)
          throw new SearchQuerySyntaxError("unterminated string literal", start);
        const c = input[i]!;
        if (c === "\\" && input[i + 1] === "'") {
          value += "'";
          i += 2;
          continue;
        }
        if (c === "'") {
          i++;
          break;
        }
        value += c;
        i++;
      }
      tokens.push({ type: "string", value, pos: start });
      continue;
    }

    if (ch === "@") {
      const start = i;
      i++;
      let value = "";
      // Consume everything that could plausibly belong to a date/duration
      // literal (letters, digits, and ISO 8601 punctuation); the parser is
      // responsible for actually validating the shape, so the lexer is
      // deliberately permissive here.
      while (i < input.length && /[A-Za-z0-9:+\-.TZ]/.test(input[i]!)) {
        value += input[i];
        i++;
      }
      if (value === "")
        throw new SearchQuerySyntaxError(
          "expected a date/duration after '@'",
          start,
        );
      tokens.push({ type: "date", value, pos: start });
      continue;
    }

    if (ch === "=") {
      tokens.push({ type: "eq", value: "=", pos: i });
      i++;
      continue;
    }
    if (ch === "!") {
      if (peek() === undefined)
        throw new SearchQuerySyntaxError("unexpected '!' at end of input", i);
      if (input[i + 1] === "=") {
        tokens.push({ type: "neq", value: "!=", pos: i });
        i += 2;
        continue;
      }
      tokens.push({ type: "not", value: "!", pos: i });
      i++;
      continue;
    }
    if (ch === "<") {
      if (input[i + 1] === "=") {
        tokens.push({ type: "lte", value: "<=", pos: i });
        i += 2;
      } else {
        tokens.push({ type: "lt", value: "<", pos: i });
        i++;
      }
      continue;
    }
    if (ch === ">") {
      if (input[i + 1] === "=") {
        tokens.push({ type: "gte", value: ">=", pos: i });
        i += 2;
      } else {
        tokens.push({ type: "gt", value: ">", pos: i });
        i++;
      }
      continue;
    }

    if (ch in SIMPLE_TOKENS) {
      tokens.push({ type: SIMPLE_TOKENS[ch]!, value: ch, pos: i });
      i++;
      continue;
    }

    if (isDigit(ch) || (ch === "-" && isDigit(input[i + 1] ?? ""))) {
      const start = i;
      let value = "";
      if (ch === "-") {
        value += ch;
        i++;
      }
      while (i < input.length && isDigit(input[i]!)) {
        value += input[i];
        i++;
      }
      if (input[i] === "." && isDigit(input[i + 1] ?? "")) {
        value += ".";
        i++;
        while (i < input.length && isDigit(input[i]!)) {
          value += input[i];
          i++;
        }
      }
      tokens.push({ type: "number", value, pos: start });
      continue;
    }

    if (isIdentStart(ch)) {
      const start = i;
      let value = "";
      while (i < input.length && isIdentPart(input[i]!)) {
        value += input[i];
        i++;
      }
      const lower = value.toLowerCase();
      if (lower === "in") tokens.push({ type: "in", value, pos: start });
      else tokens.push({ type: "identifier", value, pos: start });
      continue;
    }

    throw new SearchQuerySyntaxError(`unexpected character '${ch}'`, i);
  }

  tokens.push({ type: "eof", value: "", pos: input.length });
  return tokens;
}
