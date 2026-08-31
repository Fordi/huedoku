// UUID, but terse
import { randomUUID } from "node:crypto";

export function generateHandle(): string {
  return Buffer.from(randomUUID().replace(/-/g, ""), "hex").toString("base64url");
}
