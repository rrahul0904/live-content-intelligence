import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { HttpError } from "./errors.js";

const VERSION = "v1";
const ALGORITHM = "aes-256-gcm";

function deriveKey(secret: string): Buffer {
  if (secret.length < 32) {
    throw new HttpError(503, "TOKEN_ENCRYPTION_KEY must be at least 32 characters", "encryption_not_configured");
  }
  return createHash("sha256").update(secret, "utf8").digest();
}

export function encryptSecret(plaintext: string, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, deriveKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url")
  ].join(".");
}

export function decryptSecret(payload: string, secret: string): string {
  const [version, ivPart, tagPart, bodyPart] = payload.split(".");
  if (version !== VERSION || !ivPart || !tagPart || !bodyPart) {
    throw new Error("Unsupported encrypted secret payload");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    deriveKey(secret),
    Buffer.from(ivPart, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(bodyPart, "base64url")),
    decipher.final()
  ]).toString("utf8");
}
