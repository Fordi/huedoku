// huedoku game board
import { useEffect, useRef, useState } from "preact/hooks";
import { html } from "../util/html.ts";
import {
  LEVELS,
  MAX_DIFFICULTY,
  MAX_BOARD_SIZE,
  MIN_SIZE,
  commit,
  gameStatus,
  isWinner,
  cellsBetween,
  newGame,
  nextLevel,
  paintInvalid,
  isNiceMove,
  restoreMarks,
  ruleOutAroundFound,
  startGame,
  toggleMark,
  type GameState,
  type Level,
  type Mark,
  type Puzzle,
  type Rng,
} from "../game/huedoku.ts";
import {
  MAX_STARS,
  POINTS,
  isPerfect,
  markPoints,
  maxPoints,
  starsFor,
} from "../game/score.ts";
import { requestPuzzle } from "../game/puzzleWorker.ts";
import { loadGame, saveGame } from "../game/storage.ts";
import { buzz } from "../util/haptics.ts";

/** How long a puzzle built ahead of time may search for one that fits its level's grade band. */
const BACKGROUND_BUDGET_MS = 12000;

/**
 * Particles for the burst behind a perfect game's dialog: two rings, each
 * spread evenly around the circle with a little jitter. Made once, so
 * re-renders don't move them mid-flight.
 */
const BURST = Array.from({ length: 48 }, (_, i) => {
  const wave = i % 2;
  const angle = ((i + Math.random() * 0.8) / 48) * 2 * Math.PI;
  const distance = 28 + Math.random() * 22 + wave * 14; // vmin
  return {
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance,
    size: 6 + Math.random() * 8, // px
    delay: wave * 0.25 + Math.random() * 0.15, // s
  };
});

/** Two taps on the same cell closer together than this are a double-tap (submit). */
export const DOUBLE_TAP_MS = 350;

// Markers are drawn twice - a wide halo stroke under the mark itself - so
// they stay legible on every region color.
const CROSS = "M6 6L18 18M18 6L6 18";
const STAR =
  "M12 2.5l2.8 6.1 6.7.7-5 4.5 1.4 6.6L12 17l-5.9 3.4 1.4-6.6-5-4.5 6.7-.7z";
const icon = (d: string) => html`
  <svg class="hd-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path class="hd-icon-halo" d=${d} />
    <path class="hd-icon-mark" d=${d} />
  </svg>
`;
const MARK_ICONS: Record<Mark, string | undefined> = {
  blank: undefined,
  invalid: CROSS,
  found: STAR,
  wrong: CROSS,
};

type Drag = {
  pointerId: number;
  start: number;
  current: number;
  /** marks from before the gesture began */
  base: Mark[];
  /** every cell the pointer has passed over, in order */
  path: number[];
  moved: boolean;
  /** whether `base` has been pushed onto the undo history yet */
  pushed: boolean;
  /** the score from before the gesture began */
  scoreBase: number;
};

type Tap = {
  cell: number;
  time: number;
  before: Mark[];
  pushed: boolean;
  scoreBefore: number;
};

const changed = (a: Mark[], b: Mark[]) => a.some((m, i) => m !== b[i]);

function cellOf(target: EventTarget | null): number | undefined {
  const el = (target as HTMLElement | null)?.closest?.("[data-cell]");
  return el ? Number((el as HTMLElement).dataset.cell) : undefined;
}

/**
 * The game: a SIZE x SIZE grid of colored regions, each hiding one winning
 * cell. Tap a cell to mark it invalid (tap again to clear), drag to mark a
 * line of cells invalid, and double-tap to submit a cell as a winner.
 * Finding every winner wins; `lives` wrong submissions loses. Undo steps
 * back through marks, but never takes back a submission.
 *
 * Winning moves on to the next level (see `nextLevel`); losing offers the
 * same puzzle again. Progress is saved to localStorage under `storageKey`.
 */
