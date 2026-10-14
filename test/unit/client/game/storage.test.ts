import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { loadGame, saveGame } from "../../../../src/client/game/storage.ts";
import {
  generatePuzzle,
  startGame,
} from "../../../../src/client/game/huedoku.ts";
import { seededRng } from "../../helpers/seededRng.ts";

const KEY = "test-save";
const store = new Map<string, string>();
const g = globalThis as unknown as { window?: unknown };

beforeEach(() => {
  store.clear();
  g.window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    },
  };
});
afterEach(() => {
  delete g.window;
});

const game = startGame(generatePuzzle(6, seededRng(5)));
const saved = { game, history: [game.marks], score: 42, puzzleStart: 30 };
/** The raw save, tweaked by `edit`. */
function rawSave(edit: (raw: Record<string, any>) => void = () => {}) {
  saveGame(KEY, saved);
  const raw = JSON.parse(store.get(KEY)!);
  edit(raw);
  store.set(KEY, JSON.stringify(raw));
}

describe("loadGame", () => {
  it("round-trips a save", () => {
    rawSave();
    assert.deepEqual(loadGame(KEY), saved);
  });

  it("fills in fields older saves don't have", () => {
    rawSave((raw) => {
      delete raw.game.puzzle.grade;
      delete raw.score;
      delete raw.puzzleStart;
    });
    const loaded = loadGame(KEY)!;
    assert.equal(loaded.game.puzzle.grade, 0);
    assert.equal(loaded.score, 0);
    assert.equal(loaded.puzzleStart, 0, "starts from the score");
  });

  const rejects: [string, (raw: Record<string, any>) => void][] = [
    ["another version", (raw) => (raw.version = 2)],
    ["an unknown mark", (raw) => (raw.game.marks[0] = "maybe")],
    ["too few marks", (raw) => raw.game.marks.pop()],
    ["a winner off the board", (raw) => (raw.game.puzzle.winners[0] = 6)],
    ["a board too small", (raw) => (raw.game.puzzle.size = 4)],
    ["a fractional score", (raw) => (raw.score = 1.5)],
    ["a missing game", (raw) => delete raw.game],
  ];
  for (const [what, edit] of rejects) {
    it(`ignores a save with ${what}`, () => {
      rawSave(edit);
      assert.equal(loadGame(KEY), undefined);
    });
  }

  it("ignores junk and missing saves", () => {
    assert.equal(loadGame(KEY), undefined);
    store.set(KEY, "{not json");
    assert.equal(loadGame(KEY), undefined);
    store.set(KEY, "42");
    assert.equal(loadGame(KEY), undefined);
  });
});
