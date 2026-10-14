// haptic feedback, where the browser supports it
/**
 * Vibration patterns (ms of buzz, ms of pause, ...). The Vibration API has no
 * intensity control, so a "harder" buzz is a longer one.
 */
export const HAPTICS = {
  /** a cell marked or cleared */
  toggle: [24],
  /** a winning cell found */
  right: [50, 70, 50],
  /** a wrong guess */
  wrong: [110, 70, 110],
} satisfies Record<string, number[]>;

export type Haptic = keyof typeof HAPTICS;

/** Buzz if this device can (Android browsers, mostly); otherwise do nothing. */
export function buzz(kind: Haptic): void {
  try {
    globalThis.navigator?.vibrate?.(HAPTICS[kind]);
  } catch (_e) {
    // unsupported or blocked - haptics are only ever a nicety
  }
}
