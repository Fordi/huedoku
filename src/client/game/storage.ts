// save and restore the game in localStorage
import { array, integer, string, struct } from "@fordi-org/valid";
import {
  MARKS,
  MAX_DIFFICULTY,
  MAX_BOARD_SIZE,
  MIN_SIZE,
  type GameState,
  type Mark,
} from "./huedoku.ts";

export type Saved = {
  game: GameState;
  history: Mark[][];
  /** the running total across puzzles */
  score: number;
  /** what `score` was when this puzzle began */
  puzzleStart: number;
};

const VERSION = 1;

const int = integer.require();
const isMark = (m: string): m is Mark =>
  (MARKS as readonly string[]).includes(m);
const mark = string.require().parse((m, mustBe) => {
  if (!isMark(m)) throw mustBe("a mark");
  return m;
});
/** Fill in a field that older saves don't have. */
const withDefault = (value: number) => integer.parse((n) => n ?? value);

// throws on anything that isn't a save this version can load
const savedSchema = struct({
  version: int.is(`version ${VERSION}`, (v) => v === VERSION),
  game: struct({
    puzzle: struct({
      size: int.inRange(MIN_SIZE, MAX_BOARD_SIZE),
      winners: array(int).require(),
      regions: array(int).require(),
      colors: array(string.require()).require(),
      difficulty: int.inRange(1, MAX_DIFFICULTY),
      // saves from before grading existed have none; 0 = unknown
      grade: withDefault(0).inRange(0, 6),
    }).require(),
    marks: array(mark).require(),
    mistakes: int.atLeast(0),
    lives: int.atLeast(1),
  }).require(),
  history: array(array(mark).require()).require(),
  // saves from before scoring existed start from nothing
  score: withDefault(0),
  puzzleStart: integer,
})
  .require()
  .is("a consistent save", ({ game: { puzzle, marks }, history }) => {
    const { size } = puzzle;
    const cells = size * size;
    const inRange = (n: number) => n >= 0 && n < size;
    return (
      puzzle.winners.length === size &&
      puzzle.winners.every(inRange) &&
      puzzle.regions.length === cells &&
      puzzle.regions.every(inRange) &&
      puzzle.colors.length === size &&
      marks.length === cells &&
      history.every((h) => h.length === cells)
    );
  });

/** Storage can be missing or throw (private mode, blocked site data) - treat that as "nothing saved". */
function storage(): Storage | undefined {
  try {
    return globalThis.window?.localStorage;
  } catch (_e) {
    return undefined;
  }
}

export function loadGame(key: string): Saved | undefined {
  try {
    const raw = storage()?.getItem(key);
    if (!raw) return undefined;
    const { game, history, score, puzzleStart } = savedSchema(JSON.parse(raw));
    return { game, history, score, puzzleStart: puzzleStart ?? score };
  } catch (_e) {
    return undefined;
  }
}

export function saveGame(key: string, saved: Saved): void {
  try {
    storage()?.setItem(key, JSON.stringify({ version: VERSION, ...saved }));
  } catch (_e) {
    // full or unavailable storage just means the game won't survive a reload
  }
}
