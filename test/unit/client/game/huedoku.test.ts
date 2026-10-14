import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { gradePuzzle } from "../../../../src/client/game/grade.ts";
import {
  LEVELS,
  MAX_DIFFICULTY,
  MAX_BOARD_SIZE,
  MAX_SIZE,
  paletteFor,
  MIN_SIZE,
  commit,
  countSolutions,
  findSolutions,
  gameStatus,
  generatePuzzle,
  growRegions,
  cellsBetween,
  neighbors4,
  nextLevel,
  newGame,
  paintInvalid,
  placeWinners,
  isNiceMove,
  isWinner,
  restoreMarks,
  ruleOutAroundFound,
  startGame,
  toggleMark,
  type GameState,
} from "../../../../src/client/game/huedoku.ts";
import { seededRng } from "../../helpers/seededRng.ts";

const sizes = Array.from(
  { length: MAX_SIZE - MIN_SIZE + 1 },
  (_, i) => MIN_SIZE + i,
);

function assertValidWinners(size: number, winners: number[]) {
  assert.equal(winners.length, size);
  assert.equal(new Set(winners).size, size, "one winner per column");
  for (let row = 1; row < size; row++) {
    assert.ok(
      Math.abs(winners[row] - winners[row - 1]) > 1,
      `rows ${row - 1} and ${row} winners touch`,
    );
  }
}

