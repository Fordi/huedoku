// generate puzzles without blocking the UI
import { generatePuzzle, type Puzzle, type Rng } from "./huedoku.ts";
import type { GenerateRequest } from "./generate.worker.ts";

/**
 * The hardest boards can take a second or so to generate, so outside of
 * tests this hands the work to a web worker. A seeded `rng` can't cross into
 * the worker, so passing one (as tests do) generates on the spot instead -
 * as does any environment without workers, or a worker that fails.
 */
let worker: Worker | undefined;
let workerFailed = false;
let nextId = 0;
const waiting = new Map<
  number,
  { request: GenerateRequest; resolve: (p: Puzzle) => void }
>();

const generateHere = ({ size, difficulty, budgetMs }: GenerateRequest) =>
  generatePuzzle(size, Math.random, { difficulty, budgetMs });

function getWorker(): Worker | undefined {
  if (worker || workerFailed || typeof Worker === "undefined") return worker;
  try {
    worker = new Worker(new URL("./generate.worker.ts", import.meta.url), {
      type: "module",
    });
  } catch (_e) {
    workerFailed = true;
    return undefined;
  }
  worker.onmessage = (e: MessageEvent<{ id: number; puzzle: Puzzle }>) => {
    waiting.get(e.data.id)?.resolve(e.data.puzzle);
    waiting.delete(e.data.id);
  };
  worker.onerror = () => {
    // fall back for anything in flight, and for good
    for (const { request, resolve } of waiting.values()) {
      resolve(generateHere(request));
    }
    waiting.clear();
    worker?.terminate();
    worker = undefined;
    workerFailed = true;
  };
  return worker;
}

export function requestPuzzle(
  size: number,
  difficulty: number,
  rng?: Rng,
  /** how long to search for a puzzle in the level's grade band (see generatePuzzle) */
  budgetMs?: number,
): Promise<Puzzle> {
  if (rng) {
    return Promise.resolve(generatePuzzle(size, rng, { difficulty, budgetMs }));
  }
  const request = { id: nextId++, size, difficulty, budgetMs };
  const w = getWorker();
  if (!w) return Promise.resolve(generateHere(request));
  return new Promise((resolve) => {
    waiting.set(request.id, { request, resolve });
    w.postMessage(request);
  });
}
