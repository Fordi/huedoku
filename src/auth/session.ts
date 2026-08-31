// session information for express requests
import cookieSession from "cookie-session";
import type { RequestHandler } from "express";
import type { AppConfig } from "../config/env.ts";
import pkg from "../../package.json" with { type: "json" };


declare module "express-serve-static-core" {
  interface Request {
    session?:
      ({ userId?: number; oauthState?: string } & Record<string, unknown>) | null;
  }
}

export function buildSessionMiddleware(env: AppConfig): RequestHandler {
  return cookieSession({
    name: `${pkg.name}.sid`,
    secret: env.SESSION_SECRET,
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: env.basePath === "" ? "/" : env.basePath,
  });
}
