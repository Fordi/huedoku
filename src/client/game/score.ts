// points for each thing the player does
import type { Mark } from "./huedoku.ts";

export const POINTS = {
  /** each cell ruled out */
  invalid: -1,
  /** each winner found */
  found: 20,
  /** each wrong guess */
  wrong: -25,
  /** restarting a puzzle (Restart, or Try Again after losing) */
  reset: -100,
  /** each undo */
  undo: -1,
  /**
   * abandoning a puzzle for a new one (New puzzle), on top of giving back
   * whatever it had scored - so farming the easy finds doesn't pay
   */
  skip: -5,
} as const;

/**
 * Points for going from `before` to `after` marks: every cell newly ruled
 * out, found, or guessed wrong. Clearing a mark is free.
 */
export function markPoints(before: Mark[], after: Mark[]): number {
  let points = 0;
  after.forEach((mark, cell) => {
    if (mark === before[cell] || mark === "blank") return;
    points += POINTS[mark];
  });
  return points;
}

/** The best score a board can earn: every winner found, nothing else marked. */
export const maxPoints = (size: number) => size * POINTS.found;

export const MAX_STARS = 3;

/**
 * The least each star needs on a `size` board. With N = size, every winner
 * found (20N) and the N² - N other cells to rule out, W the wrong-guess cost:
 *
 * 1. 20N - (N² - N) - 2W: everything ruled out and two wrong guesses - you
 *    only just made it. Less than this means backtracking (undos, restarts).
 * 2. 20N - (N² - N) - W:  everything ruled out and one wrong guess.
 * 3. 20N - ¾(N² - N):     at most ¾ ruled out (and no wrong guesses,
 *                          which `starsFor` checks separately).
 */
export function starThresholds(size: number): [number, number, number] {
  const best = maxPoints(size);
  const others = size * size - size;
  const wrong = -POINTS.wrong;
  return [
    best - others * -POINTS.invalid - 2 * wrong,
    best - others * -POINTS.invalid - wrong,
    best - 0.75 * others * -POINTS.invalid,
  ];
}

/** 0-3 stars for scoring `points` on a `size` board with `mistakes` wrong guesses. */
export function starsFor(
  points: number,
  size: number,
  mistakes: number,
): number {
  const [one, two, three] = starThresholds(size);
  if (points >= three && mistakes === 0) return 3;
  if (points >= two) return 2;
  if (points >= one) return 1;
  return 0;
}

/** Every winner found, nothing else marked, no wrong guesses. */
export const isPerfect = (points: number, size: number) =>
  points === maxPoints(size);
