// Slug a string to a valid filename
export function toFilename(str: string) {
  return (
    str
      // eslint-disable-next-line no-control-regex -- deliberately stripping control characters
      .replace(/[\u0000-\u001F]/gu, "_")
      .replace(/: /g, " - ")
      .replace(/:/g, "  -")
      .replace(/\?/g, "？")
      .replace(/@/g, " at ")
      .replace(/\+/g, "＋")
      .replace(/\.\.\./g, "…")
      .replace(/\//g, "⧸")
      .replace(/\\/g, "⧹")
      .replace(/"([^"]+)"/g, "“$1”")
      .replace(/"/g, "＂")
      .replace(/\*/g, "٭")
      .replace(/</g, "‹")
      .replace(/>/g, "›")
      .replace(/\|/g, "￨")
  );
}
