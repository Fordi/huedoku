import { installDomGlobals } from "../../helpers/domTestSetup.ts";
installDomGlobals();

// Same @testing-library/dom `document`-capture timing issue as
// PlexConfig.test.ts - every DOM-sensitive import must be deferred behind a
// dynamic import() so it evaluates after installDomGlobals() has run.
const { describe, it, afterEach } = await import("node:test");
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- typeof import() needed here since the DOM-timing workaround requires a dynamic import, not a static one
const assert: typeof import("node:assert/strict") = (
  await import("node:assert/strict")
).default;
const { render, cleanup, screen, waitFor } =
  await import("@testing-library/preact");
const { userEvent } = await import("@testing-library/user-event");
const { html } = await import("../../../../src/client/util/html.ts");
const {
  default: ResourceTable,
  ResourceColumn,
  NoResults,
} = await import("../../../../src/client/components/ResourceTable.ts");
import type { Page, Search } from "../../../../src/client/hooks/useResource.ts";

interface Item {
  id: string;
  name: string;
}

function makePage(items: Item[], total = items.length): Page<string, Item> {
  return {
    query: {},
    total,
    results: items.map((i) => i.id),
    resources: Object.fromEntries(items.map((i) => [i.id, i])),
  };
}

describe("ResourceTable", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a header per column and a row per resource", async () => {
    const items = [
      { id: "a", name: "Alpha" },
      { id: "b", name: "Bravo" },
    ];
    render(html`
      <${ResourceTable} resource=${{ list: async () => makePage(items) }}>
        <${ResourceColumn} name="name" label="Name" />
      <//>
    `);

    await screen.findByText("Alpha");
    screen.getByText("Bravo");
    screen.getByText("Name");
  });

  it("shows the NoResults fallback when the page has zero rows", async () => {
    render(html`
      <${ResourceTable} resource=${{ list: async () => makePage([], 0) }}>
        <${ResourceColumn} name="name" label="Name" />
        <${NoResults}>Nothing here yet.<//>
      <//>
    `);

    await screen.findByText("Nothing here yet.");
    assert.equal(screen.queryByRole("table"), null);
  });

  it("falls back to a plain message when no NoResults child is given", async () => {
    render(html`
      <${ResourceTable} resource=${{ list: async () => makePage([], 0) }}>
        <${ResourceColumn} name="name" label="Name" />
      <//>
    `);

    await screen.findByText("No results.");
  });

  it("shows the error message when list() rejects", async () => {
    render(html`
      <${ResourceTable}
        resource=${{
          list: async () => {
            throw new Error("boom");
          },
        }}
      >
        <${ResourceColumn} name="name" label="Name" />
      <//>
    `);

    await screen.findByText("boom");
  });

  it("clicking a sortable header cycles name -> name asc -> name desc -> unsorted, re-listing each time", async () => {
    const items = [{ id: "a", name: "Alpha" }];
    const sorts: (string | undefined)[] = [];
    render(html`
      <${ResourceTable}
        resource=${{
          list: async (options: Search<string, Item>) => {
            sorts.push(options.sort);
            return makePage(items);
          },
        }}
      >
        <${ResourceColumn} name="name" label="Name" />
      <//>
    `);

    await screen.findByText("Alpha");
    const header = screen.getByText("Name");

    const user = userEvent.setup();
    await user.click(header);
    await waitFor(() => assert.equal(sorts.at(-1), "name"));

    await user.click(header);
    await waitFor(() => assert.equal(sorts.at(-1), "name asc"));

    await user.click(header);
    await waitFor(() => assert.equal(sorts.at(-1), "name desc"));

    await user.click(header);
    await waitFor(() => assert.equal(sorts.at(-1), undefined));
  });

  it("a column with no `name` is not clickable/sortable", async () => {
    const items = [{ id: "a", name: "Alpha" }];
    render(html`
      <${ResourceTable} resource=${{ list: async () => makePage(items) }}>
        <${ResourceColumn} label="Actions" format=${() => "x"} />
      <//>
    `);

    const header = await screen.findByText("Actions");
    assert.ok(!header.classList.contains("sortable"));
  });

  it("paginates: Prev is disabled on page 1, Next advances the page", async () => {
    const pagesRequested: (number | undefined)[] = [];
    render(html`
      <${ResourceTable}
        resource=${{
          list: async (options: Search<string, Item>) => {
            pagesRequested.push(options.page);
            return makePage([{ id: "a", name: "Alpha" }], 120);
          },
        }}
        size=${50}
      >
        <${ResourceColumn} name="name" label="Name" />
      <//>
    `);

    await screen.findByText("Page 1 of 3");
    const prev = screen.getByRole("button", { name: "‹ Prev" });
    const next = screen.getByRole("button", { name: "Next ›" });
    assert.ok((prev as HTMLButtonElement).disabled);
    assert.ok(!(next as HTMLButtonElement).disabled);

    const user = userEvent.setup();
    await user.click(next);

    await waitFor(() => assert.equal(pagesRequested.at(-1), 2));
    await screen.findByText("Page 2 of 3");
  });

  it("calls onData with the resolved rows from every successful list()", async () => {
    const items = [{ id: "a", name: "Alpha" }];
    const received: Item[][] = [];
    render(html`
      <${ResourceTable}
        resource=${{ list: async () => makePage(items) }}
        onData=${(rows: Item[]) => received.push(rows)}
      >
        <${ResourceColumn} name="name" label="Name" />
      <//>
    `);

    await waitFor(() => assert.equal(received.length, 1));
    assert.deepEqual(received[0], items);
  });
});