function regionIsContiguous(size: number, regions: number[], region: number) {
  const cells = regions.flatMap((r, cell) => (r === region ? [cell] : []));
  const seen = new Set([cells[0]]);
  const queue = [cells[0]];
  while (queue.length) {
    for (const n of neighbors4(size, queue.pop()!)) {
      if (regions[n] === region && !seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
  return seen.size === cells.length;
}

describe("placeWinners", () => {
  for (const size of sizes) {
    it(`places ${size} non-touching winners, one per row and column`, () => {
      assertValidWinners(size, placeWinners(size, seededRng(size)));
    });
  }
});

describe("growRegions", () => {
  it("fills every cell with contiguous regions grown from each winner", () => {
    const size = 9;
    const rng = seededRng(1);
    const winners = placeWinners(size, rng);
    const regions = growRegions(size, winners, rng);
    assert.ok(regions.every((r) => r >= 0 && r < size));
    winners.forEach((col, row) => assert.equal(regions[row * size + col], row));
    for (let r = 0; r < size; r++)
      assert.ok(regionIsContiguous(size, regions, r));
  });
});

describe("findSolutions", () => {
  it("finds exactly the placements that satisfy every rule", () => {
    // Regions are the rows, so any valid placement solves it.
    const size = 5;
    const regions = Array.from({ length: 25 }, (_, cell) =>
      Math.floor(cell / 5),
    );
    const solutions = findSolutions(size, regions, Infinity);
    // n=5 has 14 permutations with no adjacent-row columns touching
    assert.equal(solutions.length, 14);
    for (const s of solutions) assertValidWinners(size, s);
  });

  it("respects the limit", () => {
    const regions = Array.from({ length: 25 }, (_, cell) =>
      Math.floor(cell / 5),
    );
    assert.equal(countSolutions(5, regions, 2), 2);
  });
});

describe("generatePuzzle", () => {
  for (const size of sizes) {
    it(`builds a uniquely solvable ${size}x${size} puzzle`, () => {
      const puzzle = generatePuzzle(size, seededRng(size * 7));
      assertValidWinners(size, puzzle.winners);
      assert.equal(puzzle.regions.length, size * size);
      assert.equal(new Set(puzzle.colors).size, size);
      for (let r = 0; r < size; r++) {
        assert.ok(regionIsContiguous(size, puzzle.regions, r), `region ${r}`);
        assert.equal(puzzle.regions[r * size + puzzle.winners[r]], r);
      }
      assert.deepEqual(findSolutions(size, puzzle.regions), [puzzle.winners]);
    });
  }

  it("rejects out-of-range sizes", () => {
    assert.throws(() => generatePuzzle(4), RangeError);
    assert.throws(() => generatePuzzle(MAX_BOARD_SIZE + 1), RangeError);
  });
});

describe("growth shape", () => {
  /** coefficient of variation of region sizes: 0 = all the same size */
  const spread = (size: number, regions: number[]) => {
    const areas = new Array<number>(size).fill(0);
    for (const r of regions) areas[r]++;
    const mean = size;
    const variance = areas.reduce((sum, a) => sum + (a - mean) ** 2, 0) / size;
    return Math.sqrt(variance) / mean;
  };

  it("makes region sizes more even as skew falls", () => {
    const size = 10;
    const averages = [4, 2, 0].map((skew) => {
      let total = 0;
      for (let seed = 0; seed < 20; seed++) {
        const rng = seededRng(seed);
        const regions = growRegions(size, placeWinners(size, rng), rng, {
          skew,
          snake: 0,
        });
        total += spread(size, regions);
      }
      return total / 20;
    });
    assert.ok(averages[0] > averages[1], `${averages}`);
    assert.ok(averages[1] > averages[2], `${averages}`);
  });
});

describe("levels", () => {
  it("run from 5-10 up to 8-14, never past MAX_SIZE", () => {
    assert.deepEqual(LEVELS[0].sizes, [5, 10]);
    assert.deepEqual(LEVELS[MAX_DIFFICULTY - 1].sizes, [8, 14]);
    for (const { sizes, grades } of LEVELS) {
      assert.ok(sizes[0] >= MIN_SIZE && sizes[1] <= MAX_SIZE);
      assert.ok(grades[0] <= grades[1] && grades[1] < 6);
    }
  });

  LEVELS.forEach(({ sizes: [size], grades }, i) => {
    it(`level ${i + 1} builds uniquely solvable ${size}x${size} puzzles graded ${grades.join("-")}`, () => {
      const puzzle = generatePuzzle(size, seededRng(i), { difficulty: i + 1 });
      assert.equal(puzzle.difficulty, i + 1);
      assert.deepEqual(findSolutions(size, puzzle.regions), [puzzle.winners]);
      assert.equal(puzzle.grade, gradePuzzle(size, puzzle.regions).tier);
      assert.ok(
        puzzle.grade >= grades[0] && puzzle.grade <= grades[1],
        `grade ${puzzle.grade}`,
      );
    });
  });
});

describe("nextLevel", () => {
  it("grows the board one size at a time", () => {
    assert.deepEqual(nextLevel({ size: 5, difficulty: 1 }), {
      size: 6,
      difficulty: 1,
    });
    assert.deepEqual(nextLevel({ size: 9, difficulty: 1 }), {
      size: 10,
      difficulty: 1,
    });
  });

  it("goes to the next level's smallest board after this level's largest", () => {
    assert.deepEqual(nextLevel({ size: 10, difficulty: 1 }), {
      size: LEVELS[1].sizes[0],
      difficulty: 2,
    });
  });

  it("repeats the top level", () => {
    const [min, max] = LEVELS[MAX_DIFFICULTY - 1].sizes;
    assert.deepEqual(nextLevel({ size: max, difficulty: MAX_DIFFICULTY }), {
      size: min,
      difficulty: MAX_DIFFICULTY,
    });
  });
});

describe("ruleOutAroundFound", () => {
  it("rules out the row, column, region, and neighbors of each find", () => {
    const puzzle = generatePuzzle(7, seededRng(42));
    const { size, winners, regions } = puzzle;
    const found = 3 * size + winners[3];
    const state = commit(startGame(puzzle), found);
    const next = ruleOutAroundFound(state);
    for (let cell = 0; cell < size * size; cell++) {
      if (cell === found) {
        assert.equal(next.marks[cell], "found");
        continue;
      }
      const row = Math.floor(cell / size);
      const col = cell % size;
      const impossible =
        row === 3 ||
        col === winners[3] ||
        regions[cell] === regions[found] ||
        (Math.abs(row - 3) <= 1 && Math.abs(col - winners[3]) <= 1);
      assert.equal(
        next.marks[cell],
        impossible ? "invalid" : "blank",
        `cell ${cell}`,
      );
      // never rules out a winner
      if (winners[row] === col) assert.equal(next.marks[cell], "blank");
    }
  });

  it("leaves a board with no finds alone", () => {
    const state = startGame(generatePuzzle(6, seededRng(1)));
    assert.equal(ruleOutAroundFound(state), state);
  });
});

describe("isNiceMove", () => {
  const puzzle = generatePuzzle(10, seededRng(3), { difficulty: 8 });
  const { size, winners } = puzzle;
  const winner = (row: number) => row * size + winners[row];
  const fresh = startGame(puzzle);

  it("is never a wrong guess", () => {
    assert.ok(!isNiceMove(fresh, (winner(0) + 1) % size));
  });

  it("is a winner the board doesn't show yet", () => {
    const rows = winners.map((_, row) => row);
    assert.ok(rows.some((row) => isNiceMove(fresh, winner(row))));
  });

  it("isn't once the rest of the row is ruled out", () => {
    const marks = fresh.marks.map((m, cell) =>
      Math.floor(cell / size) === 4 && cell !== winner(4) ? "invalid" : m,
    );
    assert.ok(!isNiceMove({ ...fresh, marks }, winner(4)));
  });

  it("ignores winners ruled out by mistake", () => {
    // X-ing every winner but row 4's would make row 4's "obvious" if trusted
    const marks = fresh.marks.map((m, cell) =>
      isWinner(puzzle, cell) && cell !== winner(4) ? "invalid" : m,
    );
    assert.equal(
      isNiceMove({ ...fresh, marks }, winner(4)),
      isNiceMove(fresh, winner(4)),
    );
  });
});

describe("paletteFor", () => {
  it("has a distinct color for every board size up to MAX_BOARD_SIZE", () => {
    for (let n = MIN_SIZE; n <= MAX_BOARD_SIZE; n++) {
      const colors = paletteFor(n);
      assert.equal(colors.length, n);
      assert.equal(new Set(colors).size, n, `size ${n}`);
    }
  });
});

describe("cellsBetween", () => {
  it("walks the straight line between two cells, ends included", () => {
    // 5x5; from (1,1)
    assert.deepEqual(cellsBetween(5, 6, 9), [6, 7, 8, 9]); // along row 1
    assert.deepEqual(cellsBetween(5, 6, 21), [6, 11, 16, 21]); // down column 1
    assert.deepEqual(cellsBetween(5, 6, 18), [6, 12, 18]); // diagonal
    assert.deepEqual(cellsBetween(5, 6, 14), [6, 7, 13, 14]); // to (2,4)
    assert.deepEqual(cellsBetween(5, 9, 6), [9, 8, 7, 6]); // backwards
    assert.deepEqual(cellsBetween(5, 6, 6), [6]);
  });
});

describe("game transitions", () => {
  const fresh = (): GameState => newGame(6, 3, seededRng(42));
  const winnerCell = (g: GameState, row: number) =>
    row * g.puzzle.size + g.puzzle.winners[row];
  const loserCell = (g: GameState, row: number) =>
    row * g.puzzle.size + ((g.puzzle.winners[row] + 1) % g.puzzle.size);

  it("toggles blank <-> invalid", () => {
    let g = fresh();
    g = toggleMark(g, 0);
    assert.equal(g.marks[0], "invalid");
    g = toggleMark(g, 0);
    assert.equal(g.marks[0], "blank");
  });

  it("commits a winner as found and a non-winner as a mistake", () => {
    let g = fresh();
    g = commit(g, winnerCell(g, 0));
    assert.equal(g.marks[winnerCell(g, 0)], "found");
    assert.equal(g.mistakes, 0);
    g = commit(g, loserCell(g, 1));
    assert.equal(g.marks[loserCell(g, 1)], "wrong");
    assert.equal(g.mistakes, 1);
  });

  it("locks committed cells", () => {
    let g = fresh();
    const cell = winnerCell(g, 0);
    g = commit(g, cell);
    assert.equal(toggleMark(g, cell), g);
    assert.equal(commit(g, cell), g);
    assert.equal(paintInvalid(g, g.marks, [cell]).marks[cell], "found");
  });

  it("is won when every winner is found", () => {
    let g = fresh();
    for (let row = 0; row < 6; row++) {
      assert.equal(gameStatus(g), "playing");
      g = commit(g, winnerCell(g, row));
    }
    assert.equal(gameStatus(g), "won");
  });

  it("is lost after `lives` mistakes, and then ignores input", () => {
    let g = fresh();
    for (let row = 0; row < 3; row++) g = commit(g, loserCell(g, row));
    assert.equal(gameStatus(g), "lost");
    assert.equal(commit(g, winnerCell(g, 5)), g);
    assert.equal(toggleMark(g, 0), g);
  });

  it("restores earlier marks but keeps submissions", () => {
    const g = fresh();
    const before = g.marks;
    let next = toggleMark(g, 0);
    next = commit(next, winnerCell(next, 1));
    const undone = restoreMarks(next, before);
    assert.equal(undone.marks[0], "blank");
    assert.equal(undone.marks[winnerCell(next, 1)], "found");
  });

  it("paints from a base snapshot so a drag can shrink", () => {
    const g = fresh();
    const wide = paintInvalid(g, g.marks, [0, 1, 2]);
    assert.deepEqual(wide.marks.slice(0, 4), [
      "invalid",
      "invalid",
      "invalid",
      "blank",
    ]);
    const narrow = paintInvalid(wide, g.marks, [0, 1]);
    assert.deepEqual(narrow.marks.slice(0, 3), ["invalid", "invalid", "blank"]);
  });
});
