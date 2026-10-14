import { installDomGlobals } from "../../helpers/domTestSetup.ts";
installDomGlobals();

// DOM-sensitive imports are deferred until after installDomGlobals() - see Widget.test.ts.
const { describe, it, afterEach, beforeEach } = await import("node:test");
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- typeof import() needed here since the DOM-timing workaround requires a dynamic import, not a static one
const assert: typeof import("node:assert/strict") = (
  await import("node:assert/strict")
).default;
const { render, cleanup, screen, fireEvent, waitFor } =
  await import("@testing-library/preact");
const { html } = await import("../../../../src/client/util/html.ts");
const { Huedoku, DOUBLE_TAP_MS } =
  await import("../../../../src/client/components/Huedoku.ts");
const { generatePuzzle, isNiceMove, startGame } =
  await import("../../../../src/client/game/huedoku.ts");
const { seededRng } = await import("../../helpers/seededRng.ts");

const { HAPTICS } = await import("../../../../src/client/util/haptics.ts");

const SIZE = 6;
const SEED = 1234;
// newGame() generates its puzzle first, so the same seed yields the same puzzle.
const puzzle = generatePuzzle(SIZE, seededRng(SEED));
const winnerCell = (row: number) => row * SIZE + puzzle.winners[row];
const loserCell = (row: number) =>
  row * SIZE + ((puzzle.winners[row] + 1) % SIZE);

const storage = () => (globalThis.window as unknown as Window).localStorage;

function setup(props: Record<string, unknown> = {}) {
  const { container } = render(
    html`<${Huedoku} size=${SIZE} rng=${seededRng(SEED)} ...${props} />`,
  );
  const cell = (i: number) =>
    container.querySelector(`[data-cell="${i}"]`) as HTMLElement;
  const isMarked = (i: number, mark: string) =>
    cell(i).classList.contains(`hd-cell--${mark}`);
  return { container, cell, isMarked };
}

let pointerId = 0;
function down(el: HTMLElement, id = ++pointerId) {
  fireEvent.pointerDown(el, { pointerId: id, pointerType: "touch", button: 0 });
  return id;
}
function move(el: HTMLElement, id: number) {
  fireEvent.pointerMove(el, { pointerId: id, pointerType: "touch" });
}
function up(el: HTMLElement, id: number) {
  fireEvent.pointerUp(el, { pointerId: id, pointerType: "touch" });
}
function tap(el: HTMLElement) {
  up(el, down(el));
}
function doubleTap(el: HTMLElement) {
  tap(el);
  tap(el);
}
/** Wait out the double-tap window so the next tap counts as a fresh single tap. */
function pause() {
  const realNow = Date.now;
  const shifted = realNow() + DOUBLE_TAP_MS + 1;
  Date.now = () => shifted;
  return () => {
    Date.now = realNow;
  };
}