export function Huedoku(props: {
  /** level to start at when nothing is saved */
  size?: number;
  difficulty?: number;
  lives?: number;
  /** random source for puzzle generation (tests pass a seeded one) */
  rng?: Rng;
  storageKey?: string;
  /** show developer controls (a board-size spinner); defaults to a `?dev` URL flag */
  dev?: boolean;
  /**
   * dev mode only: rule out the cells a right guess makes impossible, free
   * of charge; defaults to an `?auto` URL flag
   */
  auto?: boolean;
}) {
  const lives = props.lives ?? 3;
  const storageKey = props.storageKey ?? "huedoku";
  const [dev] = useState(
    () =>
      props.dev ??
      new URLSearchParams(globalThis.location?.search ?? "").has("dev"),
  );
  const [auto] = useState(
    () =>
      dev &&
      (props.auto ??
        new URLSearchParams(globalThis.location?.search ?? "").has("auto")),
  );
  /** With `?auto`, keep the cells found winners rule out marked. */
  const withAuto = (state: GameState) =>
    auto ? ruleOutAroundFound(state) : state;
  const [saved] = useState(
    () =>
      loadGame(storageKey) ?? {
        game: newGame(
          props.size ?? MIN_SIZE,
          lives,
          props.rng,
          props.difficulty ?? 1,
        ),
        history: [],
        score: 0,
        puzzleStart: 0,
      },
  );
  const [game, setGameState] = useState(saved.game);
  const [focus, setFocus] = useState(0);
  // Pointer handlers can fire several times before a re-render, so they read
  // (and write) the latest state through this ref rather than the closure.
  const gameRef = useRef(game);
  // marks before each undoable action, oldest first
  const [history, setHistoryState] = useState<Mark[][]>(saved.history);
  const historyRef = useRef(history);
  const [score, setScoreState] = useState(saved.score);
  const scoreRef = useRef(score);
  // the score when this puzzle began (restarts don't move it)
  const [puzzleStart, setPuzzleStart] = useState(saved.puzzleStart);
  // a puzzle being generated in the background, if any
  const [loading, setLoading] = useState(false);
  // how many "Nice move!"s this session, so each one replays the effect
  const [niceMoves, setNiceMoves] = useState(0);
  // asking "restart this puzzle?"
  const [confirmingRestart, setConfirmingRestart] = useState(false);
  const upcoming = useRef<{ level: Level; puzzle: Promise<Puzzle> } | null>(
    null,
  );
  const dialogButton = useRef<HTMLButtonElement>(null);
  const drag = useRef<Drag | null>(null);
  const lastTap = useRef<Tap | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const setGame = (next: GameState) => {
    gameRef.current = next;
    setGameState(next);
  };

  const setHistory = (next: Mark[][]) => {
    historyRef.current = next;
    setHistoryState(next);
  };
  const setScore = (next: number) => {
    scoreRef.current = next;
    setScoreState(next);
  };
  const addScore = (points: number) => setScore(scoreRef.current + points);

  const pushHistory = (marks: Mark[]) =>
    setHistory([...historyRef.current, marks]);

  const undo = () => {
    const h = historyRef.current;
    if (!h.length) return;
    lastTap.current = null;
    addScore(POINTS.undo);
    setHistory(h.slice(0, -1));
    // (undo can't take back a find, so its auto marks stay)
    setGame(withAuto(restoreMarks(gameRef.current, h[h.length - 1])));
  };

  /** Apply a marking action, recording it for undo if it changed anything. */
  const mark = (next: GameState) => {
    const current = gameRef.current;
    const didChange = changed(current.marks, next.marks);
    if (didChange) {
      addScore(markPoints(current.marks, next.marks));
      pushHistory(current.marks);
      buzz("toggle");
    }
    setGame(next);
    return didChange;
  };

  /** Submit `cell` as a winner (from `state`), and buzz with the verdict. */
  const submit = (state: GameState, cell: number) => {
    const next = commit(state, cell);
    if (next !== state) {
      addScore(markPoints(state.marks, next.marks));
      buzz(next.marks[cell] === "found" ? "right" : "wrong");
      // the last find always follows from the rest; save the fanfare for the win
      if (gameStatus(next) === "playing" && isNiceMove(state, cell)) {
        setNiceMoves((n) => n + 1);
      }
    }
    // scored before the auto marks, so they're free
    setGame(withAuto(next));
  };

  const play = (next: GameState) => {
    setConfirmingRestart(false);
    drag.current = null;
    lastTap.current = null;
    setFocus(0);
    setHistory([]);
    setGame(next);
  };

  /**
   * Generate (or pick up the already-started) puzzle for `level`, then play
   * it - setting the score to `startScore` first, if given.
   */
  const playLevel = async (level: Level, startScore?: number) => {
    const pending =
      upcoming.current &&
      upcoming.current.level.size === level.size &&
      upcoming.current.level.difficulty === level.difficulty
        ? upcoming.current.puzzle
        : requestPuzzle(level.size, level.difficulty, props.rng);
    if (pending === upcoming.current?.puzzle) upcoming.current = null;
    setLoading(true);
    try {
      const puzzle = await pending;
      if (startScore !== undefined) setScore(startScore);
      setPuzzleStart(scoreRef.current);
      play(startGame(puzzle, lives));
    } finally {
      setLoading(false);
    }
  };

  const status = gameStatus(game);
  const { puzzle, marks } = game;
  const restart = () => {
    addScore(POINTS.reset);
    play(startGame(puzzle, lives));
  };
  /** Abandon this puzzle for one at `level`: its points go back, plus a penalty. */
  const skipTo = (level: Level) => playLevel(level, puzzleStart + POINTS.skip);
  /** Back to the first board of level 1, with a fresh score. */
  const startOver = () => {
    setConfirmingRestart(false);
    return playLevel({ size: LEVELS[0].sizes[0], difficulty: 1 }, 0);
  };
  const { size, difficulty } = puzzle;
  const level = { size, difficulty };
  const next = nextLevel(level);

  useEffect(() => {
    saveGame(storageKey, { game, history, score, puzzleStart });
  }, [storageKey, game, history, score, puzzleStart]);

  // Start building the next level's puzzle as soon as this one starts, so
  // it's (almost always) ready the moment the player wins.
  useEffect(() => {
    const u = upcoming.current;
    if (
      !u ||
      u.level.size !== next.size ||
      u.level.difficulty !== next.difficulty
    ) {
      upcoming.current = {
        level: { size: next.size, difficulty: next.difficulty },
        // no one's waiting on this yet, so it can search longer for a good fit
        puzzle: requestPuzzle(
          next.size,
          next.difficulty,
          props.rng,
          BACKGROUND_BUDGET_MS,
        ),
      };
    }
  }, [next.size, next.difficulty, props.rng]);

  useEffect(() => {
    if (status !== "playing" || confirmingRestart) {
      dialogButton.current?.focus();
    }
  }, [status, confirmingRestart]);

  const onPointerDown = (e: PointerEvent) => {
    const cell = cellOf(e.target);
    if (cell === undefined || gameStatus(gameRef.current) !== "playing") return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const current = gameRef.current;
    const scoreBase = scoreRef.current;
    const now = Date.now();
    const tap = lastTap.current;
    lastTap.current = null;
    setFocus(cell);

    if (tap && tap.cell === cell && now - tap.time < DOUBLE_TAP_MS) {
      // The first tap of the pair toggled the mark; undo that (free), then submit.
      drag.current = null;
      if (tap.pushed) setHistory(historyRef.current.slice(0, -1));
      setScore(tap.scoreBefore);
      submit({ ...current, marks: tap.before }, cell);
      return;
    }

    const pushed = mark(toggleMark(current, cell));
    drag.current = {
      pointerId: e.pointerId,
      start: cell,
      current: cell,
      base: current.marks,
      path: [cell],
      moved: false,
      pushed,
      scoreBase,
    };
    // Keep receiving moves/ups even if the pointer leaves the grid.
    try {
      gridRef.current?.setPointerCapture?.(e.pointerId);
    } catch (_e) {
      // the pointer was already released; there's nothing left to capture
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    // With pointer capture, e.target is the grid; find the cell actually under the pointer.
    const cell =
      cellOf(document.elementFromPoint?.(e.clientX, e.clientY) ?? null) ??
      cellOf(e.target);
    if (cell === undefined || cell === d.current) return;
    d.path.push(...cellsBetween(size, d.current, cell).slice(1));
    d.current = cell;
    d.moved = true;
    const next = paintInvalid(gameRef.current, d.base, d.path);
    // The whole drag is one undo step, recorded from the marks it started with.
    if (!d.pushed && changed(d.base, next.marks)) {
      pushHistory(d.base);
      d.pushed = true;
    }
    // a tick each time the path takes in more cells
    if (changed(gameRef.current.marks, next.marks)) buzz("toggle");
    setScore(d.scoreBase + markPoints(d.base, next.marks));
    setGame(next);
  };

  const onPointerUp = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drag.current = null;
    if (!d.moved) {
      lastTap.current = {
        cell: d.start,
        time: Date.now(),
        before: d.base,
        pushed: d.pushed,
        scoreBefore: d.scoreBase,
      };
    }
  };

  const onPointerCancel = () => {
    drag.current = null;
  };

  // Belt and braces for browsers that still double-tap-zoom despite
  // touch-action (older iOS Safari): cancelling touchend stops the zoom. The
  // board is driven entirely by pointer events, so the click it would have
  // synthesized isn't needed.
  const onTouchEnd = (e: TouchEvent) => {
    if (e.cancelable) e.preventDefault();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      undo();
      return;
    }
    const row = Math.floor(focus / size);
    const col = focus % size;
    const moves: Record<string, number | undefined> = {
      ArrowUp: row > 0 ? focus - size : undefined,
      ArrowDown: row < size - 1 ? focus + size : undefined,
      ArrowLeft: col > 0 ? focus - 1 : undefined,
      ArrowRight: col < size - 1 ? focus + 1 : undefined,
    };
    if (e.key in moves) {
      e.preventDefault();
      const next = moves[e.key];
      if (next !== undefined) {
        setFocus(next);
        gridRef.current
          ?.querySelector<HTMLElement>(`[data-cell="${next}"]`)
          ?.focus();
      }
    } else if (e.key === " ") {
      e.preventDefault();
      mark(toggleMark(gameRef.current, focus));
    } else if (e.key === "Enter") {
      e.preventDefault();
      submit(gameRef.current, focus);
    }
  };

  const foundCount = marks.filter((m) => m === "found").length;
  const puzzlePoints = score - puzzleStart;
  const stars = starsFor(puzzlePoints, size, game.mistakes);
  const perfect = isPerfect(puzzlePoints, size);

  const cells = marks.map((mark, cell) => {
    const row = Math.floor(cell / size);
    const col = cell % size;
    const region = puzzle.regions[cell];
    const revealed =
      status === "lost" && mark !== "found" && isWinner(puzzle, cell);
    const classes = [
      "hd-cell",
      `hd-cell--${mark}`,
      revealed ? "hd-cell--revealed" : "",
    ];
    const iconPath = revealed ? STAR : MARK_ICONS[mark];
    return html`
      <div
        class=${classes.filter(Boolean).join(" ")}
        role="button"
        data-cell=${cell}
        tabindex=${cell === focus ? 0 : -1}
        aria-label=${`Row ${row + 1}, column ${col + 1}: ${revealed ? "winning cell" : mark}`}
        style=${`--cell-color: ${puzzle.colors[region]}`}
      >
        ${iconPath ? icon(iconPath) : null}
      </div>
    `;
  });

  const message = loading
    ? "Building a puzzle…"
    : "Tap to rule out · drag to rule out a path · double-tap to submit";

  return html`
    <section
      class=${`huedoku huedoku--${status}${loading ? " huedoku--loading" : ""}`}
    >
      <div class="hd-toolbar">
        ${
          dev
            ? html`
                <span class="hd-spinner" role="group" aria-label="Board size">
                  <button
                    type="button"
                    aria-label="Smaller board"
                    disabled=${loading || size <= MIN_SIZE}
                    onClick=${() => skipTo({ size: size - 1, difficulty })}
                  >
                    −
                  </button>
                  <span>${size}×${size}</span>
                  <button
                    type="button"
                    aria-label="Bigger board"
                    disabled=${loading || size >= MAX_BOARD_SIZE}
                    onClick=${() => skipTo({ size: size + 1, difficulty })}
                  >
                    +
                  </button>
                </span>
                <span class="hd-spinner" role="group" aria-label="Level">
                  <button
                    type="button"
                    aria-label="Easier level"
                    disabled=${loading || difficulty <= 1}
                    onClick=${() => skipTo({ size, difficulty: difficulty - 1 })}
                  >
                    −
                  </button>
                  <span class="hd-level" title=${`grade ${puzzle.grade}`}>
                    ${`Level ${difficulty}/${MAX_DIFFICULTY}`}
                  </span>
                  <button
                    type="button"
                    aria-label="Harder level"
                    disabled=${loading || difficulty >= MAX_DIFFICULTY}
                    onClick=${() => skipTo({ size, difficulty: difficulty + 1 })}
                  >
                    +
                  </button>
                </span>
              `
            : html`
                <span class="hd-level">
                  ${`${size}×${size} · Level ${difficulty}/${MAX_DIFFICULTY}`}
                </span>
              `
        }
        <button
          type="button"
          disabled=${loading}
          onClick=${() => skipTo(level)}
        >
          New puzzle
        </button>
        <span class="hd-score" aria-label="Score" title="Score">${score}</span>
        <span class="hd-found" aria-label="Found">${foundCount}/${size}</span>
        <span
          class="hd-lives"
          aria-label=${`${lives - game.mistakes} of ${lives} guesses left`}
        >
          ${"♥".repeat(Math.max(0, lives - game.mistakes))}${"♡".repeat(
            Math.min(lives, game.mistakes),
          )}
        </span>
      </div>
      <div class="hd-board">
        ${
          niceMoves > 0 &&
          html`
            <div
              key=${niceMoves}
              class="hd-shimmer"
              aria-hidden="true"
              style=${`--colors: ${puzzle.colors.join(", ")}, ${puzzle.colors[0]}`}
            ></div>
            <p key=${`t${niceMoves}`} class="hd-nice" role="status">
              Nice move!
            </p>
          `
        }
        <div
          ref=${gridRef}
          class="hd-grid"
          role="group"
          aria-label="Board"
          style=${`--size: ${size}`}
          onPointerDown=${onPointerDown}
          onPointerMove=${onPointerMove}
          onPointerUp=${onPointerUp}
          onPointerCancel=${onPointerCancel}
          onTouchEnd=${onTouchEnd}
          onKeyDown=${onKeyDown}
        >
          ${cells}
        </div>
      </div>
      <div class="hd-footer">
        <button
          type="button"
          class="hd-tool"
          onClick=${undo}
          disabled=${history.length === 0 || status !== "playing"}
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 14L4 9l5-5" />
            <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
          </svg>
        </button>
        <p class="hd-message" role="status">${message}</p>
        <button
          type="button"
          class="hd-tool"
          onClick=${() => setConfirmingRestart(true)}
          disabled=${loading || status !== "playing"}
          aria-label="Restart puzzle"
          title="Restart puzzle"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>
      ${
        status === "playing" &&
        confirmingRestart &&
        html`
          <div
            class="hd-backdrop hd-backdrop--now"
            onKeyDown=${(e: KeyboardEvent) => {
              if (e.key === "Escape") setConfirmingRestart(false);
            }}
          >
            <div
              class="hd-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="hd-dialog-title"
            >
              <h2 id="hd-dialog-title">Restart?</h2>
              <p>
                Clear this board and get your guesses back (${POINTS.reset}
                points), or start over from level 1 with a fresh score.
              </p>
              <div class="hd-dialog-actions">
                <button type="button" onClick=${restart}>This puzzle</button>
                <button type="button" onClick=${startOver}>From level 1</button>
                <button
                  type="button"
                  class="hd-secondary"
                  ref=${dialogButton}
                  onClick=${() => setConfirmingRestart(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        `
      }
      ${
        status !== "playing" &&
        html`
          <div class="hd-backdrop">
            ${
              status === "won" &&
              perfect &&
              html`
                <div class="hd-burst" aria-hidden="true">
                  ${BURST.map(
                    (p, i) => html`
                      <span
                        style=${`--dx: ${p.dx}vmin; --dy: ${p.dy}vmin; --size: ${p.size}px; --delay: ${p.delay}s; --color: ${puzzle.colors[i % size]}`}
                      ></span>
                    `,
                  )}
                </div>
              `
            }
            <div
              class="hd-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="hd-dialog-title"
            >
              ${
                status === "won"
                  ? html`
                      <h2 id="hd-dialog-title">
                        ${perfect ? "Perfect!" : "Solved!"}
                      </h2>
                      <p
                        class="hd-stars"
                        aria-label=${`${stars} of ${MAX_STARS} stars`}
                      >
                        ${Array.from(
                          { length: MAX_STARS },
                          (_, i) =>
                            html`<span
                              class=${i < stars ? "hd-star" : "hd-star hd-star--empty"}
                              style=${`--i: ${i}`}
                              >${i < stars ? "★" : "☆"}</span
                            >`,
                        )}
                      </p>
                      <p>
                        ${`You scored ${puzzlePoints} out of a possible ${maxPoints(size)}.`}
                      </p>
                      <p>
                        ${
                          next.difficulty > difficulty
                            ? `Level up! Level ${next.difficulty} starts at ${next.size}×${next.size}.`
                            : next.size > size
                              ? `Up next: ${next.size}×${next.size}.`
                              : `Top level cleared! Back to ${next.size}×${next.size}.`
                        }
                      </p>
                      <button
                        type="button"
                        ref=${dialogButton}
                        disabled=${loading}
                        onClick=${() => playLevel(next)}
                      >
                        ${loading ? "Building…" : "Next Level"}
                      </button>
                    `
                  : html`
                      <h2 id="hd-dialog-title">Out of guesses</h2>
                      <p>Have another go at the same puzzle.</p>
                      <button
                        type="button"
                        ref=${dialogButton}
                        onClick=${restart}
                      >
                        Try Again
                      </button>
                    `
              }
            </div>
          </div>
        `
      }
    </section>
  `;
}
