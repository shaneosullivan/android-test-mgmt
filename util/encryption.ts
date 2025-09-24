import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16; // For CBC, this is always 16 bytes
const SALT_LENGTH = 32; // Salt length for key derivation

/**
 * Get the encryption key from environment variable
 * Uses PBKDF2 to derive a key from the environment variable
 */
function getKeys(salt: Buffer): { encKey: Buffer; hmacKey: Buffer } {
  const envKey = process.env.TOKEN_ENCRYPTION_KEY;
  if (!envKey) {
    throw new Error("TOKEN_ENCRYPTION_KEY environment variable is required");
  }

  // Derive both encryption and HMAC keys using PBKDF2
  const masterKey = crypto.pbkdf2Sync(envKey, salt, 100000, 64, "sha512");
  const encKey = masterKey.slice(0, 32); // First 32 bytes for encryption
  const hmacKey = masterKey.slice(32, 64); // Next 32 bytes for HMAC

  return { encKey, hmacKey };
}

/**
 * Encrypt a sensitive string (like an access token)
 * @param text - The text to encrypt
 * @returns Encrypted string in format: salt:iv:hmac:encryptedData (all base64 encoded)
 */
export function encryptToken(text: string): string {
  if (!text) {
    return "";
  }

  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive encryption and HMAC keys
    const { encKey, hmacKey } = getKeys(salt);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, encKey, iv);

    // Encrypt the text
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    // Create HMAC for authentication
    const hmac = crypto.createHmac("sha256", hmacKey);
    hmac.update(salt);
    hmac.update(iv);
    hmac.update(encrypted, "base64");
    const authTag = hmac.digest();

    // Return salt:iv:hmac:encryptedData (all base64 encoded)
    return [
      salt.toString("base64"),
      iv.toString("base64"),
      authTag.toString("base64"),
      encrypted,
    ].join(":");
  } catch (error) {
    console.error("Token encryption failed:", error);
    throw new Error("Failed to encrypt token");
  }
}

/**
 * Decrypt a token that was encrypted with encryptToken
 * @param encryptedData - The encrypted string from encryptToken
 * @returns Decrypted token string
 */
export function decryptToken(encryptedData: string): string {
  if (!encryptedData) {
    return "";
  }

  try {
    // Parse the encrypted data
    const parts = encryptedData.split(":");
    if (parts.length !== 4) {
      throw new Error("Invalid encrypted data format");
    }

    const [saltB64, ivB64, hmacB64, encrypted] = parts;

    // Convert from base64
    const salt = Buffer.from(saltB64, "base64");
    const iv = Buffer.from(ivB64, "base64");
    const providedHmac = Buffer.from(hmacB64, "base64");

    // Derive the same keys
    const { encKey, hmacKey } = getKeys(salt);

    // Verify HMAC for authentication
    const hmac = crypto.createHmac("sha256", hmacKey);
    hmac.update(salt);
    hmac.update(iv);
    hmac.update(encrypted, "base64");
    const computedHmac = hmac.digest();

    if (!crypto.timingSafeEqual(providedHmac, computedHmac)) {
      throw new Error(
        "Authentication failed - data may have been tampered with"
      );
    }

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, encKey, iv);

    // Decrypt the data
    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Token decryption failed:", error);
    throw new Error(
      "Failed to decrypt token - token may be corrupted or key may be incorrect"
    );
  }
}

/**
 * Check if a token is encrypted (has the expected format)
 * @param token - The token to check
 * @returns True if the token appears to be encrypted
 */
export function isTokenEncrypted(token: string): boolean {
  if (!token) {
    return false;
  }

  // Check if it matches our encrypted format (4 base64 parts separated by colons)
  const parts = token.split(":");
  if (parts.length !== 4) {
    return false;
  }

  // Verify each part is valid base64
  try {
    parts.forEach((part) => {
      Buffer.from(part, "base64");
    });
    return true;
  } catch {
    return false;
  }
}
