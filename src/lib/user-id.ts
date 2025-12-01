import { createHash } from "crypto";

const NAMESPACE_SEED = "clarydo-clerk-users";

function bytesToUuid(bytes: Buffer) {
  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

export function clerkUserIdToUuid(userId: string) {
  const hash = createHash("sha1");
  hash.update(NAMESPACE_SEED);
  hash.update(userId);
  const digest = hash.digest();
  const bytes = Buffer.from(digest.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC variant
  return bytesToUuid(bytes);
}
