import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.API_KEY_ENCRYPTION_KEY;
  if (!key) throw new Error("API_KEY_ENCRYPTION_KEY environment variable is not set");
  // Key must be 32 bytes (64 hex chars)
  const buf = Buffer.from(key, "hex");
  if (buf.length !== 32) {
    throw new Error("API_KEY_ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  }
  return buf;
}

/** Encrypt a plaintext string. Returns `iv:ciphertext:authTag` in hex. */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${encrypted}:${authTag.toString("hex")}`;
}

/** Decrypt a string in `iv:ciphertext:authTag` hex format. */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  const parts = encryptedData.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted data format");

  const iv = Buffer.from(parts[0], "hex");
  const ciphertext = parts[1];
  const authTag = Buffer.from(parts[2], "hex");

  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Invalid encrypted data format");
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
