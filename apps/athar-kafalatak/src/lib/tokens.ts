import { randomBytes } from "crypto";

/**
 * Generates an unguessable, URL-safe report token (48 bits of entropy —
 * far beyond what's brute-forceable, and never sequential/derived from
 * sponsor data).
 */
export function generateReportToken() {
  return randomBytes(9)
    .toString("base64")
    .replace(/\+/g, "A")
    .replace(/\//g, "B")
    .replace(/=/g, "")
    .toUpperCase();
}
