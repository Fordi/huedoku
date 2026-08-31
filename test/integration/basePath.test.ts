import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import type { Knex } from "knex";
import { createTestDb } from "./helpers/testDb.ts";
import { buildRepositories } from "../../src/db/repositories/index.ts";
import { buildServer } from "../../src/server.ts";
import { TEST_ENV } from "./helpers/testApp.ts";

describe("BASE_PATH", () => {
  let knex: Knex;

  before(async () => {
    knex = await createTestDb();
  });

  after(async () => {
    await knex.destroy();
  });

  it("mounts the API under BASE_PATH and 404s outside it", async () => {
    const repos = buildRepositories(knex);
    const { app } = buildServer({ ...TEST_ENV, basePath: "/my-app" }, repos);

    const outside = await request(app).get("/me");
    assert.equal(outside.status, 404);

    const inside = await request(app).get("/my-app/auth/me");
    assert.equal(inside.status, 401); // reached the API, just unauthenticated
  });

  it("session cookie is scoped to BASE_PATH", async () => {
    const repos = buildRepositories(knex);
    const { app } = buildServer({ ...TEST_ENV, basePath: "/my-app" }, repos);

    const res = await request(app).get("/my-app/auth/github");
    const setCookie = res.headers["set-cookie"] as unknown as string[];
    assert.ok(setCookie.every((c) => c.includes("path=/my-app")));
  });
});
