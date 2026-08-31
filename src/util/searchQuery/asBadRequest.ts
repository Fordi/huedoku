// cast errors from a function as a bad request
import { BadRequestError } from "../errors.ts";
import { SearchQuerySyntaxError } from "./tokenizer.ts";
import { SearchQueryCompileError } from "./compile.ts";

/**
 * Runs `fn` (a repository list() call whose `search` option may throw
 * SearchQuerySyntaxError/SearchQueryCompileError for malformed client input),
 * translating either into a BadRequestError so the route's normal error
 * handling turns it into a 400 with a clear message - any other error
 * propagates unchanged.
 */
export async function asBadRequest<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (
      err instanceof SearchQuerySyntaxError ||
      err instanceof SearchQueryCompileError
    ) {
      throw new BadRequestError(`invalid search query: ${err.message}`);
    }
    throw err;
  }
}
