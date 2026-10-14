// helpers for redacting sensitive content
/** Splits "foo.bar.baz" into ["foo", "bar", "baz"]. Empty segments (leading/trailing/doubled dots) are dropped rather than producing a "" path key. */
function splitPath(path: string): string[] {
  return path.split(".").filter((segment) => segment.length > 0);
}

/** Reads a dotted path out of a value, e.g. getAtPath({foo: {bar: 1}}, "foo.bar") === 1. Returns undefined if any segment along the way is missing or the value isn't a plain object at that point - never throws on a malformed/absent path. */
export function getAtPath(value: unknown, path: string): unknown {
  let current = value;
  for (const segment of splitPath(path)) {
    if (
      current === null ||
      typeof current !== "object" ||
      Array.isArray(current)
    )
      return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/**
 * Returns a deep-cloned copy of `value` with the value at `path` replaced by
 * `replacement` - intermediate objects are cloned (not mutated) at every
 * level along the path so the caller's original `value` is left untouched.
 * A path through a missing/non-object intermediate segment is a no-op
 * (returns `value` as-is via a shallow clone at the top level) rather than
 * fabricating structure that wasn't there - redaction/merging should never
 * invent config shape that doesn't already exist.
 */
export function withAtPath(
  value: unknown,
  path: string,
  replacement: unknown,
): unknown {
  const segments = splitPath(path);
  if (segments.length === 0) return replacement;
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return value;

  const [head, ...rest] = segments as [string, ...string[]];
  const obj = value as Record<string, unknown>;
  if (rest.length === 0) {
    if (!(head in obj)) return value;
    return { ...obj, [head]: replacement };
  }
  if (!(head in obj)) return value;
  return { ...obj, [head]: withAtPath(obj[head], rest.join("."), replacement) };
}
