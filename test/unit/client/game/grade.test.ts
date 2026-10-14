import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { gradePuzzle, isDeducible } from "../../../../src/client/game/grade.ts";
import {
  generateBoard,
  findSolutions,
} from "../../../../src/client/game/huedoku.ts";
import { seededRng } from "../../helpers/seededRng.ts";

describe("gradePuzzle", () => {
  it("solves to the true winners whenever it doesn't get stuck", () => {
    for (let seed = 0; seed < 40; seed++) {
      const size = 5 + (seed % 6);
      const rng = seededRng(seed);
      const board = generateBoard(size, rng, { skew: seed % 3, snake: 0 });
      const grade = gradePuzzle(size, board.regions);
      if (grade.tier < 6) assert.deepEqual(grade.winners, board.winners);
    }
  });

  it("grades a board of one-cell giveaways as singles", () => {
    // Every region but the last is a single cell, placed on a valid solution;
    // the last region takes the rest of the board.
    const size = 5;
    const winners = [0, 2, 4, 1, 3];
    const regions = new Array<number>(25).fill(4);
    winners.slice(0, 4).forEach((col, row) => (regions[row * 5 + col] = row));
    assert.deepEqual(findSolutions(size, regions, 2), [winners]);
    const grade = gradePuzzle(size, regions);
    assert.equal(grade.tier, 1);
    assert.deepEqual(grade.winners, winners);
  });

  it("gets stuck (tier 6) on a board with many solutions", () => {
    // Regions are the rows: nothing pins any winner down.
    const regions = Array.from({ length: 25 }, (_, cell) =>
      Math.floor(cell / 5),
    );
    assert.equal(gradePuzzle(5, regions).tier, 6);
  });

  it("needs harder deductions on some boards than others", () => {
    const tiers = new Set<number>();
    for (let seed = 0; seed < 30; seed++) {
      const board = generateBoard(9, seededRng(seed), {
        skew: seed % 2 ? 0 : 4,
        snake: 0,
      });
      tiers.add(gradePuzzle(9, board.regions).tier);
    }
    assert.ok(tiers.size >= 3, `tiers seen: ${[...tiers]}`);
  });
});

describe("isDeducible", () => {
  const size = 8;
  const board = generateBoard(size, seededRng(7), { skew: 1, snake: 0 });
  const winner = (row: number) => row * size + board.winners[row];
  const none = { found: [], ruledOut: [] };

  it("sees the last winner once the rest are found", () => {
    const found = [0, 1, 2, 3, 4, 5, 6].map(winner);
    assert.ok(
      isDeducible(size, board.regions, { found, ruledOut: [] }, winner(7)),
    );
  });

  it("sees a winner whose row is otherwise ruled out", () => {
    const ruledOut = Array.from(
      { length: size },
      (_, c) => 2 * size + c,
    ).filter((c) => c !== winner(2));
    assert.ok(
      isDeducible(size, board.regions, { found: [], ruledOut }, winner(2)),
    );
  });

  it("can prove any winner given enough steps and tiers, and none in zero", () => {
    assert.ok(gradePuzzle(size, board.regions).tier < 6);
    for (let row = 0; row < size; row++) {
      assert.ok(
        isDeducible(size, board.regions, none, winner(row), {
          maxTier: 5,
          maxSteps: Infinity,
        }),
      );
      assert.ok(
        !isDeducible(size, board.regions, none, winner(row), {
          maxTier: 5,
          maxSteps: 0,
        }),
      );
    }
  });
});
