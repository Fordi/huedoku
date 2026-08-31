import { mock } from "node:test";

/**
 * Runs `fn` with node:test's fake `setTimeout`/`setInterval`, repeatedly
 * advancing the fake clock by `tickMs` and yielding a macrotask (via a real
 * setImmediate, so any interleaved real I/O - an HTTP request, a subprocess
 * spawn - actually gets to run) until `fn`'s promise settles. For a poll
 * loop like mega.ts's/transmission.ts's (real work, then a hardcoded
 * `sleep(POLL_INTERVAL_MS)`, repeat), this collapses what would otherwise be
 * several real seconds of waiting into a handful of fast event-loop turns,
 * without needing to know in advance how many polls a given test scenario
 * takes. Bounded by a real deadline as a safety net in case `fn` never
 * settles (e.g. a bug leaves it waiting on a timer this helper doesn't
 * advance) - a hang here would otherwise be silent and indistinguishable
 * from a slow-but-real one.
 */
export async function tickUntilSettled<T>(
  fn: () => Promise<T>,
  opts: { tickMs?: number; realTimeoutMs?: number } = {},
): Promise<T> {
  const tickMs = opts.tickMs ?? 2000;
  const realTimeoutMs = opts.realTimeoutMs ?? 5000;

  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    let settled = false;
    const result = fn().finally(() => {
      settled = true;
    });

    const deadline = Date.now() + realTimeoutMs;
    while (!settled && Date.now() < deadline) {
      mock.timers.tick(tickMs);
      await new Promise((resolve) => setImmediate(resolve));
    }

    return await result;
  } finally {
    mock.timers.reset();
  }
}
