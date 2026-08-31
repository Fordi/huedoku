// settings in the database
import type { Repositories } from "../db/repositories/index.ts";
import { mergeSensitiveFields, redactSensitiveFields } from "./sensitiveFields.ts";

let cache = new Map<string, unknown>();

export async function loadRuntimeConfig(repos: Repositories): Promise<void> {
  const rows = await repos.config.list();
  cache = new Map(rows.map((r) => [r.key, r.value]));
}

export function getRuntimeConfig<T = unknown>(
  key: string,
  fallback?: T,
): T | undefined {
  return cache.has(key) ? (cache.get(key) as T) : fallback;
}

/**
 * Writes a runtime config value, first reconciling any sensitive field the
 * client sent back as the redacted placeholder (see sensitiveFields.ts)
 * against what's already stored - so a widget that round-trips a GET
 * response it never saw the real secret in can't accidentally overwrite
 * that secret with the literal placeholder string.
 */
export async function setRuntimeConfig(
  repos: Repositories,
  key: string,
  value: unknown,
): Promise<void> {
  const merged = mergeSensitiveFields(key, value, getRuntimeConfig(key));
  await repos.config.set(key, merged);
  await loadRuntimeConfig(repos);
}

/** Every runtime config entry, with sensitive fields (see sensitiveFields.ts) redacted - this is the only listing a client (GET /config) ever sees. Internal readers needing the real value (Downloaders/Filers) always go through getRuntimeConfig, never this. */
export function listRuntimeConfig(): Array<{ key: string; value: unknown }> {
  return [...cache.entries()].map(([key, value]) => ({
    key,
    value: redactSensitiveFields(key, value),
  }));
}