describe("Huedoku", () => {
  afterEach(() => {
    cleanup();
    storage().clear();
  });

  it("starts a new player on a 5x5 board at difficulty 1", () => {
    const { container } = render(html`<${Huedoku} />`);
    assert.equal(container.querySelectorAll("[data-cell]").length, 25);
    screen.getByText("5×5 · Level 1/8");
  });

  it("renders a SIZE x SIZE board with every guess available", () => {
    const { container } = setup();
    assert.equal(container.querySelectorAll("[data-cell]").length, SIZE * SIZE);
    screen.getByText(`0/${SIZE}`);
    screen.getByLabelText(`3 of 3 guesses left`);
  });

  it("colors each cell by its region", () => {
    const { cell } = setup();
    for (let i = 0; i < SIZE * SIZE; i++) {
      assert.ok(
        cell(i)
          .getAttribute("style")!
          .includes(puzzle.colors[puzzle.regions[i]]),
      );
    }
  });

  it("a tap marks a cell invalid, and another (later) tap clears it", () => {
    const { cell, isMarked } = setup();
    tap(cell(0));
    assert.ok(isMarked(0, "invalid"));
    const restore = pause();
    try {
      tap(cell(0));
    } finally {
      restore();
    }
    assert.ok(isMarked(0, "blank"));
  });

  it("double-tapping a winning cell submits it as found", () => {
    const { cell, isMarked } = setup();
    doubleTap(cell(winnerCell(0)));
    assert.ok(isMarked(winnerCell(0), "found"));
    screen.getByText(`1/${SIZE}`);
    screen.getByLabelText(`3 of 3 guesses left`);
  });

  it("double-tapping a non-winning cell costs a guess", () => {
    const { cell, isMarked } = setup();
    doubleTap(cell(loserCell(0)));
    assert.ok(isMarked(loserCell(0), "wrong"));
    screen.getByLabelText(`2 of 3 guesses left`);
  });

  it("double-tapping an invalid-marked winner still submits it", () => {
    const { cell, isMarked } = setup();
    tap(cell(winnerCell(2)));
    assert.ok(isMarked(winnerCell(2), "invalid"));
    const restore = pause();
    try {
      doubleTap(cell(winnerCell(2)));
    } finally {
      restore();
    }
    assert.ok(isMarked(winnerCell(2), "found"));
  });

  it("dragging marks every cell the pointer passes over", () => {
    const { cell, isMarked } = setup();
    // an L: along row 0, then down column 2, skipping cells between events
    const id = down(cell(0));
    move(cell(2), id);
    move(cell(2 + 2 * SIZE), id);
    // doubling back keeps what's been traced
    move(cell(2 + SIZE), id);
    up(cell(2 + SIZE), id);
    const path = [0, 1, 2, 2 + SIZE, 2 + 2 * SIZE];
    for (const i of path) assert.ok(isMarked(i, "invalid"), `cell ${i}`);
    for (const i of [3, SIZE, 1 + SIZE, 1 + 2 * SIZE])
      assert.ok(isMarked(i, "blank"), `cell ${i}`);
    // a drag never counts toward a double-tap
    tap(cell(2));
    assert.ok(isMarked(2, "blank"));
  });

  describe("haptics", () => {
    let calls: unknown[] = [];
    const nav = () =>
      globalThis.navigator as unknown as Record<string, unknown>;
    beforeEach(() => {
      calls = [];
      nav().vibrate = (pattern: unknown) => {
        calls.push(pattern);
        return true;
      };
    });
    afterEach(() => {
      delete nav().vibrate;
    });

    it("buzzes lightly when a cell is marked or cleared", () => {
      const { cell } = setup();
      tap(cell(0));
      assert.deepEqual(calls, [HAPTICS.toggle]);
    });

    it("ticks as a drag takes in more cells", () => {
      const { cell } = setup();
      const id = down(cell(0));
      move(cell(1), id);
      move(cell(2), id);
      up(cell(2), id);
      assert.deepEqual(calls, [HAPTICS.toggle, HAPTICS.toggle, HAPTICS.toggle]);
    });

    it("double-buzzes for a right guess", () => {
      const { cell } = setup();
      doubleTap(cell(winnerCell(0)));
      assert.deepEqual(calls.at(-1), HAPTICS.right);
    });

    it("double-buzzes harder for a wrong guess", () => {
      const { cell } = setup();
      doubleTap(cell(loserCell(0)));
      assert.deepEqual(calls.at(-1), HAPTICS.wrong);
    });

    it("stays quiet when nothing changes", () => {
      const { cell } = setup();
      doubleTap(cell(winnerCell(0)));
      calls = [];
      doubleTap(cell(winnerCell(0))); // already found: locked
      assert.deepEqual(calls, []);
    });
  });

  it("cancels touchend on the board so double-taps don't zoom the page", () => {
    const { cell } = setup();
    const touchEnd = new Event("touchend", { bubbles: true, cancelable: true });
    cell(0).dispatchEvent(touchEnd);
    assert.ok(touchEnd.defaultPrevented);
  });

  it("dragging down a column marks the column", () => {
    const { cell, isMarked } = setup();
    const id = down(cell(1));
    move(cell(1 + 2 * SIZE), id);
    up(cell(1 + 2 * SIZE), id);
    for (const i of [1, 1 + SIZE, 1 + 2 * SIZE])
      assert.ok(isMarked(i, "invalid"));
  });

  it("winning shows the puzzle's score out of the best possible, as stars", () => {
    const { cell } = setup();
    // a wrong guess and a restart cost this puzzle 125
    doubleTap(cell(loserCell(0)));
    fireEvent.click(screen.getByLabelText("Restart puzzle"));
    fireEvent.click(screen.getByText("This puzzle"));
    for (let row = 0; row < SIZE; row++) doubleTap(cell(winnerCell(row)));
    screen.getByText(/You scored -5 out of a possible 120/);
    screen.getByLabelText("0 of 3 stars");
  });

  it("a clean solve earns all three stars", () => {
    const { cell, container } = setup();
    tap(cell(loserCell(0)));
    pause()();
    for (let row = 0; row < SIZE; row++) doubleTap(cell(winnerCell(row)));
    screen.getByText(/You scored 119 out of a possible 120/);
    screen.getByLabelText("3 of 3 stars");
    screen.getByText("Solved!");
    assert.equal(container.querySelector(".hd-burst"), null);
  });

  it("a perfect game says so and sets off a burst", () => {
    const { cell, container } = setup();
    for (let row = 0; row < SIZE; row++) doubleTap(cell(winnerCell(row)));
    screen.getByText("Perfect!");
    screen.getByLabelText("3 of 3 stars");
    assert.ok(container.querySelector(".hd-burst span"));
  });

  it("winning offers Next Level, which moves up one size", async () => {
    const { container, cell } = setup();
    for (let row = 0; row < SIZE; row++) doubleTap(cell(winnerCell(row)));
    screen.getByRole("dialog");
    screen.getByText("Perfect!"); // no marks, no misses;
    fireEvent.click(screen.getByText("Next Level"));
    await waitFor(() => screen.getByText("7×7 · Level 1/8"));
    assert.equal(container.querySelectorAll("[data-cell]").length, 49);
    assert.equal(screen.queryByRole("dialog"), null);
  });

  it("winning the largest board of a level moves to the next level", async () => {
    const big = generatePuzzle(10, seededRng(SEED));
    const { cell } = setup({ size: 10 });
    for (let row = 0; row < 10; row++)
      doubleTap(cell(row * 10 + big.winners[row]));
    screen.getByText("Level up! Level 2 starts at 5×5.");
    fireEvent.click(screen.getByText("Next Level"));
    await waitFor(() => screen.getByText("5×5 · Level 2/8"));
  });

  it("only shows the size spinner in dev mode", () => {
    setup();
    assert.equal(screen.queryByLabelText("Bigger board"), null);
  });

  it("the dev size spinner changes the board size", async () => {
    const { container } = setup({ dev: true });
    fireEvent.click(screen.getByLabelText("Bigger board"));
    await waitFor(() =>
      assert.equal(container.querySelectorAll("[data-cell]").length, 49),
    );
    fireEvent.click(screen.getByLabelText("Smaller board"));
    await waitFor(() =>
      assert.equal(container.querySelectorAll("[data-cell]").length, 36),
    );
    fireEvent.click(screen.getByLabelText("Smaller board"));
    await waitFor(() =>
      assert.equal(container.querySelectorAll("[data-cell]").length, 25),
    );
    assert.ok(
      (screen.getByLabelText("Smaller board") as HTMLButtonElement).disabled,
    );
  });

  it("the dev level spinner changes the level, keeping the size", async () => {
    const { container } = setup({ dev: true });
    assert.ok(
      (screen.getByLabelText("Easier level") as HTMLButtonElement).disabled,
    );
    fireEvent.click(screen.getByLabelText("Harder level"));
    await waitFor(() => screen.getByText("Level 2/8"));
    assert.equal(container.querySelectorAll("[data-cell]").length, 36);
    fireEvent.click(screen.getByLabelText("Easier level"));
    await waitFor(() => screen.getByText("Level 1/8"));
  });

  describe("auto", () => {
    const blanks = (container: ParentNode) =>
      container.querySelectorAll(".hd-cell--blank").length;

    it("rules out what a right guess makes impossible, free of charge", () => {
      const { cell, container, isMarked } = setup({ dev: true, auto: true });
      doubleTap(cell(winnerCell(0)));
      for (let col = 0; col < SIZE; col++) {
        if (col !== puzzle.winners[0]) assert.ok(isMarked(col, "invalid"));
      }
      assert.ok(blanks(container) < SIZE * SIZE - SIZE);
      assert.equal(screen.getByLabelText("Score").textContent, "20");
      // a wrong guess rules out nothing else
      const before = blanks(container);
      const blank = puzzle.regions.findIndex(
        (_, i) =>
          isMarked(i, "blank") &&
          puzzle.winners[Math.floor(i / SIZE)] !== i % SIZE,
      );
      doubleTap(cell(blank));
      assert.ok(isMarked(blank, "wrong"));
      assert.equal(blanks(container), before - 1);
    });

    it("keeps the auto marks through an undo", () => {
      const { cell, isMarked } = setup({ dev: true, auto: true });
      tap(cell(loserCell(4)));
      doubleTap(cell(winnerCell(0)));
      fireEvent.click(screen.getByLabelText("Undo"));
      assert.ok(isMarked(winnerCell(0) === 0 ? 1 : 0, "invalid"));
    });

    it("is off without the flag, and outside dev mode", () => {
      for (const props of [{ dev: true }, { auto: true }]) {
        const { cell, container } = setup(props);
        doubleTap(cell(winnerCell(0)));
        assert.equal(blanks(container), SIZE * SIZE - 1);
        cleanup();
        storage().clear();
      }
    });
  });

  describe("Nice move!", () => {
    it("cheers a right guess the board doesn't show yet", () => {
      const row = puzzle.winners.findIndex((_, r) =>
        isNiceMove(startGame(puzzle), winnerCell(r)),
      );
      assert.ok(row >= 0, "this puzzle has a leap to make");
      const { cell, container } = setup();
      doubleTap(cell(winnerCell(row)));
      screen.getByText("Nice move!");
      assert.ok(container.querySelector(".hd-shimmer"));
    });

    it("stays quiet for a guess the board already shows", () => {
      const { cell, container } = setup();
      // rule out the rest of row 0, then submit its winner
      for (let col = 0; col < SIZE; col++) {
        if (col === puzzle.winners[0]) continue;
        tap(cell(col));
        pause()();
      }
      doubleTap(cell(winnerCell(0)));
      assert.equal(screen.queryByText("Nice move!"), null);
      assert.equal(container.querySelector(".hd-shimmer"), null);
    });
  });

  it("loads games saved before puzzles were graded", () => {
    const old = { ...puzzle } as Record<string, unknown>;
    delete old.grade;
    storage().setItem(
      "huedoku",
      JSON.stringify({
        version: 1,
        game: {
          puzzle: old,
          marks: new Array(SIZE * SIZE).fill("blank"),
          mistakes: 1,
          lives: 3,
        },
        history: [],
      }),
    );
    setup({ rng: seededRng(SEED + 1) });
    screen.getByLabelText(`2 of 3 guesses left`);
  });

  describe("score", () => {
    const score = () => Number(screen.getByLabelText("Score").textContent);

    it("starts at 0 and charges 1 per cell ruled out, 1 per undo", () => {
      const { cell } = setup();
      assert.equal(score(), 0);
      tap(cell(0));
      assert.equal(score(), -1);
      const restore = pause();
      try {
        tap(cell(0)); // clearing is free
      } finally {
        restore();
      }
      assert.equal(score(), -1);
      fireEvent.click(screen.getByLabelText("Undo"));
      assert.equal(score(), -2);
    });

    it("charges a drag once for each cell it marks", () => {
      const { cell } = setup();
      const id = down(cell(0));
      move(cell(3), id);
      assert.equal(score(), -4);
      move(cell(1), id); // going back over marked cells is free
      move(cell(1 + SIZE), id);
      up(cell(1 + SIZE), id);
      assert.equal(score(), -5);
    });

    it("scores guesses without charging the double-tap's first tap", () => {
      const { cell } = setup();
      doubleTap(cell(winnerCell(0)));
      assert.equal(score(), 20);
      doubleTap(cell(loserCell(1)));
      assert.equal(score(), 20 - 25);
    });

    it("New puzzle gives back the puzzle's points and charges 5", async () => {
      const { cell } = setup();
      doubleTap(cell(winnerCell(0)));
      doubleTap(cell(winnerCell(1)));
      assert.equal(score(), 40);
      fireEvent.click(screen.getByText("New puzzle"));
      await waitFor(() => assert.equal(score(), -5));
      // and again, from the new puzzle's starting point
      doubleTap(cell(winnerCell(0))); // whatever this cell is now
      fireEvent.click(screen.getByText("New puzzle"));
      await waitFor(() => assert.equal(score(), -10));
    });

    it("charges 100 for restarting and survives a reload", () => {
      const { cell } = setup();
      doubleTap(cell(winnerCell(0)));
      fireEvent.click(screen.getByLabelText("Restart puzzle"));
      fireEvent.click(screen.getByText("This puzzle"));
      assert.equal(score(), 20 - 100);
      cleanup();
      setup({ rng: seededRng(SEED + 1) });
      assert.equal(score(), -80);
    });
  });

  it("Restart clears the board and mistakes after confirming", () => {
    const { cell, isMarked } = setup();
    const restart = screen.getByLabelText(
      "Restart puzzle",
    ) as HTMLButtonElement;
    assert.ok(!restart.disabled, "available even on a fresh board");
    doubleTap(cell(loserCell(0)));
    doubleTap(cell(winnerCell(2)));
    screen.getByLabelText(`2 of 3 guesses left`);
    assert.ok(!restart.disabled);

    // Cancel leaves everything as it was
    fireEvent.click(restart);
    screen.getByText("Restart?");
    fireEvent.click(screen.getByText("Cancel"));
    assert.equal(screen.queryByRole("dialog"), null);
    assert.ok(isMarked(winnerCell(2), "found"));

    fireEvent.click(restart);
    fireEvent.click(screen.getByText("This puzzle"));
    assert.equal(screen.queryByRole("dialog"), null);
    screen.getByLabelText(`3 of 3 guesses left`);
    for (let i = 0; i < SIZE * SIZE; i++) {
      assert.ok(isMarked(i, "blank"), `cell ${i}`);
    }
    assert.ok(!restart.disabled);
  });

  it("Restart can start over from level 1 with a fresh score", async () => {
    const { cell } = setup({ size: 7, difficulty: 3 });
    doubleTap(cell(0));
    fireEvent.click(screen.getByLabelText("Restart puzzle"));
    fireEvent.click(screen.getByText("From level 1"));
    await waitFor(() => screen.getByText("5×5 · Level 1/8"));
    assert.equal(screen.getByLabelText("Score").textContent, "0");
    screen.getByLabelText(`3 of 3 guesses left`);
  });

  it("losing reveals the winners and offers Try Again on the same puzzle", () => {
    const { cell, container, isMarked } = setup();
    for (let row = 0; row < 3; row++) doubleTap(cell(loserCell(row)));
    screen.getByText("Out of guesses");
    assert.equal(container.querySelectorAll(".hd-cell--revealed").length, SIZE);
    // the board no longer responds
    doubleTap(cell(winnerCell(0)));
    assert.ok(!isMarked(winnerCell(0), "found"));

    fireEvent.click(screen.getByText("Try Again"));
    assert.equal(screen.queryByRole("dialog"), null);
    screen.getByLabelText(`3 of 3 guesses left`);
    for (let i = 0; i < SIZE * SIZE; i++) {
      assert.ok(isMarked(i, "blank"), `cell ${i}`);
      assert.ok(
        cell(i)
          .getAttribute("style")!
          .includes(puzzle.colors[puzzle.regions[i]]),
      );
    }
  });

  it("restores a game in progress from localStorage", () => {
    const first = setup();
    doubleTap(first.cell(loserCell(1)));
    const restore = pause();
    try {
      const id = down(first.cell(0));
      move(first.cell(2), id);
      up(first.cell(2), id);
    } finally {
      restore();
    }
    cleanup();

    // a different seed would build a different puzzle, so this must be the saved one
    const { cell, isMarked } = setup({ rng: seededRng(SEED + 1) });
    assert.ok(isMarked(loserCell(1), "wrong"));
    for (const i of [0, 1, 2]) assert.ok(isMarked(i, "invalid"), `cell ${i}`);
    screen.getByLabelText(`2 of 3 guesses left`);
    for (let i = 0; i < SIZE * SIZE; i++) {
      assert.ok(
        cell(i)
          .getAttribute("style")!
          .includes(puzzle.colors[puzzle.regions[i]]),
      );
    }
    // undo history survives too
    fireEvent.click(screen.getByLabelText("Undo"));
    for (const i of [0, 1, 2]) assert.ok(isMarked(i, "blank"), `cell ${i}`);
  });

  it("ignores unreadable saved data", () => {
    storage().setItem("huedoku", "{not json");
    const { container } = setup();
    assert.equal(container.querySelectorAll("[data-cell]").length, SIZE * SIZE);
    storage().setItem(
      "huedoku",
      JSON.stringify({ version: 1, game: { nope: 1 } }),
    );
    cleanup();
    setup();
    screen.getByText(`${SIZE}×${SIZE} · Level 1/8`);
  });

  it("Undo reverts taps one at a time", () => {
    const { cell, isMarked } = setup();
    const undo = screen.getByLabelText("Undo") as HTMLButtonElement;
    assert.ok(undo.disabled);
    tap(cell(0));
    const restore = pause();
    try {
      tap(cell(1));
    } finally {
      restore();
    }
    assert.ok(!undo.disabled);
    fireEvent.click(undo);
    assert.ok(isMarked(0, "invalid"));
    assert.ok(isMarked(1, "blank"));
    fireEvent.click(undo);
    assert.ok(isMarked(0, "blank"));
    assert.ok(undo.disabled);
  });

  it("Undo reverts a whole drag in one step", () => {
    const { cell, isMarked } = setup();
    const id = down(cell(0));
    move(cell(1), id);
    move(cell(2), id);
    up(cell(2), id);
    fireEvent.click(screen.getByLabelText("Undo"));
    for (const i of [0, 1, 2]) assert.ok(isMarked(i, "blank"), `cell ${i}`);
    assert.ok((screen.getByLabelText("Undo") as HTMLButtonElement).disabled);
  });

  it("Undo never takes back a submission", () => {
    const { cell, isMarked } = setup();
    tap(cell(0));
    const restore = pause();
    try {
      doubleTap(cell(loserCell(1)));
    } finally {
      restore();
    }
    assert.ok(isMarked(loserCell(1), "wrong"));
    // the double-tap's own toggle isn't left on the history either
    fireEvent.click(screen.getByLabelText("Undo"));
    assert.ok(isMarked(0, "blank"));
    assert.ok(isMarked(loserCell(1), "wrong"));
    screen.getByLabelText(`2 of 3 guesses left`);
    assert.ok((screen.getByLabelText("Undo") as HTMLButtonElement).disabled);
  });

  it("New puzzle starts a fresh board at the same level", async () => {
    const { cell, isMarked } = setup();
    doubleTap(cell(loserCell(0)));
    fireEvent.click(screen.getByText("New puzzle"));
    await waitFor(() => assert.ok(isMarked(loserCell(0), "blank")));
    screen.getByLabelText(`3 of 3 guesses left`);
    screen.getByText(`${SIZE}×${SIZE} · Level 1/8`);
  });
});
