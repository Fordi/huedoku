// helper for accessing server-backed resources
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

export type Search<ID extends string | number | undefined, Resource> = {
  search?: string;
  sort?: `${keyof Resource & string}${"" | " asc" | " desc"}`;
  size?: number;
  page?: number;
  have?: ID[];
  /** ISO 8601 instant, matching the server's z.iso.datetime() query field. */
  last?: string;
};

export type Page<ID extends string | number | undefined, Resource> = {
  query: Search<ID, Resource>;
  total: number;
  results: ID[];
  resources: ID extends string | number
    ? Record<ID, Resource>
    : Record<"@", Resource>;
};

export type Update<
  ID extends string | number | undefined,
  Resource extends { id: ID },
> = Omit<Partial<Resource>, "id">;

export interface ResourceSpec<
  ID extends string | number,
  Resource extends { id: ID },
  CreateResource = Update<ID, Resource>,
  UpdateResource = Update<ID, Resource>,
> {
  /** Groups hook instances that should share one cache; same key = same data, same TTL clock, same GC lifetime. */
  key: string;
  /** How long a cached resource is trusted before it's considered stale and refetched. Default 60s. */
  ttlMs?: number;
  list?: (options: Search<ID, Resource>) => Promise<Page<ID, Resource>>;
  create?: (options: CreateResource) => Promise<Resource>;
  update?: (id: ID, options: UpdateResource) => Promise<Resource>;
  get?: (id: ID) => Promise<Resource>;
  delete?: (id: ID) => Promise<void>;
}

interface CacheEntry<Resource> {
  resource: Resource;
  fetchedAt: number;
}

interface SharedCache<ID extends string | number, Resource> {
  entries: Map<ID, CacheEntry<Resource>>;
  /** Most recent instant (server-reported, via a completed list()) known to be fully reflected locally. */
  lastSyncedAt: Date | undefined;
  refCount: number;
  gcTimer: ReturnType<typeof setTimeout> | undefined;
  /** Notifies every mounted hook instance sharing this cache to re-render. */
  listeners: Set<() => void>;
  /**
   * Bumped on every create/update/delete. A write changes which ids belong
   * on a page (or their order/count), not just one resource's fields, so
   * page results can't be trusted to still be current the way individual
   * cached entries can - callers that want a live view of a listing (e.g.
   * a <select> of every library) re-run list() when this changes, via
   * useResource's `generation` return value as a useEffect dependency.
   */
  generation: number;
}

const sharedCaches = new Map<string, SharedCache<string | number, unknown>>();

/** Grace period before a zero-referent cache is actually dropped, so route/remount churn doesn't thrash it. */
const GC_GRACE_MS = 10_000;

function acquireCache<ID extends string | number, Resource>(
  key: string,
): SharedCache<ID, Resource> {
  let cache = sharedCaches.get(key) as SharedCache<ID, Resource> | undefined;
  if (!cache) {
    cache = {
      entries: new Map(),
      lastSyncedAt: undefined,
      refCount: 0,
      gcTimer: undefined,
      listeners: new Set(),
      generation: 0,
    };
    sharedCaches.set(key, cache);
  }
  if (cache.gcTimer !== undefined) {
    clearTimeout(cache.gcTimer);
    cache.gcTimer = undefined;
  }
  cache.refCount += 1;
  return cache;
}

function releaseCache(
  key: string,
  cache: SharedCache<string | number, unknown>,
): void {
  cache.refCount -= 1;
  if (cache.refCount > 0) return;
  cache.gcTimer = setTimeout(() => {
    if (cache.refCount <= 0) sharedCaches.delete(key);
  }, GC_GRACE_MS);
  // Node's setTimeout returns a Timeout with unref() (a plain number in a
  // real browser, where this is a no-op) - this is pure in-memory cache
  // eviction with no user-visible effect, so it shouldn't keep a Node
  // process (notably the test runner) alive just to wait it out.
  cache.gcTimer?.unref?.();
}

export default function useResource<
  ID extends string | number,
  Resource extends { id: ID },
  CreateResource = Update<ID, Resource>,
  UpdateResource = Update<ID, Resource>,
