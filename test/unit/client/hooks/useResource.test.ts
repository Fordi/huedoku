import { installDomGlobals } from "../../helpers/domTestSetup.ts";
installDomGlobals();

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { cleanup, renderHook, act } from "@testing-library/preact";
import useResource, {
  type Page,
  type Search,
} from "../../../../src/client/hooks/useResource.ts";

interface Item {
  id: string;
  name: string;
}

function makePage(
  items: Item[],
  query: Search<string, Item> = {},
): Page<string, Item> {
  return {
    query,
    total: items.length,
    results: items.map((i) => i.id),
    resources: Object.fromEntries(items.map((i) => [i.id, i])),
  };
}

describe("useResource", () => {
  after(() => {
    cleanup();
  });

  it("list() populates the cache and returns the fetched page", async () => {
    const items = [{ id: "a", name: "Alpha" }];
    const { result } = renderHook(() =>
      useResource<string, Item>({
        key: `list-basic-${Math.random()}`,
        list: async () => makePage(items),
      }),
    );

    let page!: Page<string, Item>;
    await act(async () => {
      page = await result.current.list();
    });

    assert.deepEqual(page.results, ["a"]);
    assert.deepEqual(page.resources.a, { id: "a", name: "Alpha" });
    assert.equal(
      result.current.cached("a")?.name,
      "Alpha",
      "a resource returned by list() must be cached",
    );
  });

  it("get() serves from cache within the TTL window instead of calling the server again", async () => {
    let getCalls = 0;
    const key = `get-ttl-${Math.random()}`;
    const { result } = renderHook(() =>
      useResource<string, Item>({
        key,
        ttlMs: 60_000,
        get: async (id) => {
          getCalls += 1;
          return { id, name: `fetched-${getCalls}` };
        },
      }),
    );

    let first!: Item;
    let second!: Item;
    await act(async () => {
      first = await result.current.get("x");
    });
    await act(async () => {
      second = await result.current.get("x");
    });

    assert.equal(
      getCalls,
      1,
      "the second get() within the TTL window must be served from cache, not refetched",
    );
    assert.equal(first.name, second.name);
  });

  it("get({force: true}) bypasses the cache even within the TTL window", async () => {
    let getCalls = 0;
    const key = `get-force-${Math.random()}`;
    const { result } = renderHook(() =>
      useResource<string, Item>({
        key,
        ttlMs: 60_000,
        get: async (id) => {
          getCalls += 1;
          return { id, name: `fetched-${getCalls}` };
        },
      }),
    );

    await act(async () => {
      await result.current.get("x");
    });
    await act(async () => {
      await result.current.get("x", { force: true });
    });

    assert.equal(getCalls, 2);
  });

  it("create() invalidates the cache generation, so a listing consumer knows to refetch", async () => {
    const key = `create-invalidate-${Math.random()}`;
    const { result } = renderHook(() =>
      useResource<string, Item>({
        key,
        list: async () => makePage([]),
        create: async (body) => ({ id: "new", name: body.name ?? "New Item" }),
      }),
    );

    const generationBefore = result.current.generation;
    await act(async () => {
      await result.current.create({ name: "New Item" });
    });

    assert.equal(result.current.generation, generationBefore + 1);
    assert.equal(
      result.current.cached("new")?.name,
      "New Item",
      "a freshly-created resource is cached immediately",
    );
  });

  it("update() invalidates generation and refreshes the cached entry for that id", async () => {
    const key = `update-invalidate-${Math.random()}`;
    const { result } = renderHook(() =>
      useResource<string, Item>({
        key,
        list: async () => makePage([{ id: "a", name: "Original" }]),
        update: async (id, body) => ({ id, name: body.name ?? "Original" }),
      }),
    );

    await act(async () => {
      await result.current.list();
    });
    const generationBefore = result.current.generation;
    await act(async () => {
      await result.current.update("a", { name: "Renamed" });
    });

    assert.equal(result.current.generation, generationBefore + 1);
    assert.equal(result.current.cached("a")?.name, "Renamed");
  });

  it("delete() removes the cached entry and invalidates generation", async () => {
    const key = `delete-invalidate-${Math.random()}`;
    const { result } = renderHook(() =>
      useResource<string, Item>({
        key,
        list: async () => makePage([{ id: "a", name: "Alpha" }]),
        delete: async () => {},
      }),
    );

    await act(async () => {
      await result.current.list();
    });
    assert.ok(result.current.cached("a"));

    const generationBefore = result.current.generation;
    await act(async () => {
      await result.current.delete("a");
    });

    assert.equal(result.current.cached("a"), undefined);
    assert.equal(result.current.generation, generationBefore + 1);
  });

  it("expire() drops a cached entry and bumps generation without calling any server method", async () => {
    const key = `expire-${Math.random()}`;
    const { result } = renderHook(() =>
      useResource<string, Item>({
        key,
        list: async () => makePage([{ id: "a", name: "Alpha" }]),
      }),
    );

    await act(async () => {
      await result.current.list();
    });
    const generationBefore = result.current.generation;
    act(() => {
      result.current.expire("a");
    });

    assert.equal(result.current.cached("a"), undefined);
    assert.equal(result.current.generation, generationBefore + 1);
  });

  it("two hook instances sharing the same key share one cache - a write from one is visible to the other", async () => {
    const key = `shared-cache-${Math.random()}`;
    const spec = {
      key,
      list: async () => makePage([{ id: "a", name: "Alpha" }]),
      create: async (body: { name?: string }) => ({
        id: "b",
        name: body.name ?? "Beta",
      }),
    };

    const first = renderHook(() => useResource<string, Item>(spec));
    const second = renderHook(() => useResource<string, Item>(spec));

    await act(async () => {
      await first.result.current.list();
    });
    await act(async () => {
      await first.result.current.create({ name: "Beta" });
    });

    assert.equal(
      second.result.current.cached("b")?.name,
      "Beta",
      "a create() on one hook instance must be visible via cached() on another sharing the same key",
    );
  });

  it("calling an unconfigured method throws a clear error naming which one", async () => {
    const key = `unconfigured-${Math.random()}`;
    const { result } = renderHook(() => useResource<string, Item>({ key }));

    await assert.rejects(() => result.current.list(), /no list\(\) configured/);
    await assert.rejects(() => result.current.get("a"), /no get\(\) configured/);
    await assert.rejects(
      () => result.current.create({}),
      /no create\(\) configured/,
    );
  });
});
