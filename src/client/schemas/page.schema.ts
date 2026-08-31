// pagination schemas
import { z } from "zod";

/**
 * Query params shared by every "list a resource" endpoint, mirroring the
 * client-side Search<ID, Resource> shape in public/hooks/useResource.ts:
 * page/size drive real DB-level pagination, `sort` is "field" or "field asc"/
 * "field desc", `have` lets the client skip resources it already caches
 * (still counted in `results`/`total`, just omitted from `resources`), and
 * `last` filters to rows updated since a given instant.
 */
export const pageQuerySchema = {
  search: z.string().optional(),
  sort: z.string().optional(),
  size: z.coerce.number().int().min(1).max(200).default(50),
  page: z.coerce.number().int().min(1).default(1),
  have: z.union([z.string(), z.array(z.string())]).optional(),
  last: z.iso.datetime().optional(),
};

export type PageQuery = {
  search?: string;
  sort?: string;
  size: number;
  page: number;
  have?: string | string[];
  last?: string;
};

/** Normalizes a query param that may arrive as a bare value, a repeated value, or absent, to an array. */
export function normalizeArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function pageResponseSchema<
  IdSchema extends z.ZodType<string | number>,
  ResourceSchema extends z.ZodType,
>(idSchema: IdSchema, resourceSchema: ResourceSchema) {
  return z.object({
    query: z.object({
      search: z.string().optional(),
      sort: z.string().optional(),
      size: z.number(),
      page: z.number(),
      have: z.array(idSchema).optional(),
      last: z.string().optional(),
    }),
    total: z.number(),
    results: z.array(idSchema),
    resources: z.record(z.string(), resourceSchema),
  });
}

/**
 * Builds a Page-shaped response body from a page of already-serialized
 * resources plus the resolved total count. `query` is the raw validated
 * request query (as typedVia hands it back); `have` is normalized and
 * echoed, and resources the client already reported having are omitted
 * from `resources` (but still counted in `results`/`total`).
 */
export function buildPage<Id extends string | number, Resource>(
  query: PageQuery,
  rows: Resource[],
  total: number,
  getId: (resource: Resource) => Id,
) {
  const have = normalizeArray(query.have);
  const haveSet = new Set(have);
  const results = rows.map(getId);
  const resources: Record<string, Resource> = {};
  for (const row of rows) {
    const id = getId(row);
    if (!haveSet.has(String(id))) resources[String(id)] = row;
  }
  return {
    query: {
      search: query.search,
      sort: query.sort,
      size: query.size,
      page: query.page,
      have,
      last: query.last,
    },
    total,
    results,
    resources,
  };
}
