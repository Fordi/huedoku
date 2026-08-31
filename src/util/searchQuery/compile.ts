// search query compiler
import type { Knex } from "knex";
import type { Atom, BoolNode } from "./ast.ts";

export type FieldType = "string" | "number" | "date" | "enum";

export interface FieldSpec {
  /** The real, allowlisted column name - never derived from client input. */
  column: string;
  type: FieldType;
  /** Required for type "enum": the only string values this column may be compared against. */
  values?: readonly string[];
}

export type FieldMap = Record<string, FieldSpec>;

export class SearchQueryCompileError extends Error {}

/**
 * Formats a Date the same way this app's own timestamp columns actually get
 * written and compared for the given knex client, so a date literal compiled
 * here compares correctly against real column data no matter which of the
 * three supported databases (see src/db/connection.ts) is in use:
 *
 * - sqlite (better-sqlite3): this app writes timestamps via knex.fn.now(),
 *   i.e. sqlite's own `datetime('now')`, which produces a naive
 *   "YYYY-MM-DD HH:MM:SS" text string (UTC, no "T", no "Z", no ms). Neither
 *   a bound JS Date nor a full ISO string reliably compares against that
 *   text via this driver (confirmed empirically - each silently returns
 *   wrong results in different ways); only that exact text shape does.
 * - mysql2/pg: these use real temporal column types, where the driver's own
 *   Date serialization is already correct - bind the Date object as-is.
 */
function formatDateForComparison(date: Date, knex: Knex): string | Date {
  const client = knex.client.config.client;
  if (client !== "better-sqlite3") return date;
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
  );
}

/** Resolves a signed ISO 8601 duration (e.g. "PT1M") in milliseconds, evaluated relative to `now`. */
function resolveDuration(duration: string, sign: 1 | -1, now: Date): Date {
  const match =
    /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(
      duration,
    );
  if (!match)
    throw new SearchQueryCompileError(`malformed ISO 8601 duration: ${duration}`);
  const [, years, months, weeks, days, hours, minutes, seconds] = match;

  const result = new Date(now.getTime());
  const n = (v: string | undefined) => (v ? Number(v) : 0);
  // Calendar-based components (years/months/weeks/days) applied via the Date
  // object's own field setters so month-length/leap-year arithmetic is
  // correct; clock-based components (hours/minutes/seconds) applied as a
  // flat millisecond offset afterward.
  result.setUTCFullYear(result.getUTCFullYear() + sign * n(years));
  result.setUTCMonth(result.getUTCMonth() + sign * n(months));
  result.setUTCDate(result.getUTCDate() + sign * (n(weeks) * 7 + n(days)));
  const msOffset = sign * ((n(hours) * 60 + n(minutes)) * 60 + n(seconds)) * 1000;
  return new Date(result.getTime() + msOffset);
}

/** A compiled atom: either a literal JS value ready to bind, or a knex column reference for an identifier. */
type CompiledAtom =
  | {
      kind: "value";
      value: string | number | Date;
      fieldType: FieldType | "number" | "string";
    }
  | { kind: "column"; ref: Knex.Raw; fieldType: FieldType };

function compileAtom(
  atom: Atom,
  fields: FieldMap,
  knex: Knex,
  now: Date,
): CompiledAtom {
  switch (atom.type) {
    case "identifier": {
      const spec = fields[atom.name];
      if (!spec) throw new SearchQueryCompileError(`unknown field '${atom.name}'`);
      return { kind: "column", ref: knex.ref(spec.column), fieldType: spec.type };
    }
    case "number":
      return { kind: "value", value: atom.value, fieldType: "number" };
    case "string":
      return { kind: "value", value: atom.value, fieldType: "string" };
    case "date": {
      const value =
        atom.kind === "absolute"
          ? new Date(atom.iso)
          : resolveDuration(atom.duration, atom.sign, now);
      if (Number.isNaN(value.getTime())) {
        throw new SearchQueryCompileError(`invalid date literal`);
      }
      return {
        kind: "value",
        value: formatDateForComparison(value, knex),
        fieldType: "date",
      };
    }
  }
}

/** Whether two compiled-atom "value kinds" are comparable at all, independent of which side is a column vs. a literal. */
function typesCompatible(a: CompiledAtom, b: CompiledAtom): boolean {
  const ta = a.fieldType === "enum" ? "string" : a.fieldType;
  const tb = b.fieldType === "enum" ? "string" : b.fieldType;
  return ta === tb;
}

function describeAtom(atom: Atom): string {
  switch (atom.type) {
    case "identifier":
      return `field '${atom.name}'`;
    case "number":
      return `number ${atom.value}`;
    case "string":
      return `string literal`;
    case "date":
      return `date literal`;
  }
}

function enumSpecFor(atom: Atom, fields: FieldMap): FieldSpec | undefined {
  if (atom.type !== "identifier") return undefined;
  const spec = fields[atom.name];
  return spec?.type === "enum" ? spec : undefined;
}

