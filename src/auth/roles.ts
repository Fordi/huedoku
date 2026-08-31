// middleware to require a role
import type { NextFunction, Request, Response } from "express";
import type { Role } from "../db/types.ts";
import { ForbiddenError, UnauthorizedError } from "../util/errors.ts";

export function requireRole(role: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.principal) {
      next(new UnauthorizedError());
      return;
    }
    if (req.principal.role !== role) {
      next(new ForbiddenError(`requires ${role} role`));
      return;
    }
    next();
  };
}
