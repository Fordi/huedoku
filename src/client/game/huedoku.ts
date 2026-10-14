// huedoku puzzle generation, solving, and game-state transitions
import { gradePuzzle, isDeducible } from "./grade.ts";
/**
 * A huedoku board is a SIZE x SIZE grid partitioned into SIZE colored
 * regions. Each region grows out of one winning cell, and the winning cells
 * are placed so that no two share a row, share a column, or touch (including
 * diagonally). The player's job is to find every winning cell.
 *
 * Cells are addressed by a flat index: `row * size + col`.
 */

export type Rng = () => number;

export type Puzzle = {
  size: number;
  /** winners[row] = column of that row's winning cell; region `row` grows from it. */
  winners: number[];
  /** region index (0..size-1) for every cell */
  regions: number[];
  /** colors[region] */
  colors: string[];
  difficulty: number;
  /** the hardest deduction tier needed to solve it (see grade.ts) */
  grade: number;
};

export const MARKS = ["blank", "invalid", "found", "wrong"] as const;
export type Mark = (typeof MARKS)[number];

export type GameState = {
  puzzle: Puzzle;
  marks: Mark[];
  mistakes: number;
  lives: number;
};

export type GameStatus = "playing" | "won" | "lost";

export const MIN_SIZE = 5;
// The levels stop here: bigger boards take too long to make uniquely
// solvable (16x16 can take a minute), and the cells get small on a phone.
export const MAX_SIZE = 14;
// The most the solvers can handle at all (each row is a bitmask in a 32-bit
// int). Only the dev size spinner goes past MAX_SIZE.
export const MAX_BOARD_SIZE = 30;

// Visually distinct colors (after Sasha Trubetskoy's "20 distinct colors"),
// most distinct first: a board of size N uses the first N, so small boards
// get the easiest-to-tell-apart set. Lime is left out - too close to yellow.
export const PALETTE = [
  "#e6194b", // red
  "#4363d8", // blue
  "#ffe119", // yellow
  "#3cb44b", // green
  "#f58231", // orange
  "#911eb4", // purple
  "#42d4f4", // cyan
  "#f032e6", // magenta
  "#fabed4", // pink
  "#469990", // teal
  "#9a6324", // brown
  "#dcbeff", // lavender
  "#f2f2f2", // white
  "#800000", // maroon
  "#aaffc3", // mint
  "#808000", // olive
  "#000075", // navy
  "#ffd8b1", // apricot
  "#a9a9a9", // grey
  "#fffac8", // beige
  "#000000", // black
] as const;

/**
 * `count` colors: PALETTE's, then - past its end, only for dev-sized boards -
 * hues spread around the wheel, alternating light and dark.
 */
