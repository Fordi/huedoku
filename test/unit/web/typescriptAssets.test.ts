import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Request, Response, NextFunction } from "express";
import { serveTypeScriptAssets } from "../../../src/web/typescriptAssets.ts";

async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), "my-app-ts-assets-"));
  try {
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
  let nextErr: unknown;
  const next: NextFunction = (err?: unknown) => {
    nextCalled = true;
    nextErr = err;
  };
  return {
    req,
    res,
    state,
    next,
    calledNext: () => nextCalled,
    nextError: () => nextErr,
  };
}

describe("typescriptAssets", () => {
  it("strips types from a requested .ts file and serves it as JS", async () => {
    await withTempDir(async (dir) => {
      await writeFile(
        path.join(dir, "app.ts"),
        "const x: number = 1;\nconsole.log(x);\n",
      );
      const middleware = serveTypeScriptAssets(dir);
      const { req, res, state } = fakeReqRes("GET", "/app.ts");
      await new Promise<void>((resolve) => {
        const origSend = res.send.bind(res) as (b: string) => void;
        (res as any).send = (b: string) => {
          origSend(b);
          resolve();
        };
        middleware(req, res, () => resolve());
      });
      assert.equal(state.type, "text/javascript");
      assert.ok(state.body?.includes("console.log(x);"));
      assert.ok(!state.body?.includes(": number"));
    });
  });

  it("calls next() for non-.ts paths without touching the response", async () => {
    await withTempDir(async (dir) => {
      const middleware = serveTypeScriptAssets(dir);
      const { req, res, next, calledNext } = fakeReqRes("GET", "/app.js");
      await new Promise<void>((resolve) => {
        middleware(req, res, (...args) => {
          next(...args);
          resolve();
        });
      });
      assert.ok(calledNext());
    });
  });

  it("calls next() for a .ts path with no matching file (404 falls through)", async () => {
    await withTempDir(async (dir) => {
      const middleware = serveTypeScriptAssets(dir);
      const { req, res, next, calledNext } = fakeReqRes("GET", "/missing.ts");
      await new Promise<void>((resolve) => {
        middleware(req, res, (...args) => {
          next(...args);
          resolve();
        });
      });
      assert.ok(calledNext());
    });
  });

  it("rejects a path that escapes the root directory", async () => {
    await withTempDir(async (dir) => {
      // A sibling file outside `dir` that a naive join could reach via "..".
      const outsideFile = path.join(path.dirname(dir), "outside.ts");
      await writeFile(outsideFile, "console.log('should not be reachable');\n");
      try {
        const middleware = serveTypeScriptAssets(dir);
        const { req, res, next, calledNext } = fakeReqRes(
          "GET",
          "/../outside.ts",
        );
        await new Promise<void>((resolve) => {
          middleware(req, res, (...args) => {
            next(...args);
            resolve();
          });
        });
        assert.ok(calledNext());
      } finally {
        await rm(outsideFile, { force: true });
      }
    });
  });

  it("responds 500 with a clear message for non-erasable syntax", async () => {
    await withTempDir(async (dir) => {
      await writeFile(path.join(dir, "bad.ts"), "enum Bad { A, B }\n");
      const middleware = serveTypeScriptAssets(dir);
      const { req, res, state } = fakeReqRes("GET", "/bad.ts");
      await new Promise<void>((resolve) => {
        const origSend = res.send.bind(res) as (b: string) => void;
        (res as any).send = (b: string) => {
          origSend(b);
          resolve();
        };
        middleware(req, res, () => resolve());
      });
      assert.equal(state.status, 500);
      assert.ok(state.body?.includes("bad.ts"));
    });
  });

  it("ignores non-GET/HEAD methods", async () => {
    await withTempDir(async (dir) => {
      await writeFile(path.join(dir, "app.ts"), "console.log(1);\n");
      const middleware = serveTypeScriptAssets(dir);
      const { req, res, next, calledNext } = fakeReqRes("POST", "/app.ts");
      await new Promise<void>((resolve) => {
        middleware(req, res, (...args) => {
          next(...args);
          resolve();
        });
      });
      assert.ok(calledNext());
    });
  });
});
