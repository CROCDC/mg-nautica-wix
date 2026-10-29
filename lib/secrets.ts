import "server-only";
import { timingSafeEqual } from "node:crypto";

/** Compare a secret without leaking, through timing, how much of it a guess got right. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
