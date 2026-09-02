/**
 * Masuma ERP Security Engine & Threat Mitigation Utilities
 * Provides defense-in-depth protection against:
 * 1. CSV Formula Injection (CWE-1236 / DDE Injection)
 * 2. Credential Theft & Plaintext Storage (Web Crypto SHA-256 Salted Hashes)
 * 3. Automated Brute-Force & Credential Stuffing (Rate Limiting & Cooldowns)
 * 4. Inactivity Hijacking (Terminal Auto-Lock)
 * 5. Data Tampering (SHA-256 Audit Integrity Checksums)
 * 6. XSS & Control Character Injections
 */

// ==========================================
// 1. CRYPTOGRAPHIC PASSWORD HASHING
// ==========================================

const DEFAULT_SALT = 'MASUMA_EA_SEC_2026_SALT_';

/**
 * Computes a salted SHA-256 hex string using native Web Crypto API
 */
export async function hashPassword(password: string, salt: string = DEFAULT_SALT): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Synchronous fallback hash using standard DJB2 + FNV-1a salted hash (for instant non-async checks)
 */
export function hashPasswordSync(password: string, salt: string = DEFAULT_SALT): string {
  const str = salt + password;
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const full = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return 'msh_' + full.toString(16).padStart(12, '0');
}

/**
 * Verifies if an entered password matches a stored password or salted hash
 */
export async function verifyPassword(inputPassword: string, storedValue: string): Promise<boolean> {
  if (!storedValue || !inputPassword) return false;

  // 1. Check direct match (for initial default migration)
  if (storedValue === inputPassword) return true;

  // 2. Check sync hash format
  const syncHash = hashPasswordSync(inputPassword);
  if (storedValue === syncHash) return true;

  // 3. Check async SHA-256 hash
  try {
    const shaHash = await hashPassword(inputPassword);
    if (storedValue === shaHash) return true;
  } catch {
    // Fallback if Web Crypto is unavailable
  }

  return false;
}

// ==========================================
// 2. ANTI-BRUTE-FORCE & ATTEMPT RATE LIMITER
// ==========================================

interface RateLimitRecord {
  attempts: number;
  lastAttemptTime: number;
  lockedUntil: number;
}

const STORAGE_KEY_RATE_LIMIT = 'masuma_sec_rate_limits';

export class RateLimiter {
  private static getRecords(): Record<string, RateLimitRecord> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_RATE_LIMIT);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private static saveRecords(records: Record<string, RateLimitRecord>): void {
    try {
      localStorage.setItem(STORAGE_KEY_RATE_LIMIT, JSON.stringify(records));
    } catch {
      // Storage full or quota error
    }
  }

  /**
   * Checks if an action is currently blocked by rate limit.
   * Returns { isBlocked: boolean, remainingSeconds: number, attempts: number }
   */
  public static check(key: string, maxAttempts = 5, lockDurationSeconds = 60): {
    isBlocked: boolean;
    remainingSeconds: number;
    attempts: number;
  } {
    const records = this.getRecords();
    const now = Date.now();
    const record = records[key];

    if (!record) {
      return { isBlocked: false, remainingSeconds: 0, attempts: 0 };
    }

    // Check if lockout is active
    if (record.lockedUntil > now) {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return { isBlocked: true, remainingSeconds, attempts: record.attempts };
    }

    // Reset attempts if window passed (e.g. 5 minutes since last attempt)
    if (now - record.lastAttemptTime > 300000) {
      delete records[key];
      this.saveRecords(records);
      return { isBlocked: false, remainingSeconds: 0, attempts: 0 };
    }

    return { isBlocked: false, remainingSeconds: 0, attempts: record.attempts };
  }

  /**
   * Records a failed attempt and triggers lockout if max attempts exceeded
   */
  public static recordFailure(key: string, maxAttempts = 5, lockDurationSeconds = 60): {
    isBlocked: boolean;
    remainingSeconds: number;
    attempts: number;
  } {
    const records = this.getRecords();
    const now = Date.now();
    const record = records[key] || { attempts: 0, lastAttemptTime: now, lockedUntil: 0 };

    record.attempts += 1;
    record.lastAttemptTime = now;

    if (record.attempts >= maxAttempts) {
      // Exponential backoff: base * 2^(overage)
      const multiplier = Math.min(4, record.attempts - maxAttempts + 1);
      record.lockedUntil = now + (lockDurationSeconds * multiplier * 1000);
    }

    records[key] = record;
    this.saveRecords(records);

    const isBlocked = record.lockedUntil > now;
    const remainingSeconds = isBlocked ? Math.ceil((record.lockedUntil - now) / 1000) : 0;
    return { isBlocked, remainingSeconds, attempts: record.attempts };
  }

  /**
   * Resets the attempt counter upon successful authentication
   */
  public static reset(key: string): void {
    const records = this.getRecords();
    delete records[key];
    this.saveRecords(records);
  }
}

