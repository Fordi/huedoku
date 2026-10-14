// grade puzzles by the deductions a person needs to solve them
/**
 * Solves a board the way a person would - only ever using the easiest
 * deduction that makes progress - and reports the hardest one it needed.
 * That's the puzzle's grade. Tiers, easiest first:
 *
 * 1. single      - a row, column, or region has one open cell left: place it
 *                  (which rules out its row, column, region, and neighbors).
 * 2. confinement - a region sitting within one row/column rules out the rest
 *                  of that line, and vice versa; or a cell is ruled out
 *                  because placing there would directly empty some unit.
 * 3. pair        - two regions confined to two lines (or two lines to two
 *                  regions, or rows to columns) rule out the rest of them.
 * 4. group       - the same, with three or four.
 * 5. what-if     - placing a winner at some cell and following tiers 1-3
 *                  leads to a contradiction, so it isn't there.
 * 6. stuck       - none of the above cracks it; only guessing would.
 */

export const TIERS = [
  "single",
  "confinement",
  "pair",
  "group",
  "what-if",
  "stuck",
] as const;
export type Tier = (typeof TIERS)[number];

export type Grade = {
  /** 1-6, per TIERS */
  tier: number;
  /** how many times each tier's deductions were used */
  uses: number[];
  /** the placements found, row by row (complete only when tier < 6) */
  winners: number[];
};

const ROW = 0;
const COL = 1;
const REGION = 2;
type Kind = typeof ROW | typeof COL | typeof REGION;

type Ctx = {
  size: number;
  regions: number[];
  /** regionMasks[region][row] = that region's columns in `row` */
  regionMasks: number[][];
  full: number;
};

type State = {
  /** open[row] = bitmask of columns still possible in that row */
  open: number[];
  done: boolean[][]; // done[kind][index]
  winners: number[];
};

type Result = "progress" | "none" | "contradiction";

function popcount(x: number): number {
  let n = 0;
  for (; x; n++) x &= x - 1;
  return n;
}

function clone(s: State): State {
  return {
    open: [...s.open],
    done: s.done.map((d) => [...d]),
    winners: [...s.winners],
  };
}

/** Columns of `row` that belong to unit (kind, index). */
function unitMask(ctx: Ctx, kind: Kind, index: number, row: number): number {
  if (kind === ROW) return row === index ? ctx.full : 0;
  if (kind === COL) return 1 << index;
  return ctx.regionMasks[index][row];
}

function openCount(ctx: Ctx, s: State, kind: Kind, index: number): number {
  let n = 0;
  for (let r = 0; r < ctx.size; r++) {
    n += popcount(s.open[r] & unitMask(ctx, kind, index, r));
  }
  return n;
}

function place(ctx: Ctx, s: State, row: number, col: number): void {
  const region = ctx.regions[row * ctx.size + col];
  const near = (7 << col) >> 1;
  for (let r = 0; r < ctx.size; r++) {
    let m = s.open[r] & ~ctx.regionMasks[region][r] & ~(1 << col);
    if (r === row) m = 0;
    else if (Math.abs(r - row) === 1) m &= ~near;
    s.open[r] = m;
  }
  s.done[ROW][row] = s.done[COL][col] = s.done[REGION][region] = true;
  s.winners[row] = col;
}

function hasEmptyUnit(ctx: Ctx, s: State): boolean {
  for (const kind of [ROW, COL, REGION] as Kind[]) {
    for (let i = 0; i < ctx.size; i++) {
      if (!s.done[kind][i] && openCount(ctx, s, kind, i) === 0) return true;
    }
  }
  return false;
}

/** Tier 1 */
function singles(ctx: Ctx, s: State): Result {
  for (const kind of [ROW, COL, REGION] as Kind[]) {
    for (let i = 0; i < ctx.size; i++) {
      if (s.done[kind][i]) continue;
      const n = openCount(ctx, s, kind, i);
      if (n === 0) return "contradiction";
      if (n > 1) continue;
      for (let r = 0; r < ctx.size; r++) {
        const m = s.open[r] & unitMask(ctx, kind, i, r);
        if (m) {
          place(ctx, s, r, 31 - Math.clz32(m));
          return "progress";
        }
      }
    }
  }
  return "none";
}

function* combinations(items: number[], n: number): Generator<number[]> {
  if (n === 0) {
    yield [];
    return;
  }
  for (let i = 0; i <= items.length - n; i++) {
    for (const rest of combinations(items.slice(i + 1), n - 1)) {
      yield [items[i], ...rest];
    }
  }
}

const KIND_PAIRS: [Kind, Kind][] = [
  [REGION, ROW],
  [REGION, COL],
  [ROW, REGION],
  [COL, REGION],
  [ROW, COL],
  [COL, ROW],
];

/**
 * Tiers 2-4: if the open cells of `n` units of one kind all fall within `n`
 * units of another kind, those other units' winners must be these, so
 * everything else in them is ruled out.
 */
