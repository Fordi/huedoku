import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { buildServer } from "../../src/server.ts";
import { TEST_ENV } from "./helpers/testApp.ts";

describe("BASE_PATH", () => {
  it("serves the client under BASE_PATH and 404s outside it", async () => {
    const { app } = buildServer({ ...TEST_ENV, basePath: "/my-app" });

    const outside = await request(app).get("/index.css");
    assert.equal(outside.status, 404);

    const inside = await request(app).get("/my-app/index.css");
    assert.equal(inside.status, 200);
  });
});
