import assert from "node:assert";
import { HUP } from "../../src/hup.ts";
import { describe, it } from "node:test";

describe("HUP", () => {
  it("is just a string", () => {
    assert.equal(HUP, "Restarting");
  });
});
