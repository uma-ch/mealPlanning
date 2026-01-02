import crypto from 'crypto';

/**
 * Generate a secure API key
 * Format: rp_live_[32 random chars] or rp_dev_[32 random chars]
 *
 * @param environment - 'live' for production, 'dev' for development
 * @returns Generated API key string
 */
export function generateApiKey(environment: 'live' | 'dev' = 'live'): string {
  // Generate 24 random bytes (will be 32 characters in base64)
  const randomBytes = crypto.randomBytes(24);

  // Convert to base64 and clean up
  const randomString = randomBytes
    .toString('base64')
    .replace(/\+/g, 'A')  // Replace + with A
    .replace(/\//g, 'B')  // Replace / with B
    .replace(/=/g, '')    // Remove padding
    .substring(0, 32);    // Ensure exactly 32 chars

  return `rp_${environment}_${randomString}`;
}

/**
 * Hash API key for secure storage using SHA-256
 *
 * @param apiKey - The API key to hash
 * @returns Hex-encoded SHA-256 hash
 */
export function hashApiKey(apiKey: string): string {
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');
}

/**
 * Extract prefix from API key for display purposes
 * Returns first 12 characters (e.g., "rp_live_abc...")
 *
 * @param apiKey - The API key
 * @returns First 12 characters of the key
 */
export function getKeyPrefix(apiKey: string): string {
  return apiKey.substring(0, 12);
}

/**
 * Validate API key format
 * Expected format: rp_(live|dev)_[32 alphanumeric characters]
 *
 * @param apiKey - The API key to validate
 * @returns true if format is valid, false otherwise
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  // Check format: rp_(live|dev)_[32 chars]
  const pattern = /^rp_(live|dev)_[a-zA-Z0-9]{32}$/;
  return pattern.test(apiKey);
}
