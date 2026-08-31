// Redaction for sensitive fields to be passed to the client
import { getAtPath, withAtPath } from "../util/dottedPath.ts";

/**
 * Declares which fields of a runtime config value must never be sent back
 * to a client - credentials/tokens a downloader or Filer needs to talk to
 * an external service, but that GET /config has no business exposing once
 * they're set. Keyed by the config key itself, each entry a list of
 * **dotted paths** into that key's JSON value (not just top-level field
 * names) so a future nested config shape (e.g. `{auth: {password: "..."}}`)
 * doesn't need a different mechanism - `redactSensitiveFields`/
 * `mergeSensitiveFields` below both walk paths the same way regardless of
 * depth.
 *
 * This is a static, code-level registry (not admin/runtime-editable) -
 * adding a new sensitive field is a code change alongside whatever
 * Downloader/Filer/config consumer introduces it, the same way registering
 * a new Downloader or Filer is.
 */
export const SENSITIVE_CONFIG_FIELDS: Record<string, string[]> = {};

export function markSensitive(...path: string[]) {
  SENSITIVE_CONFIG_FIELDS[path[0]] = path.slice(1);
}

/**
 * Sent in place of a sensitive field's real value on GET /config. Chosen to
 * be unambiguous (never a value a real credential would coincidentally
 * equal) and self-explanatory if it ever leaks into a UI a developer is
 * inspecting - deliberately not a bare "••••••••" or empty string, either
 * of which could be mistaken for the field's actual (masked, or genuinely
 * empty) value rather than "redacted, unchanged server-side."
 */
export const REDACTED_SENTINEL = "[REDACTED]";

/**
 * Returns `value` with every sensitive field (per SENSITIVE_CONFIG_FIELDS)
 * replaced by REDACTED_SENTINEL - used by GET /config before a config
 * entry is sent to a client. A field that isn't present in `value` (e.g. an
 * optional credential nobody's configured yet) is left absent, not
 * fabricated as a redacted placeholder.
 */
export function redactSensitiveFields(key: string, value: unknown): unknown {
  const sensitivePaths = SENSITIVE_CONFIG_FIELDS[key];
  if (!sensitivePaths || sensitivePaths.length === 0) return value;

  let redacted = value;
  for (const path of sensitivePaths) {
    if (getAtPath(redacted, path) === undefined) continue;
    redacted = withAtPath(redacted, path, REDACTED_SENTINEL);
  }
  return redacted;
}

/**
 * Reconciles an incoming PUT body against the previously-stored value for
 * the same config key: for every sensitive field, if the incoming value at
 * that path is exactly REDACTED_SENTINEL, the *stored* value at that path
 * is kept (the client never actually saw or changed the real secret - this
 * is what a widget round-tripping a GET response straight back through PUT
 * naturally sends when the user didn't touch that field); any other
 * incoming value (including an intentionally-cleared "") is treated as a
 * real, deliberate update and passed through as-is.
 *
 * Called unconditionally by setRuntimeConfig for every key - a key with no
 * SENSITIVE_CONFIG_FIELDS entry (or no `stored` value yet) is returned
 * untouched.
 */
export function mergeSensitiveFields(
  key: string,
  incoming: unknown,
  stored: unknown,
): unknown {
  const sensitivePaths = SENSITIVE_CONFIG_FIELDS[key];
  if (!sensitivePaths || sensitivePaths.length === 0 || stored === undefined)
    return incoming;

  let merged = incoming;
  for (const path of sensitivePaths) {
    if (getAtPath(incoming, path) !== REDACTED_SENTINEL) continue;
    merged = withAtPath(merged, path, getAtPath(stored, path));
  }
  return merged;
}
