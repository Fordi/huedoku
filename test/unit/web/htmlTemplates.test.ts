import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Request, Response, NextFunction } from "express";
import { serveHtmlTemplates } from "../../../src/web/htmlTemplates.ts";

async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), "my-app-html-templates-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function fakeReqRes(method: string, reqPath: string) {
  const req = { method, path: reqPath } as Request;
  const state: { status?: number; type?: string; body?: string } = { status: 200 };
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

// A dummy project root; only used to bind importMap(), which these tests
// don't exercise directly (no ${await importMap()} in the fixtures below).
const dummyProjectRoot = new URL("file:///dev/null/");

describe("htmlTemplates", () => {
  it("passes through HTML with no interpolations unchanged", async () => {
    await withTempDir(async (dir) => {
      const html = "<!doctype html>\n<html><body><p>hi</p></body></html>\n";
      await writeFile(path.join(dir, "index.html"), html);
      const middleware = serveHtmlTemplates(dir, dummyProjectRoot);
      const { req, res, state } = fakeReqRes("GET", "/index.html");
      await new Promise<void>((resolve) => {
        const origSend = res.send.bind(res) as (b: string) => void;
        (res as any).send = (b: string) => {
          origSend(b);
          resolve();
        };
        middleware(req, res, () => resolve());
      });
      assert.equal(state.body, html);
      assert.equal(state.type, "text/html");
    });
  });

  it("resolves / to index.html", async () => {
    await withTempDir(async (dir) => {
      await writeFile(path.join(dir, "index.html"), "<p>root index</p>");
      const middleware = serveHtmlTemplates(dir, dummyProjectRoot);
      const { req, res, state } = fakeReqRes("GET", "/");
      await new Promise<void>((resolve) => {
        const origSend = res.send.bind(res) as (b: string) => void;
        (res as any).send = (b: string) => {
          origSend(b);
          resolve();
        };
        middleware(req, res, () => resolve());
      });
      assert.equal(state.body, "<p>root index</p>");
    });
  });

  it("resolves a bare directory path (with or without trailing slash) to its index.html", async () => {
    await withTempDir(async (dir) => {
      await mkdir(path.join(dir, "admin"));
      await writeFile(path.join(dir, "admin", "index.html"), "<p>admin index</p>");
      const middleware = serveHtmlTemplates(dir, dummyProjectRoot);

      for (const reqPath of ["/admin", "/admin/"]) {
        const { req, res, state } = fakeReqRes("GET", reqPath);
        await new Promise<void>((resolve) => {
          const origSend = res.send.bind(res) as (b: string) => void;
          (res as any).send = (b: string) => {
            origSend(b);
            resolve();
          };
          middleware(req, res, () => resolve());
        });
        assert.equal(state.body, "<p>admin index</p>", `for ${reqPath}`);
      }
    });
  });

  it("an existing extensionless file is not mistaken for a directory needing index resolution", async () => {
    await withTempDir(async (dir) => {
      // A real file with no .html suffix and no trailing slash - must fall
      // through to next() (e.g. for express.static or another handler to
      // serve it), not be silently rewritten to "<name>/index.html".
      await writeFile(path.join(dir, "CNAME"), "example.com");
      const middleware = serveHtmlTemplates(dir, dummyProjectRoot);
      const { req, res, next, calledNext } = fakeReqRes("GET", "/CNAME");
      await new Promise<void>((resolve) => {
        middleware(req, res, (...args) => {
          next(...args);
          resolve();
        });
      });
      assert.ok(calledNext());
    });
  });

  it("a directory with no index.html falls through instead of erroring", async () => {
    await withTempDir(async (dir) => {
      await mkdir(path.join(dir, "empty"));
      const middleware = serveHtmlTemplates(dir, dummyProjectRoot);
      const { req, res, next, calledNext } = fakeReqRes("GET", "/empty");
      await new Promise<void>((resolve) => {
        middleware(req, res, (...args) => {
          next(...args);
          resolve();
        });
      });
      assert.ok(calledNext());
    });
  });

  it("a path already ending in .html is not treated as a directory", async () => {
    await withTempDir(async (dir) => {
      await writeFile(path.join(dir, "index.html"), "<p>root index</p>");
      await writeFile(path.join(dir, "about.html"), "<p>about page</p>");
      const middleware = serveHtmlTemplates(dir, dummyProjectRoot);
      const { req, res, state } = fakeReqRes("GET", "/about.html");
      await new Promise<void>((resolve) => {
        const origSend = res.send.bind(res) as (b: string) => void;
        (res as any).send = (b: string) => {
          origSend(b);
          resolve();
        };
        middleware(req, res, () => resolve());
      });
      assert.equal(state.body, "<p>about page</p>");
    });
  });

  it("evaluates ${...} interpolations as real JS, including await", async () => {
    await withTempDir(async (dir) => {
      await writeFile(
        path.join(dir, "index.html"),
        "<p>${1 + 1}</p><p>${await Promise.resolve('async')}</p>",
      );
      const middleware = serveHtmlTemplates(dir, dummyProjectRoot);
      const { req, res, state } = fakeReqRes("GET", "/index.html");
      await new Promise<void>((resolve) => {
        const origSend = res.send.bind(res) as (b: string) => void;
        (res as any).send = (b: string) => {
          origSend(b);
          resolve();
        };
        middleware(req, res, () => resolve());
      });
      assert.equal(state.body, "<p>2</p><p>async</p>");
    });
  });

  it("req is available inside the template scope", async () => {
    await withTempDir(async (dir) => {
      await writeFile(path.join(dir, "index.html"), "<p>${req.path}</p>");
      const middleware = serveHtmlTemplates(dir, dummyProjectRoot);
      const { req, res, state } = fakeReqRes("GET", "/index.html");
      await new Promise<void>((resolve) => {
        const origSend = res.send.bind(res) as (b: string) => void;
        (res as any).send = (b: string) => {
          origSend(b);
          resolve();
        };
        middleware(req, res, () => resolve());
      });
      assert.equal(state.body, "<p>/index.html</p>");
    });
  });

  it("literal backticks and backslashes in the HTML survive rendering", async () => {
    await withTempDir(async (dir) => {
      const html = "<p>`backtick` and \\backslash\\</p>";
      await writeFile(path.join(dir, "index.html"), html);
      const middleware = serveHtmlTemplates(dir, dummyProjectRoot);
      const { req, res, state } = fakeReqRes("GET", "/index.html");
      await new Promise<void>((resolve) => {
        const origSend = res.send.bind(res) as (b: string) => void;
        (res as any).send = (b: string) => {
          origSend(b);
          resolve();
        };
        middleware(req, res, () => resolve());
      });
      assert.equal(state.body, html);
    });
  });

  it("calls next() for non-.html paths", async () => {
    await withTempDir(async (dir) => {
      const middleware = serveHtmlTemplates(dir, dummyProjectRoot);
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

  it("calls next() for a .html path with no matching file", async () => {
    await withTempDir(async (dir) => {
      const middleware = serveHtmlTemplates(dir, dummyProjectRoot);
      const { req, res, next, calledNext } = fakeReqRes("GET", "/missing.html");
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
      const outsideFile = path.join(path.dirname(dir), "outside.html");
      await writeFile(outsideFile, "<p>should not be reachable</p>");
      try {
        const middleware = serveHtmlTemplates(dir, dummyProjectRoot);
        const { req, res, next, calledNext } = fakeReqRes(
          "GET",
          "/../outside.html",
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

  it("passes a template syntax error to next() as an error", async () => {
    await withTempDir(async (dir) => {
      await writeFile(
        path.join(dir, "index.html"),
        "<p>${this is not valid js!!!}</p>",
      );
      const middleware = serveHtmlTemplates(dir, dummyProjectRoot);
      const { req, res, next, nextError } = fakeReqRes("GET", "/index.html");
      await new Promise<void>((resolve) => {
        middleware(req, res, (...args) => {
          next(...args);
          resolve();
        });
      });
      assert.ok(nextError() instanceof Error);
    });
  });
});
