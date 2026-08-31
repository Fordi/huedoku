import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Request, Response, NextFunction } from "express";
import { serveModules } from "../../../src/web/moduleServer.ts";

async function withTempProject(
  webDependencies: Record<string, string>,
  fn: (dir: string) => Promise<void>,
): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), "my-app-modserver-"));
  try {
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({ dependencies: {}, webDependencies }),
    );
    await symlink(path.resolve("node_modules"), path.join(dir, "node_modules"));
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function fakeReqRes(method: string, reqPath: string) {
  const req = { method, path: reqPath } as Request;
  const state: { status?: number; type?: string; body?: string } = {};
  const res = {
    status(code: number) {
      state.status = code;
      return this;
    },
    type(t: string) {
      state.type = t;
      return this;
    },
    send(body: string) {
      state.body = body;
    },
  } as unknown as Response;
  let nextCalled = false;
  const next: NextFunction = () => {
    nextCalled = true;
  };
  return { req, res, state, next, calledNext: () => nextCalled };
}

describe("moduleServer", () => {
  it("bundles and serves an allowlisted package", async () => {
    await withTempProject({ zod: "^4.0.0" }, async (dir) => {
      const middleware = serveModules(new URL(`file://${dir}/`));
      const { req, res, state } = fakeReqRes("GET", "/modules/zod");
      await new Promise<void>((resolve) => {
        const origSend = res.send.bind(res) as (b: string) => void;
        (res as any).send = (b: string) => {
          origSend(b);
          resolve();
        };
        middleware(req, res, () => resolve());
      });
      assert.equal(state.type, "text/javascript");
      assert.ok(state.body && state.body.length > 0);
    });
  });

  it("bundles and serves a deep-import subpath of an allowlisted package", async () => {
    await withTempProject({ "zod/v4": "^4.0.0" }, async (dir) => {
      const middleware = serveModules(new URL(`file://${dir}/`));
      const { req, res, state } = fakeReqRes("GET", "/modules/zod/v4");
      await new Promise<void>((resolve) => {
        const origSend = res.send.bind(res) as (b: string) => void;
        (res as any).send = (b: string) => {
          origSend(b);
          resolve();
        };
        middleware(req, res, () => resolve());
      });
      assert.equal(state.type, "text/javascript");
      assert.ok(state.body && state.body.length > 0);
    });
  });

  it("rejects a package not listed in webDependencies with 404", async () => {
    await withTempProject({ zod: "^4.0.0" }, async (dir) => {
      const middleware = serveModules(new URL(`file://${dir}/`));
      const { req, res, state } = fakeReqRes("GET", "/modules/express");
      await new Promise<void>((resolve) => {
        const origSend = res.send.bind(res) as (b: string) => void;
        (res as any).send = (b: string) => {
          origSend(b);
          resolve();
        };
        middleware(req, res, () => resolve());
      });
      assert.equal(state.status, 404);
    });
  });

  it("rejects a malformed package name with 400", async () => {
    await withTempProject({ zod: "^4.0.0" }, async (dir) => {
      const middleware = serveModules(new URL(`file://${dir}/`));
      const { req, res, state } = fakeReqRes("GET", "/modules/../../etc/passwd");
      await new Promise<void>((resolve) => {
        const origSend = res.send.bind(res) as (b: string) => void;
        (res as any).send = (b: string) => {
          origSend(b);
          resolve();
        };
        middleware(req, res, () => resolve());
      });
      assert.equal(state.status, 400);
    });
  });

  it("calls next() for paths outside /modules/", async () => {
    await withTempProject({ zod: "^4.0.0" }, async (dir) => {
      const middleware = serveModules(new URL(`file://${dir}/`));
      const { req, res, next, calledNext } = fakeReqRes("GET", "/downloads");
      await new Promise<void>((resolve) => {
        middleware(req, res, (...args) => {
          next(...args);
          resolve();
        });
      });
      assert.ok(calledNext());
    });
  });

  it("caches the bundle across requests (second request reuses the same promise)", async () => {
    await withTempProject({ zod: "^4.0.0" }, async (dir) => {
      const middleware = serveModules(new URL(`file://${dir}/`));

      const first = fakeReqRes("GET", "/modules/zod");
      await new Promise<void>((resolve) => {
        const origSend = first.res.send.bind(first.res) as (b: string) => void;
        (first.res as any).send = (b: string) => {
          origSend(b);
          resolve();
        };
        middleware(first.req, first.res, () => resolve());
      });

      const start = Date.now();
      const second = fakeReqRes("GET", "/modules/zod");
      await new Promise<void>((resolve) => {
        const origSend = second.res.send.bind(second.res) as (b: string) => void;
        (second.res as any).send = (b: string) => {
          origSend(b);
          resolve();
        };
        middleware(second.req, second.res, () => resolve());
      });
      const elapsed = Date.now() - start;

      assert.equal(first.state.body, second.state.body);
      assert.ok(
        elapsed < 200,
        `expected cached response to be fast, took ${elapsed}ms`,
      );
    });
  });
});
