// generate tokens
import { createHash, randomBytes } from "node:crypto";

export interface GeneratedToken {
  raw: string;
  hash: string;
  prefix: string;
}

export function generateToken(): GeneratedToken {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashToken(raw), prefix: raw.slice(0, 8) };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
