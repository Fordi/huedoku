// parameter validation
import { BadRequestError } from "./errors.ts";

export function stringParam(value: string | string[] | undefined): string {
  if (typeof value !== "string")
    throw new BadRequestError("invalid path parameter");
  return value;
}