>(spec: ResourceSpec<ID, Resource, CreateResource, UpdateResource>) {
  const ttlMs = spec.ttlMs ?? 60_000;
  const cacheRef = useRef<SharedCache<ID, Resource> | undefined>(undefined);
  const [, forceRender] = useState(0);
  const specRef = useRef(spec);
  specRef.current = spec;

  if (!cacheRef.current) {
    cacheRef.current = acquireCache<ID, Resource>(spec.key);
  }

  useEffect(() => {
    const cache = cacheRef.current!;
    const rerender = () => forceRender((n) => n + 1);
    cache.listeners.add(rerender);
    return () => {
      cache.listeners.delete(rerender);
      releaseCache(spec.key, cache);
    };
  }, [spec.key]);

  const notify = useCallback(() => {
    for (const listener of cacheRef.current!.listeners) listener();
  }, []);

  /** Like notify(), but also bumps `generation` - for writes that can change which ids belong on a page. */
  const invalidate = useCallback(() => {
    cacheRef.current!.generation += 1;
    notify();
  }, [notify]);

  const list = useCallback(
    async (options: Omit<Search<ID, Resource>, "have" | "last"> = {}) => {
      const { list: doList } = specRef.current;
      if (!doList)
        throw new Error(
          `useResource(${specRef.current.key}): no list() configured`,
        );
      const cache = cacheRef.current!;
      const now = Date.now();

      const have = [...cache.entries.entries()]
        .filter(([, entry]) => now - entry.fetchedAt < ttlMs)
        .map(([id]) => id);

      const page = await doList({
        ...options,
        have,
        last: cache.lastSyncedAt?.toISOString(),
      });

      for (const id of page.results) {
        const resource = (page.resources as Record<string, Resource>)[String(id)];
        if (resource !== undefined) {
          cache.entries.set(id, { resource, fetchedAt: now });
        }
      }
      cache.lastSyncedAt = new Date(now);
      notify();

      return {
        ...page,
        resources: Object.fromEntries(
          page.results
            .map((id) => [id, cache.entries.get(id)?.resource])
            .filter(([, r]) => r !== undefined),
        ) as Page<ID, Resource>["resources"],
      };
    },
    [ttlMs, notify],
  );

  const get = useCallback(
    async (id: ID, opts: { force?: boolean } = {}) => {
      const cache = cacheRef.current!;
      const cached = cache.entries.get(id);
      if (!opts.force && cached && Date.now() - cached.fetchedAt < ttlMs) {
        return cached.resource;
      }
      const { get: doGet } = specRef.current;
      if (!doGet)
        throw new Error(`useResource(${specRef.current.key}): no get() configured`);
      const resource = await doGet(id);
      cache.entries.set(id, { resource, fetchedAt: Date.now() });
      notify();
      return resource;
    },
    [ttlMs, notify],
  );

  const create = useCallback(
    async (options: CreateResource) => {
      const { create: doCreate } = specRef.current;
      if (!doCreate)
        throw new Error(
          `useResource(${specRef.current.key}): no create() configured`,
        );
      const resource = await doCreate(options);
      cacheRef.current!.entries.set(resource.id, {
        resource,
        fetchedAt: Date.now(),
      });
      // A new resource changes which ids belong on a page (and total), so
      // every cached list() result is now potentially stale.
      invalidate();
      return resource;
    },
    [invalidate],
  );

  const update = useCallback(
    async (id: ID, options: UpdateResource) => {
      const { update: doUpdate } = specRef.current;
      if (!doUpdate)
        throw new Error(
          `useResource(${specRef.current.key}): no update() configured`,
        );
      const resource = await doUpdate(id, options);
      cacheRef.current!.entries.set(id, { resource, fetchedAt: Date.now() });
      // A field change can affect sort order or a search/filter match, so
      // page membership/ordering isn't necessarily still correct either.
      invalidate();
      return resource;
    },
    [invalidate],
  );

  const remove = useCallback(
    async (id: ID) => {
      const { delete: doDelete } = specRef.current;
      if (!doDelete)
        throw new Error(
          `useResource(${specRef.current.key}): no delete() configured`,
        );
      await doDelete(id);
      cacheRef.current!.entries.delete(id);
      invalidate();
    },
    [invalidate],
  );

  const cached = useCallback(
    (id: ID) => cacheRef.current!.entries.get(id)?.resource,
    [],
  );

  /**
   * Drops one resource's cached entry (if any) and bumps generation, so the
   * next list() won't report it in `have` and the server sends a fresh copy
   * - for external signals a write-through (create/update/delete) can't see,
   * e.g. a WebSocket event indicating a resource changed some other way.
   * Otherwise the entry would look "fresh" purely by TTL clock and the
   * server would keep omitting it from `resources`, serving the stale
   * locally-cached copy indefinitely.
   */
  const expire = useCallback(
    (id: ID) => {
      cacheRef.current!.entries.delete(id);
      invalidate();
    },
    [invalidate],
  );

  return {
    list,
    get,
    create,
    update,
    delete: remove,
    cached,
    expire,
    generation: cacheRef.current.generation,
  };
}
