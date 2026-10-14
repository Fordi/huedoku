import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isPerfect,
  markPoints,
  maxPoints,
  POINTS,
  starThresholds,
  starsFor,
} from "../../../../src/client/game/score.ts";
import type { Mark } from "../../../../src/client/game/huedoku.ts";

describe("markPoints", () => {
  it("charges each newly ruled-out cell and scores each submission", () => {
    const before: Mark[] = ["blank", "blank", "blank", "invalid", "blank"];
    const after: Mark[] = ["invalid", "invalid", "found", "invalid", "wrong"];
    assert.equal(
      markPoints(before, after),
      2 * POINTS.invalid + POINTS.found + POINTS.wrong,
    );
  });

  it("makes clearing a mark free", () => {
    assert.equal(markPoints(["invalid", "invalid"], ["blank", "invalid"]), 0);
  });
});

describe("starsFor", () => {
  // N = 10: best 200, 90 other cells to rule out, a wrong guess costs 25
  it("puts the thresholds where the formulas say", () => {
    assert.equal(maxPoints(10), 200);
    assert.deepEqual(starThresholds(10), [60, 85, 132.5]);
  });

  it("gives one star for just making it, and none for backtracking", () => {
    assert.equal(starsFor(60, 10, 2), 1); // everything ruled out, two wrong
    assert.equal(starsFor(59, 10, 2), 0); // ...and an undo
  });

  it("gives two stars for everything ruled out and one wrong guess", () => {
    assert.equal(starsFor(85, 10, 1), 2);
    assert.equal(starsFor(84, 10, 1), 1);
  });

  it("gives three stars for a light touch and no wrong guesses", () => {
    assert.equal(starsFor(133, 10, 0), 3); // 67 ruled out
    assert.equal(starsFor(132, 10, 0), 2); // 68 ruled out
    // any wrong guess rules out three stars, however high the score
    assert.equal(starsFor(180, 10, 1), 2);
  });

  it("calls only the best possible score perfect", () => {
    assert.ok(isPerfect(200, 10));
    assert.ok(!isPerfect(199, 10));
  });
});