function bindable(compiled: CompiledAtom): string | number | Date | Knex.Raw {
  return compiled.kind === "column" ? compiled.ref : compiled.value;
}

function compileComparison(
  op: "=" | "!=" | "<" | "<=" | ">" | ">=",
  leftAtom: Atom,
  rightAtom: Atom,
  fields: FieldMap,
  knex: Knex,
  now: Date,
): (qb: Knex.QueryBuilder) => void {
  const left = compileAtom(leftAtom, fields, knex, now);
  const right = compileAtom(rightAtom, fields, knex, now);

  if (!typesCompatible(left, right)) {
    throw new SearchQueryCompileError(
      `type mismatch: cannot compare ${describeAtom(leftAtom)} (${left.fieldType}) with ${describeAtom(rightAtom)} (${right.fieldType})`,
    );
  }

  // Enum columns restrict which string literals may appear on the other side.
  for (const [atom, other] of [
    [leftAtom, right] as const,
    [rightAtom, left] as const,
  ]) {
    const enumSpec = enumSpecFor(atom, fields);
    if (
      enumSpec &&
      other.kind === "value" &&
      typeof other.value === "string" &&
      !enumSpec.values!.includes(other.value)
    ) {
      throw new SearchQueryCompileError(
        `'${other.value}' is not a valid value for field '${(atom as { name: string }).name}' - expected one of: ${enumSpec.values!.join(", ")}`,
      );
    }
  }

  return (qb) => {
    qb.where(bindable(left) as never, op, bindable(right) as never);
  };
}

function compileIn(
  leftAtom: Atom,
  valueAtoms: Atom[],
  fields: FieldMap,
  knex: Knex,
  now: Date,
): (qb: Knex.QueryBuilder) => void {
  const left = compileAtom(leftAtom, fields, knex, now);
  const values = valueAtoms.map((a) => compileAtom(a, fields, knex, now));

  for (const v of values) {
    if (!typesCompatible(left, v)) {
      throw new SearchQueryCompileError(
        `type mismatch in 'in (...)': ${describeAtom(leftAtom)} (${left.fieldType}) vs. a value of type ${v.fieldType}`,
      );
    }
  }

  const enumSpec = enumSpecFor(leftAtom, fields);
  if (enumSpec) {
    for (const [atom, v] of valueAtoms.map(
      (a, idx) => [a, values[idx]!] as const,
    )) {
      if (
        v.kind === "value" &&
        typeof v.value === "string" &&
        !enumSpec.values!.includes(v.value)
      ) {
        throw new SearchQueryCompileError(
          `'${v.value}' is not a valid value for field '${leftAtom.type === "identifier" ? leftAtom.name : ""}' - expected one of: ${enumSpec.values!.join(", ")}`,
        );
      }
      void atom;
    }
  }

  if (left.kind !== "column") {
    throw new SearchQueryCompileError(
      `the left-hand side of 'in (...)' must be a field, not a literal`,
    );
  }
  const columnRef = left.ref;
  const literalValues = values.map((v) => {
    if (v.kind !== "value") {
      throw new SearchQueryCompileError(
        `'in (...)' only supports literal values on the right-hand side, not fields`,
      );
    }
    return v.value;
  });

  return (qb) => {
    qb.whereIn(columnRef as never, literalValues as never[]);
  };
}

function compileNode(
  node: BoolNode,
  fields: FieldMap,
  knex: Knex,
  now: Date,
): (qb: Knex.QueryBuilder) => void {
  switch (node.type) {
    case "comparison":
      return compileComparison(node.op, node.left, node.right, fields, knex, now);
    case "in":
      return compileIn(node.left, node.values, fields, knex, now);
    case "not": {
      const inner = compileNode(node.operand, fields, knex, now);
      return (qb) => qb.whereNot(inner);
    }
    case "and": {
      const left = compileNode(node.left, fields, knex, now);
      const right = compileNode(node.right, fields, knex, now);
      return (qb) => qb.where(left).andWhere(right);
    }
    case "or": {
      const left = compileNode(node.left, fields, knex, now);
      const right = compileNode(node.right, fields, knex, now);
      return (qb) => qb.where((outer) => outer.where(left).orWhere(right));
    }
  }
}

/**
 * Compiles a search-query AST into a function that applies the equivalent
 * WHERE conditions to a knex query builder, validated against `fields` (the
 * allowlist of queryable columns and their types - never derived from
 * client input). Throws SearchQueryCompileError for an unknown field, a
 * type mismatch between the two sides of a comparison, or an enum value
 * outside its declared set.
 *
 * `now` fixes the instant relative-date literals (e.g. `@-PT1M`) resolve
 * against; pass the same Date for every comparison within one query so
 * multiple relative literals in a single expression stay consistent with
 * each other.
 */
export function compileSearchQuery(
  node: BoolNode,
  fields: FieldMap,
  knex: Knex,
  now: Date = new Date(),
): (qb: Knex.QueryBuilder) => void {
  return compileNode(node, fields, knex, now);
}
