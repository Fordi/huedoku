// web worker that generates puzzles off the main thread
import { generatePuzzle } from "./huedoku.ts";

export type GenerateRequest = {
  id: number;
  size: number;
  difficulty: number;
  budgetMs?: number;
};

const scope = globalThis as unknown as {
  onmessage: (e: { data: GenerateRequest }) => void;
  postMessage: (message: unknown) => void;
};

scope.onmessage = ({ data: { id, size, difficulty, budgetMs } }) => {
  scope.postMessage({
    id,
    puzzle: generatePuzzle(size, Math.random, { difficulty, budgetMs }),
  });
};
