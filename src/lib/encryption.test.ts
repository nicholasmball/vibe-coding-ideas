import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// A valid 32-byte key (64 hex chars)
const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("encryption", () => {
  beforeEach(() => {
    vi.stubEnv("API_KEY_ENCRYPTION_KEY", TEST_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // Dynamic import so env stubs take effect before module-level reads
  async function loadModule() {
    // Clear module cache to pick up fresh env vars
    vi.resetModules();
    return import("./encryption");
  }

  it("round-trips: decrypt(encrypt(plaintext)) === plaintext", async () => {
    const { encrypt, decrypt } = await loadModule();
    const plaintext = "sk-ant-api03-secret-key-value";
    const encrypted = encrypt(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it("produces iv:ciphertext:authTag format (3 colon-separated hex parts)", async () => {
    const { encrypt } = await loadModule();
    const encrypted = encrypt("test");
    const parts = encrypted.split(":");
    expect(parts).toHaveLength(3);
    // Each part should be a hex string
    for (const part of parts) {
      expect(part).toMatch(/^[0-9a-f]+$/);
    }
    // IV should be 12 bytes = 24 hex chars
    expect(parts[0]).toHaveLength(24);
    // Auth tag should be 16 bytes = 32 hex chars
    expect(parts[2]).toHaveLength(32);
  });

  it("produces different ciphertexts for the same plaintext (random IV)", async () => {
    const { encrypt } = await loadModule();
    const a = encrypt("same-input");
    const b = encrypt("same-input");
    expect(a).not.toBe(b);
  });

  it("handles empty string plaintext", async () => {
    const { encrypt, decrypt } = await loadModule();
    const encrypted = encrypt("");
    expect(decrypt(encrypted)).toBe("");
  });

  it("handles unicode plaintext", async () => {
    const { encrypt, decrypt } = await loadModule();
    const plaintext = "Hello 🌍 Привет";
    expect(decrypt(encrypt(plaintext))).toBe(plaintext);
  });

  it("throws on invalid format (wrong number of parts)", async () => {
    const { decrypt } = await loadModule();
    expect(() => decrypt("aabbcc:ddeeff")).toThrow("Invalid encrypted data format");
    expect(() => decrypt("no-colons-at-all")).toThrow("Invalid encrypted data format");
    expect(() => decrypt("a:b:c:d")).toThrow("Invalid encrypted data format");
  });

  it("throws on tampered ciphertext", async () => {
    const { encrypt, decrypt } = await loadModule();
    const encrypted = encrypt("secret");
    const parts = encrypted.split(":");
    // Tamper with the ciphertext portion
    const tampered = `${parts[0]}:ff${parts[1].slice(2)}:${parts[2]}`;
    expect(() => decrypt(tampered)).toThrow();
  });

  it("throws on wrong IV length", async () => {
    const { decrypt } = await loadModule();
    // IV should be 24 hex chars (12 bytes), use 20 instead
    const badIv = "aabbccddeeff0011223344"; // 22 hex chars = 11 bytes
    const authTag = "00".repeat(16); // 32 hex chars = 16 bytes
    expect(() => decrypt(`${badIv}:aabb:${authTag}`)).toThrow("Invalid encrypted data format");
  });

  it("throws when API_KEY_ENCRYPTION_KEY is not set", async () => {
    vi.stubEnv("API_KEY_ENCRYPTION_KEY", "");
    const { encrypt } = await loadModule();
    expect(() => encrypt("test")).toThrow("API_KEY_ENCRYPTION_KEY environment variable is not set");
  });

  it("throws when key is not 64 hex chars", async () => {
    vi.stubEnv("API_KEY_ENCRYPTION_KEY", "tooshort");
    const { encrypt } = await loadModule();
    expect(() => encrypt("test")).toThrow("API_KEY_ENCRYPTION_KEY must be 64 hex characters");
  });
});