export function paletteFor(count: number): string[] {
  const extra = Math.max(0, count - PALETTE.length);
  return [
    ...PALETTE.slice(0, count),
    ...range(extra).map(
      (i) => `hsl(${Math.round((i * 360) / extra)} 70% ${i % 2 ? 35 : 65}%)`,
    ),
  ];
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

export function neighbors4(size: number, cell: number): number[] {
  const row = Math.floor(cell / size);
  const col = cell % size;
  const out: number[] = [];
  if (row > 0) out.push(cell - size);
  if (row < size - 1) out.push(cell + size);
  if (col > 0) out.push(cell - 1);
  if (col < size - 1) out.push(cell + 1);
  return out;
}

/** One column per row, all distinct, adjacent rows' columns at least 2 apart. */
export function placeWinners(size: number, rng: Rng = Math.random): number[] {
  const winners: number[] = [];
  const used = new Set<number>();
  const place = (row: number): boolean => {
    if (row === size) return true;
    for (const col of shuffle(range(size), rng)) {
      if (used.has(col)) continue;
      if (row > 0 && Math.abs(winners[row - 1] - col) <= 1) continue;
      winners.push(col);
      used.add(col);
      if (place(row + 1)) return true;
      winners.pop();
      used.delete(col);
    }
    return false;
  };
  if (!place(0)) throw new Error(`no valid placement for size ${size}`);
  return winners;
}

/**
 * How regions grow.
 *
 * `skew`: each region gets a random growth rate `rng() ** skew`, so high skew
 * makes wildly mismatched region sizes (tiny regions give their winner away
 * early - easy), and 0 makes all rates equal.
 *
 * `snake`: a frontier cell touching `k` cells of the region is picked with
 * weight `k ** (1 - snake)`. At 0 regions fill in as compact blobs; higher
 * values favor cells that stick out, growing long arms that cross many rows
 * and columns, which hand out fewer "confined to one line" deductions.
 */
export type Shape = { skew: number; snake: number };

/** Grow each winner's region outward, one cell at a time, until the grid is full. */
export function growRegions(
  size: number,
  winners: number[],
  rng: Rng = Math.random,
  { skew, snake }: Shape = { skew: 4, snake: 0 },
): number[] {
  const regions = new Array<number>(size * size).fill(-1);
  // Keep every region growing at least a little, or it could be starved at
  // one cell on every board.
  const rates = winners.map(() => Math.max(0.02, rng() ** skew));
  const frontiers = winners.map((col, region) => {
    const cell = region * size + col;
    regions[cell] = region;
    return new Set(neighbors4(size, cell));
  });
  const touching = (cell: number, region: number) =>
    neighbors4(size, cell).filter((n) => regions[n] === region).length;
  const pickFrom = <T>(items: T[], weight: (item: T) => number): T => {
    const weights = items.map(weight);
    let pick = rng() * weights.reduce((a, b) => a + b, 0);
    const i = weights.findIndex((w) => (pick -= w) < 0);
    return items[i === -1 ? weights.findLastIndex((w) => w > 0) : i];
  };
  for (let left = size * size - size; left > 0; left--) {
    for (const frontier of frontiers) {
      // drop cells another region claimed since they were queued
      for (const cell of frontier)
        if (regions[cell] !== -1) frontier.delete(cell);
    }
    const region = pickFrom(
      winners.map((_, r) => r),
      (r) => (frontiers[r].size ? rates[r] : 0),
    );
    const cell = pickFrom(
      [...frontiers[region]],
      (c) => touching(c, region) ** (1 - snake),
    );
    regions[cell] = region;
    for (const n of neighbors4(size, cell)) {
      if (regions[n] === -1) frontiers[region].add(n);
    }
  }
  return regions;
}

function popcount(x: number): number {
  let n = 0;
  for (; x; n++) x &= x - 1;
  return n;
}

/**
 * Find placements satisfying every rule, stopping once `limit` are found.
 * Each solution is in the same shape as `Puzzle.winners`.
 *
 * Open cells are tracked as one column bitmask per row. The search always
 * branches on whichever row, column, or region has the fewest open cells
 * left, so dead ends (a unit with no open cells) surface early.
 */
export function findSolutions(
  size: number,
  regions: number[],
  limit = 2,
): number[][] {
  // regionMasks[region][row] = columns of `row` that belong to `region`
  const regionMasks = range(size).map(() => new Array<number>(size).fill(0));
  regions.forEach((region, cell) => {
    regionMasks[region][Math.floor(cell / size)] |= 1 << (cell % size);
  });
  // open[depth][row]: open columns after `depth` placements
  const open = range(size + 1).map(() => new Array<number>(size).fill(0));
  open[0].fill((1 << size) - 1);
  const rowDone = new Array<boolean>(size).fill(false);
  const colDone = new Array<boolean>(size).fill(false);
  const regionDone = new Array<boolean>(size).fill(false);
  const winners = new Array<number>(size).fill(-1);
  const found: number[][] = [];

  const place = (depth: number, row: number, col: number) => {
    const region = regions[row * size + col];
    const cur = open[depth];
    const next = open[depth + 1];
    const near = (7 << col) >> 1; // col-1..col+1
    for (let r = 0; r < size; r++) {
      let m = cur[r] & ~regionMasks[region][r] & ~(1 << col);
      if (r === row) m = 0;
      else if (Math.abs(r - row) === 1) m &= ~near;
      next[r] = m;
    }
    rowDone[row] = colDone[col] = regionDone[region] = true;
    winners[row] = col;
    solve(depth + 1);
    rowDone[row] = colDone[col] = regionDone[region] = false;
  };

  const solve = (depth: number) => {
    if (depth === size) {
      found.push([...winners]);
      return;
    }
    const cur = open[depth];
    // most-constrained unit: kind 0 = row, 1 = column, 2 = region
    let bestKind = -1;
    let bestIndex = -1;
    let bestCount = Infinity;
    for (let i = 0; i < size; i++) {
      if (!rowDone[i]) {
        const n = popcount(cur[i]);
        if (n < bestCount) [bestKind, bestIndex, bestCount] = [0, i, n];
      }
      if (!colDone[i]) {
        let n = 0;
        for (let r = 0; r < size; r++) n += (cur[r] >> i) & 1;
        if (n < bestCount) [bestKind, bestIndex, bestCount] = [1, i, n];
      }
      if (!regionDone[i]) {
        let n = 0;
        for (let r = 0; r < size; r++)
          n += popcount(cur[r] & regionMasks[i][r]);
        if (n < bestCount) [bestKind, bestIndex, bestCount] = [2, i, n];
      }
      if (bestCount === 0) return;
    }
    for (let r = 0; r < size; r++) {
      if (bestKind === 0 && r !== bestIndex) continue;
      let m = cur[r];
      if (bestKind === 1) m &= 1 << bestIndex;
      if (bestKind === 2) m &= regionMasks[bestIndex][r];
      for (let c = 0; m; c++, m >>= 1) {
        if (!(m & 1)) continue;
        place(depth, r, c);
        if (found.length >= limit) return;
      }
    }
  };
  solve(0);
  return found;
}

export function countSolutions(size: number, regions: number[], limit = 2) {
  return findSolutions(size, regions, limit).length;
}

/** Would `region` stay in one piece if `without` were taken out of it? */
function staysContiguous(
  size: number,
  regions: number[],
  region: number,
  without: number,
): boolean {
  const cells = regions.flatMap((r, cell) =>
    r === region && cell !== without ? [cell] : [],
  );
  if (cells.length === 0) return false;
  const seen = new Set([cells[0]]);
  const queue = [cells[0]];
  while (queue.length) {
    for (const n of neighbors4(size, queue.pop()!)) {
      if (n !== without && regions[n] === region && !seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
  return seen.size === cells.length;
}

const ALT_POOL = 8;

/**
 * Nudge region borders until `winners` is the only solution: find some other
 * solution, and hand one of its cells to a neighboring region, which breaks
 * that solution (it now uses the neighbor's region twice). Returns whether
 * the board ended up unique.
 */
function makeUnique(
  size: number,
  winners: number[],
  regions: number[],
  rng: Rng,
  maxSteps: number,
): boolean {
  for (let step = 0; step < maxSteps; step++) {
    // Gather cells from several rival solutions: moving any one of them
    // breaks at least one rival, and a wider pool means it's rare for none
    // of them to sit on a region border where it can move.
    const rivals = findSolutions(size, regions, ALT_POOL + 1).filter((sol) =>
      sol.some((col, row) => col !== winners[row]),
    );
    if (!rivals.length) return true;
    const candidates = shuffle(
      [
        ...new Set(
          rivals.flatMap((sol) =>
            sol.flatMap((col, row) =>
              col === winners[row] ? [] : [row * size + col],
            ),
          ),
        ),
      ],
      rng,
    );
    let changed = false;
    for (const cell of candidates) {
      const region = regions[cell];
      const others = shuffle(
        neighbors4(size, cell)
          .map((n) => regions[n])
          .filter((r) => r !== region),
        rng,
      );
      if (others.length && staysContiguous(size, regions, region, cell)) {
        regions[cell] = others[0];
        changed = true;
        break;
      }
    }
    if (!changed) return false;
  }
  return countSolutions(size, regions) === 1;
}

/**
 * Build a board with exactly one solution (so it can be solved by deduction
 * rather than guessing). If no unique board turns up within `attempts`, the
 * last candidate is returned with `unique: false`; its winners are still a
 * valid answer, just not the only one.
 */
export function generateBoard(
  size: number,
  rng: Rng,
  shape: Shape,
  attempts = 500,
  /** give up (returning `unique: false`) once `performance.now()` passes this */
  deadline = Infinity,
): { winners: number[]; regions: number[]; unique: boolean } {
  let winners: number[] = [];
  let regions: number[] = [];
  for (let i = 0; i < attempts; i++) {
    if (i > 0 && performance.now() > deadline) break;
    winners = placeWinners(size, rng);
    regions = growRegions(size, winners, rng, shape);
    if (makeUnique(size, winners, regions, rng, 2 * size * size)) {
      return { winners, regions, unique: true };
    }
  }
  return { winners, regions, unique: false };
}

/**
 * Difficulty levels. Each runs through a range of board sizes, growing
 * regions with `shape`, and wants puzzles whose grade (the hardest deduction
 * needed - see grade.ts) falls within `grades`. Early on, lopsided region
 * sizes keep things easy; later, the grade band does the work.
 */
export const LEVELS: {
  sizes: [min: number, max: number];
  shape: Shape;
  grades: [min: number, max: number];
}[] = [
  { sizes: [5, 10], shape: { skew: 4, snake: 0 }, grades: [1, 2] },
  { sizes: [5, 11], shape: { skew: 3, snake: 0 }, grades: [2, 2] },
  { sizes: [6, 12], shape: { skew: 2, snake: 0 }, grades: [2, 3] },
  { sizes: [6, 12], shape: { skew: 1.5, snake: 0 }, grades: [3, 3] },
  { sizes: [7, 13], shape: { skew: 1, snake: 0 }, grades: [3, 4] },
  { sizes: [7, 13], shape: { skew: 1, snake: 0 }, grades: [4, 5] },
  { sizes: [8, 14], shape: { skew: 1, snake: 0 }, grades: [4, 5] },
  { sizes: [8, 14], shape: { skew: 1, snake: 0 }, grades: [5, 5] },
];
export const MAX_DIFFICULTY = LEVELS.length;

const levelFor = (difficulty: number) =>
  LEVELS[Math.min(MAX_DIFFICULTY, Math.max(1, Math.round(difficulty))) - 1];

/**
 * How far `grade` falls outside `[min, max]`. Too easy counts for more than
 * too hard, so a near miss errs on the hard side; needing to guess is worst.
 */
function gradeMiss(grade: number, [min, max]: [number, number]): number {
  if (grade >= 6) return 100;
  return grade < min ? (min - grade) * 1.5 : grade > max ? grade - max : 0;
}

/**
 * Generate a puzzle for `difficulty`: build uniquely solvable boards until
 * one grades within the level's band, or the budget (`candidates` boards or
 * `budgetMs`, whichever runs out first) is spent - then take the closest.
 */
export function generatePuzzle(
  size: number,
  rng: Rng = Math.random,
  {
    difficulty = 1,
    candidates = 200,
    budgetMs = 2500,
  }: { difficulty?: number; candidates?: number; budgetMs?: number } = {},
): Puzzle {
  if (!Number.isInteger(size) || size < MIN_SIZE || size > MAX_BOARD_SIZE) {
    throw new RangeError(
      `size must be an integer ${MIN_SIZE}-${MAX_BOARD_SIZE}`,
    );
  }
  const { shape, grades } = levelFor(difficulty);
  const deadline = performance.now() + budgetMs;
  let best: { winners: number[]; regions: number[]; grade: number } | undefined;
  let bestMiss = Infinity;
  for (let i = 0; i < candidates; i++) {
    // The first board always runs to completion; later ones give up at the deadline.
    const board = generateBoard(size, rng, shape, 500, i ? deadline : Infinity);
    const { tier } = gradePuzzle(size, board.regions);
    // a board that isn't unique only ever stands in when nothing else turned up
    const miss = gradeMiss(tier, grades) + (board.unique ? 0 : 1000);
    if (miss < bestMiss) {
      best = { winners: board.winners, regions: board.regions, grade: tier };
      bestMiss = miss;
    }
    if (bestMiss === 0 || performance.now() > deadline) break;
  }
  const colors = shuffle(paletteFor(size), rng);
  return { size, ...best!, colors, difficulty };
}

export function isWinner(puzzle: Puzzle, cell: number): boolean {
  return puzzle.winners[Math.floor(cell / puzzle.size)] === cell % puzzle.size;
}

/** A fresh attempt at `puzzle`. */
export function startGame(puzzle: Puzzle, lives = 3): GameState {
  return {
    puzzle,
    marks: new Array<Mark>(puzzle.size * puzzle.size).fill("blank"),
    mistakes: 0,
    lives,
  };
}

export function newGame(
  size: number,
  lives = 3,
  rng: Rng = Math.random,
  difficulty = 1,
): GameState {
  return startGame(generatePuzzle(size, rng, { difficulty }), lives);
}

export type Level = { size: number; difficulty: number };

/**
 * The level after `level` is won: one size up, or - after the largest board
 * of this difficulty - the smallest board of the next one. The top
 * difficulty repeats.
 */
export function nextLevel({ size, difficulty }: Level): Level {
  const [, max] = levelFor(difficulty).sizes;
  if (size < max) return { size: size + 1, difficulty };
  const next = Math.min(MAX_DIFFICULTY, difficulty + 1);
  return { size: levelFor(next).sizes[0], difficulty: next };
}

export function gameStatus(state: GameState): GameStatus {
  if (state.mistakes >= state.lives) return "lost";
  const found = state.marks.filter((m) => m === "found").length;
  return found === state.puzzle.size ? "won" : "playing";
}

/** Committed cells ("found"/"wrong") can't be changed by marking. */
export const isLocked = (mark: Mark) => mark === "found" || mark === "wrong";

/** blank <-> invalid */
export function toggleMark(state: GameState, cell: number): GameState {
  const mark = state.marks[cell];
  if (gameStatus(state) !== "playing" || isLocked(mark)) return state;
  const marks = [...state.marks];
  marks[cell] = mark === "invalid" ? "blank" : "invalid";
  return { ...state, marks };
}

/** Mark every cell in `cells` invalid, starting from `base` marks (so a drag can be re-painted as it moves). */
export function paintInvalid(
  state: GameState,
  base: Mark[],
  cells: number[],
): GameState {
  if (gameStatus(state) !== "playing") return state;
  const marks = [...base];
  for (const cell of cells) {
    if (!isLocked(marks[cell])) marks[cell] = "invalid";
  }
  return { ...state, marks };
}

/**
 * Rule out every blank cell that a found winner makes impossible: the rest
 * of its row, column, and region, and its neighbors.
 */
export function ruleOutAroundFound(state: GameState): GameState {
  const { size, regions } = state.puzzle;
  const found = state.marks.flatMap((m, cell) => (m === "found" ? [cell] : []));
  if (!found.length) return state;
  const marks = state.marks.map((mark, cell) => {
    if (mark !== "blank") return mark;
    const row = Math.floor(cell / size);
    const col = cell % size;
    const excluded = found.some((f) => {
      const fr = Math.floor(f / size);
      const fc = f % size;
      return (
        fr === row ||
        fc === col ||
        regions[f] === regions[cell] ||
        (Math.abs(fr - row) <= 1 && Math.abs(fc - col) <= 1)
      );
    });
    return excluded ? "invalid" : mark;
  });
  return { ...state, marks };
}

/**
 * Was submitting `cell` (a winner) a leap - something the board as marked
 * doesn't yet show by easy deductions? Wrong rule-outs are ignored.
 */
export function isNiceMove(state: GameState, cell: number): boolean {
  const { puzzle, marks } = state;
  if (!isWinner(puzzle, cell)) return false;
  const found: number[] = [];
  const ruledOut: number[] = [];
  marks.forEach((mark, i) => {
    if (mark === "found") found.push(i);
    else if (mark !== "blank" && !isWinner(puzzle, i)) ruledOut.push(i);
  });
  return !isDeducible(puzzle.size, puzzle.regions, { found, ruledOut }, cell);
}

/** Bring back earlier marks (undo), leaving submitted cells as they are. */
export function restoreMarks(state: GameState, previous: Mark[]): GameState {
  if (gameStatus(state) !== "playing") return state;
  const marks = state.marks.map((mark, cell) =>
    isLocked(mark) ? mark : previous[cell],
  );
  return { ...state, marks };
}

/** Submit a cell as a winning cell. */
export function commit(state: GameState, cell: number): GameState {
  if (gameStatus(state) !== "playing" || isLocked(state.marks[cell])) {
    return state;
  }
  const marks = [...state.marks];
  if (isWinner(state.puzzle, cell)) {
    marks[cell] = "found";
    return { ...state, marks };
  }
  marks[cell] = "wrong";
  return { ...state, marks, mistakes: state.mistakes + 1 };
}

/**
 * Cells on the straight line from `from` to `to`, both included (Bresenham).
 * A drag joins each pointer position to the last with this, so a fast swipe
 * that skips over cells between events still takes them in.
 */
export function cellsBetween(size: number, from: number, to: number): number[] {
  let r = Math.floor(from / size);
  let c = from % size;
  const r1 = Math.floor(to / size);
  const c1 = to % size;
  const dr = Math.abs(r1 - r);
  const dc = Math.abs(c1 - c);
  const sr = r1 >= r ? 1 : -1;
  const sc = c1 >= c ? 1 : -1;
  const cells = [r * size + c];
  for (let err = dc - dr; r !== r1 || c !== c1;) {
    const e2 = 2 * err;
    if (e2 > -dr) {
      err -= dr;
      c += sc;
    }
    if (e2 < dc) {
      err += dc;
      r += sr;
    }
    cells.push(r * size + c);
  }
  return cells;
}
