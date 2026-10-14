// resource-aware, sortable HTML table component
import { toChildArray, type ComponentChildren, type VNode } from "preact";
import { useEffect, useState } from "preact/hooks";
import { html } from "../util/html.ts";
import type { Page, Search } from "../hooks/useResource.ts";

export interface ResourceColumnProps<Resource> {
  /** Field to read off each row and to sort by. Omit for a column that has no underlying field (e.g. a controls/actions column) - such a column can't be sorted. */
  name?: keyof Resource & string;
  label: string;
  /** Renders a cell's contents. Defaults to `(columnData) => String(columnData)`. Receives the raw field value (undefined when `name` is omitted), the column name, and the full row. */
  format?: (
    columnData: unknown,
    columnName: string | undefined,
    row: Resource,
  ) => ComponentChildren;
}

/** Declares one column of a <ResourceTable>. Renders nothing itself - <ResourceTable> reads its children's props to build the table. */
export function ResourceColumn<Resource>(
  _props: ResourceColumnProps<Resource>,
): null {
  return null;
}

/**
 * Declares the fallback shown instead of the table (no headers, no empty
 * body row) when a <ResourceTable>'s current page has zero rows. Renders
 * nothing itself - <ResourceTable> reads its children and renders them in
 * place of the table. Optional; without one, <ResourceTable> falls back to
 * a plain "No results." message.
 */
export function NoResults(_props: { children?: ComponentChildren }): null {
  return null;
}

function defaultFormat(columnData: unknown): ComponentChildren {
  return String(columnData);
}

export default function ResourceTable<
  ID extends string | number,
  Resource extends { id: ID },
>(props: {
  resource: {
    list: (options: Search<ID, Resource>) => Promise<Page<ID, Resource>>;
    generation?: number;
  };
  size?: number;
  /** Initial sort, e.g. "created_at desc". Clicking a sortable header overrides this. */
  sort?: `${keyof Resource & string}${"" | " asc" | " desc"}`;
  /** A server-side search-query expression (see src/util/searchQuery), applied as-is on every list(). */
  search?: string;
  /**
   * Bump this (e.g. a counter) to force a re-list without waiting for the
   * resource's own cache generation to change - for callers that learn about
   * changes through a side channel the shared cache doesn't know about (e.g.
   * a WebSocket event for a resource this table doesn't itself own writes to).
   */
  refreshKey?: unknown;
  /** Called with the rows from every successful list(), including empty pages - for callers that need to react to the actual fetched data (e.g. scheduling a refetch keyed off a row's timestamp), not just trigger one. */
  onData?: (rows: Resource[]) => void;
  children: ComponentChildren;
}) {
  const size = props.size ?? 50;
  const allChildren = toChildArray(props.children) as VNode<unknown>[];
  const columns = allChildren.filter((c) => c.type === ResourceColumn) as VNode<
    ResourceColumnProps<Resource>
  >[];
  const noResults = allChildren.find((c) => c.type === NoResults) as
    VNode<{ children?: ComponentChildren }> | undefined;

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(props.sort);
  const [data, setData] = useState<Page<ID, Resource> | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    props.resource
      .list({ page, size, sort, search: props.search })
      .then((result) => {
        setData(result);
        setError(undefined);
        const resources = result.resources as Record<ID, Resource>;
        props.onData?.(
          result.results
            .map((id) => resources[id])
            .filter((r): r is Resource => !!r),
        );
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : String(err)),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    size,
    sort,
    props.search,
    props.resource.generation,
    props.refreshKey,
  ]);

  const resources = data?.resources as Record<ID, Resource> | undefined;
  const rows = (data?.results ?? [])
    .map((id) => resources?.[id])
    .filter((r): r is Resource => !!r);
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / size));

  const [sortField, sortDir] = (sort ?? "").split(" ") as [
    string,
    string | undefined,
  ];

  const toggleSort = (name: string) => {
    setPage(1);
    setSort((current) => {
      const [field, dir] = (current ?? "").split(" ");
      if (field !== name) return name as typeof sort;
      if (dir === "asc") return `${name} desc` as typeof sort;
      if (dir === "desc") return undefined;
      return `${name} asc` as typeof sort;
    });
  };

  return html`
    <div class="resource-table">
      ${error ? html`<p class="error">${error}</p>` : null}
      ${
        rows.length === 0
          ? html`<div class="no-results">
              ${noResults ? noResults.props.children : "No results."}
            </div>`
          : html`
              <table>
                <thead>
                  <tr>
                    ${columns.map((col) => {
                      const { name, label } = col.props;
                      const active = !!name && sortField === name;
                      return html`
                        <th
                          key=${label}
                          class=${name ? "sortable" : ""}
                          aria-sort=${active ? (sortDir === "desc" ? "descending" : "ascending") : undefined}
                          onClick=${name ? () => toggleSort(name) : undefined}
                        >
                          ${label}${active ? html`<span class="sort-indicator">${sortDir === "desc" ? " ▼" : " ▲"}</span>` : null}
                        </th>
                      `;
                    })}
                  </tr>
                </thead>
                <tbody>
                  ${rows.map(
                    (row) => html`
                      <tr key=${row.id}>
                        ${columns.map((col) => {
                          const { name, format } = col.props;
                          const columnData = name
                            ? (row as Record<string, unknown>)[name]
                            : undefined;
                          const render = format ?? defaultFormat;
                          // Long unbroken values (a magnet link, a long URL, ...)
                          // have nowhere to wrap and would otherwise force the
                          // whole table wider than the page - cells are
                          // ellipsis-truncated in CSS (see .resource-table td),
                          // with the untruncated value still available via this
                          // native tooltip so nothing is actually lost.
                          const titleText =
                            columnData === undefined || columnData === null
                              ? undefined
                              : String(columnData);
                          return html`<td
                            key=${col.props.label}
                            title=${titleText}
                          >
                            ${render(columnData, name, row)}
                          </td>`;
                        })}
                      </tr>
                    `,
                  )}
                </tbody>
              </table>
            `
      }
      ${
        pageCount > 1 &&
        html`
          <div class="pagination">
            <button
              type="button"
              disabled=${page <= 1}
              onClick=${() => setPage((p) => p - 1)}
            >
              ‹ Prev
            </button>
            <span>Page ${page} of ${pageCount}</span>
            <button
              type="button"
              disabled=${page >= pageCount}
              onClick=${() => setPage((p) => p + 1)}
            >
              Next ›
            </button>
          </div>
        `
      }
    </div>
  `;
}
