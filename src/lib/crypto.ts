import crypto from 'crypto';

/**
 * Cryptographically hashes a plaintext password using standard scrypt with a unique 16-byte random salt.
 * Returns format: "salt:derivedKey"
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

/**
 * Validates a plaintext password against a stored "salt:derivedKey" hash using timing-safe comparison.
 */
export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    if (!combinedHash || !combinedHash.includes(':')) {
      return false;
    }
    const [salt, key] = combinedHash.split(':');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const storedKeyBuffer = Buffer.from(key, 'hex');

    if (derivedKey.length !== storedKeyBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(derivedKey, storedKeyBuffer);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Generates a high-entropy hex token for email links (24 bytes = 48 hex chars)
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Generates an easy-to-read 6-digit numeric verification code for email confirmations
 */
export function generateVerificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
