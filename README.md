# huedoku

A color-region logic puzzle, served as a Preact app with no build step.

## How to play

The board is a SIZE x SIZE grid (5x5 to 12x12) split into SIZE colored regions. Each region hides exactly one winning cell, and no two winning cells share a row, share a column, or touch - not even diagonally. Every puzzle has exactly one solution, so it can be solved by deduction.

- **Tap** a cell to rule it out (×); tap it again to clear the mark.
- **Drag** to rule out every cell you pass over.
- **Double-tap** a cell to submit it as a winning cell.

Find every winning cell to win. Three wrong submissions and the game is over - but you can try the same puzzle again.

Your score carries from puzzle to puzzle: +20 for each winning cell found, -25 for each wrong submission, -1 for each cell ruled out, -1 for each undo, and -100 for restarting a puzzle (Restart, or Try Again after losing). "New puzzle" takes back everything the abandoned puzzle scored, plus 5. Each solved N×N puzzle earns stars: one for finishing without backtracking (at least 20N - (N² - N) - 50: every other cell ruled out and two wrong guesses), two for everything ruled out with at most one wrong guess (20N - (N² - N) - 25), and three for leaving at least a quarter of the other cells un-ruled with no wrong guesses (20N - ¾(N² - N)). A perfect game - every winner found, nothing else marked - gets a little fanfare. So does a right guess the board doesn't show yet - one that a few easy deductions from your finds and X's wouldn't prove: "Nice move!"

The Restart button (lower right) offers to restart the current puzzle, or to start over from level 1 with a fresh score.

You start on a 5x5 board. Each win moves you up one size; winning the largest board of a level starts the next level on its smallest. There are eight levels, running from 5x5-10x10 at level 1 to 8x8-14x14 at level 8. Every puzzle is graded by the hardest deduction needed to solve it (see [src/client/game/grade.ts](src/client/game/grade.ts)): early levels have lopsided region sizes and fall to simple deductions, later ones demand pairs, groups, and finally "what if" reasoning. Puzzles that would need a guess are passed over. Progress is saved in the browser, so a reload picks up where you left off.

Add `?dev` to the URL for board-size (5x5 up to 30x30, past what the levels use) and level spinners, and a puzzle's grade on hover over the level label. Using a spinner abandons the puzzle like "New puzzle" does. Add `&auto` too (`?dev&auto`) and every right guess rules out the cells it makes impossible - the rest of its row, column, and region, and its neighbors - free of charge.

## Quick start

Requires Node.js **v24.18.0+** (native TypeScript execution, no build step). If you use [nvm](https://github.com/nvm-sh/nvm):

```sh
nvm install
nvm use
```

Install dependencies and start the server:

```sh
npm install
npm start
```

The server listens on `PORT` (default `3000`). Optional settings go in `.env` - see [.env.example](.env.example).

To deploy as a static site instead, `npm run build` bundles everything into `dist/` - see [docs/deployment.md](docs/deployment.md#deploying-as-a-static-site).

## Documentation

- [docs/deployment.md](docs/deployment.md) - static builds, systemd, environment variables, path prefixes
- [docs/development.md](docs/development.md) - running tests, adding a route, native-TS constraints
- [docs/project-layout.md](docs/project-layout.md) - project layout
