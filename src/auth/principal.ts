// middleware to put user on requests
import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { Repositories } from "../db/repositories/index.ts";
import type { Role } from "../db/types.ts";
import { hashToken } from "./tokens.ts";
import { UnauthorizedError } from "../util/errors.ts";

export interface Principal {
  userId: number;
  role: Role;
  authMethod: "session" | "token";
  tokenId?: number;
}

declare module "express-serve-static-core" {
  interface Request {
    principal?: Principal;
  }
}

export function buildAuthenticateMiddleware(repos: Repositories): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    resolvePrincipal(req, repos)
      .then((principal) => {
        req.principal = principal;
        next();
      })
      .catch(next);
  };
}

async function resolvePrincipal(
  req: Request,
  repos: Repositories,
): Promise<Principal | undefined> {
  const authHeader = req.header("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const raw = authHeader.slice("Bearer ".length).trim();
    const tokenHash = hashToken(raw);
    const token = await repos.accessTokens.findActiveByHash(tokenHash);
    if (!token) return undefined;
    const user = await repos.users.findById(token.user_id);
    if (!user) return undefined;
    void repos.accessTokens.touchLastUsed(token.id);
    return {
      userId: user.id,
      role: user.role,
      authMethod: "token",
      tokenId: token.id,
    };
  }

  const userId = req.session?.userId;
  if (typeof userId === "number") {
    const user = await repos.users.findById(userId);
    if (!user) return undefined;
    return { userId: user.id, role: user.role, authMethod: "session" };
  }

  return undefined;
}

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.principal) {
    next(new UnauthorizedError());
    return;
  }
  next();
}