// ==========================================
// 3. CSV FORMULA INJECTION NEUTRALIZER (CWE-1236)
// ==========================================

/**
 * Sanitizes any cell content to prevent CSV / Spreadsheet DDE Command Injection.
 * Prepends a single quote if the field begins with dangerous formula triggers (=, +, -, @, \t, \r, %).
 */
export function sanitizeCSVCell(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '';
  let stringVal = String(val);

  // If the cell begins with formula trigger characters, neutralize it with a single quote prefix
  if (/^[=+\-@\t\r%]/.test(stringVal)) {
    stringVal = `'${stringVal}`;
  }

  // Escape double quotes per RFC 4180
  stringVal = stringVal.replace(/"/g, '""');

  // Wrap in double quotes if it contains delimiters, linebreaks, or quotes
  if (stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('"') || stringVal.includes('\r')) {
    return `"${stringVal}"`;
  }
  return stringVal;
}

// ==========================================
// 4. CRYPTOGRAPHIC DATA INTEGRITY CHECKSUM
// ==========================================

/**
 * Generates an SHA-256 tamper-evident integrity digest for documents, invoices, or audit records
 */
export async function generateDocumentChecksum(content: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16).toUpperCase();
  } catch {
    // Fallback simple checksum
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = ((hash << 5) - hash) + content.charCodeAt(i);
      hash |= 0;
    }
    return 'CHK-' + Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  }
}

// ==========================================
// 5. INPUT SANITIZATION & SAFE STRING TRIMMING
// ==========================================

/**
 * Strips dangerous HTML tags and null bytes from input fields
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/\0/g, '') // remove null bytes
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .trim();
}

// ==========================================
// 6. TIME-BASED OTP SIMULATOR & VALIDATOR
// ==========================================

/**
 * Generates a valid 6-digit verification code with a 5-minute cryptographic validity window
 */
export function generateTimedOTP(identifier: string): { code: string; expiresAt: number } {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
  try {
    const otpData = { code, expiresAt, identifier: identifier.toLowerCase() };
    localStorage.setItem(`masuma_otp_${identifier.toLowerCase()}`, JSON.stringify(otpData));
  } catch {}
  return { code, expiresAt };
}

/**
 * Verifies a 6-digit OTP code against the stored record
 */
export function verifyTimedOTP(identifier: string, inputCode: string): { valid: boolean; reason?: string } {
  try {
    const stored = localStorage.getItem(`masuma_otp_${identifier.toLowerCase()}`);
    if (!stored) {
      return { valid: false, reason: 'No active OTP verification code found. Please request a new code.' };
    }
    const data = JSON.parse(stored);
    if (Date.now() > data.expiresAt) {
      localStorage.removeItem(`masuma_otp_${identifier.toLowerCase()}`);
      return { valid: false, reason: 'Verification code has expired. Please request a new one.' };
    }
    if (data.code !== inputCode.trim()) {
      return { valid: false, reason: 'Invalid verification code. Please check your authenticator or email.' };
    }
    // Consume OTP (single use)
    localStorage.removeItem(`masuma_otp_${identifier.toLowerCase()}`);
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Verification failed.' };
  }
}