function groups(ctx: Ctx, s: State, n: number): Result {
  const { size } = ctx;
  for (const [a, b] of KIND_PAIRS) {
    const live = Array.from({ length: size }, (_, i) => i).filter(
      (i) => !s.done[a][i],
    );
    if (live.length <= n) continue;
    for (const subset of combinations(live, n)) {
      // open cells of the subset, per row
      const within = s.open.map((open, r) =>
        subset.reduce((m, i) => m | (open & unitMask(ctx, a, i, r)), 0),
      );
      const touched: number[] = [];
      for (let j = 0; j < size; j++) {
        if (s.done[b][j]) continue;
        if (within.some((m, r) => m & unitMask(ctx, b, j, r))) touched.push(j);
      }
      if (touched.length < n) return "contradiction";
      if (touched.length > n) continue;
      let changed = false;
      for (let r = 0; r < size; r++) {
        const others = touched.reduce((m, j) => m | unitMask(ctx, b, j, r), 0);
        const next = s.open[r] & ~(others & ~within[r]);
        if (next !== s.open[r]) {
          s.open[r] = next;
          changed = true;
        }
      }
      if (changed) return "progress";
    }
  }
  return "none";
}

/** Tier 2, also: rule out a cell whose placement would directly empty a unit. */
function attacks(ctx: Ctx, s: State): Result {
  for (let r = 0; r < ctx.size; r++) {
    for (let m = s.open[r], c = 0; m; c++, m >>= 1) {
      if (!(m & 1)) continue;
      const trial = clone(s);
      place(ctx, trial, r, c);
      if (hasEmptyUnit(ctx, trial)) {
        s.open[r] &= ~(1 << c);
        return "progress";
      }
    }
  }
  return "none";
}

/** Tier 5: rule out a cell whose placement leads, by tiers 1-3, to a contradiction. */
function whatIfs(ctx: Ctx, s: State): Result {
  for (let r = 0; r < ctx.size; r++) {
    for (let m = s.open[r], c = 0; m; c++, m >>= 1) {
      if (!(m & 1)) continue;
      const trial = clone(s);
      place(ctx, trial, r, c);
      if (propagate(ctx, trial, 3) === "contradiction") {
        s.open[r] &= ~(1 << c);
        return "progress";
      }
    }
  }
  return "none";
}

const solved = (s: State) => s.done[ROW].every(Boolean);

/** Make one deduction with the easiest technique (up to `maxTier`) that works. */
function step(
  ctx: Ctx,
  s: State,
  maxTier: number,
): { result: Result; tier: number } {
  const techniques: [number, () => Result][] = [
    [1, () => singles(ctx, s)],
    [2, () => groups(ctx, s, 1)],
    [2, () => attacks(ctx, s)],
    [3, () => groups(ctx, s, 2)],
    [4, () => groups(ctx, s, 3)],
    [4, () => groups(ctx, s, 4)],
    [5, () => whatIfs(ctx, s)],
  ];
  for (const [tier, technique] of techniques) {
    if (tier > maxTier) break;
    const result = technique();
    if (result !== "none") return { result, tier };
  }
  return { result: "none", tier: 0 };
}

function propagate(ctx: Ctx, s: State, maxTier: number): Result {
  while (!solved(s)) {
    const { result } = step(ctx, s, maxTier);
    if (result !== "progress") return result;
  }
  return "progress";
}

function makeCtx(size: number, regions: number[]): Ctx {
  const regionMasks = Array.from({ length: size }, () =>
    new Array<number>(size).fill(0),
  );
  regions.forEach((region, cell) => {
    regionMasks[region][Math.floor(cell / size)] |= 1 << (cell % size);
  });
  return { size, regions, regionMasks, full: (1 << size) - 1 };
}

const blankState = (ctx: Ctx): State => ({
  open: new Array<number>(ctx.size).fill(ctx.full),
  done: [0, 1, 2].map(() => new Array<boolean>(ctx.size).fill(false)),
  winners: new Array<number>(ctx.size).fill(-1),
});

/**
 * What a player can see from the board at a glance: a few of the easiest
 * deductions. (A long enough chain of easy ones solves the easy levels from
 * a blank board, so the chain has to be short, too.)
 */
export const GLANCE = { maxTier: 2, maxSteps: 3 };

/**
 * Could the winner at `cell` be proven from what the player has on the board
 * - their finds (`found`) and the cells they've ruled out (`ruledOut`) -
 * within `maxSteps` deductions no harder than `maxTier`? Pass only correct rule-outs: a
 * winner ruled out by mistake makes the board contradict itself.
 */
export function isDeducible(
  size: number,
  regions: number[],
  { found, ruledOut }: { found: number[]; ruledOut: number[] },
  cell: number,
  { maxTier, maxSteps } = GLANCE,
): boolean {
  const ctx = makeCtx(size, regions);
  const s = blankState(ctx);
  for (const f of found) place(ctx, s, Math.floor(f / size), f % size);
  for (const r of ruledOut) s.open[Math.floor(r / size)] &= ~(1 << (r % size));
  const row = Math.floor(cell / size);
  for (let steps = 0; !s.done[ROW][row]; steps++) {
    if (steps === maxSteps) return false;
    if (step(ctx, s, maxTier).result !== "progress") return false;
  }
  return s.winners[row] === cell % size;
}

export function gradePuzzle(size: number, regions: number[]): Grade {
  const ctx = makeCtx(size, regions);
  const s = blankState(ctx);
  const uses = new Array<number>(TIERS.length).fill(0);
  let tier = 1;
  while (!solved(s)) {
    const { result, tier: used } = step(ctx, s, 5);
    if (result !== "progress") {
      // "none": out of deductions. ("contradiction" can't happen on a
      // board with a solution, but treat it the same way.)
      uses[5]++;
      return { tier: 6, uses, winners: s.winners };
    }
    uses[used - 1]++;
    tier = Math.max(tier, used);
  }
  return { tier, uses, winners: s.winners };
}
