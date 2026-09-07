import crypto from 'crypto';

/**
 * Masuma ERP - Server-Side OTP Verification Store
 * 
 * Manages active verification codes, expiry windows, attempt tracking,
 * and single-use consumption for production authentication.
 */

export interface ActiveOtpRecord {
  email: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  failedAttempts: number;
  lastRequestedAt: number;
  purpose: string;
}

// In-memory active code store keyed by normalized email
const activeOtpStore = new Map<string, ActiveOtpRecord>();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 45 * 1000; // 45 seconds between requests
const MAX_VERIFY_ATTEMPTS = 5;

/**
 * Generates and stores a new 6-digit verification code for an email.
 * Enforces resend cooldowns to prevent abuse.
 */
export function issueVerificationOtp(email: string, purpose: string = 'password_reset'): {
  allowed: boolean;
  code?: string;
  expiresAt?: number;
  cooldownRemainingSec?: number;
  error?: string;
} {
  const cleanEmail = email.trim().toLowerCase();
  const now = Date.now();
  const existing = activeOtpStore.get(cleanEmail);

  // Check resend cooldown
  if (existing && (now - existing.lastRequestedAt) < RESEND_COOLDOWN_MS) {
    const cooldownRemainingSec = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastRequestedAt)) / 1000);
    return {
      allowed: false,
      cooldownRemainingSec,
      error: `Please wait ${cooldownRemainingSec}s before requesting a new verification code.`
    };
  }

  // Generate cryptographically strong 6-digit integer
  const randomBuffer = crypto.randomBytes(4);
  const randomNumber = randomBuffer.readUInt32BE(0);
  const code = (100000 + (randomNumber % 900000)).toString();

  const record: ActiveOtpRecord = {
    email: cleanEmail,
    code,
    createdAt: now,
    expiresAt: now + OTP_EXPIRY_MS,
    failedAttempts: 0,
    lastRequestedAt: now,
    purpose
  };

  activeOtpStore.set(cleanEmail, record);

  return {
    allowed: true,
    code,
    expiresAt: record.expiresAt
  };
}

/**
 * Verifies a submitted OTP code against the record.
 * Handles expiry, attempt counts, and single-use consumption.
 */
export function verifyOtpCode(email: string, inputCode: string): {
  valid: boolean;
  message: string;
  attemptsRemaining?: number;
} {
  const cleanEmail = email.trim().toLowerCase();
  const now = Date.now();
  const record = activeOtpStore.get(cleanEmail);

  if (!record) {
    return {
      valid: false,
      message: 'No active verification code found for this email. Please request a new code.'
    };
  }

  if (now > record.expiresAt) {
    activeOtpStore.delete(cleanEmail);
    return {
      valid: false,
      message: 'Verification code has expired. Please request a new code.'
    };
  }

  const cleanInput = inputCode.trim();
  if (record.code !== cleanInput) {
    record.failedAttempts += 1;
    const remaining = MAX_VERIFY_ATTEMPTS - record.failedAttempts;

    if (remaining <= 0) {
      activeOtpStore.delete(cleanEmail);
      return {
        valid: false,
        message: 'Maximum verification attempts exceeded. Code has been invalidated. Please request a new one.'
      };
    }

    return {
      valid: false,
      message: `Invalid verification code. (${remaining} attempts remaining before code expires)`,
      attemptsRemaining: remaining
    };
  }

  // Code is valid! Consume it immediately (single-use)
  activeOtpStore.delete(cleanEmail);

  return {
    valid: true,
    message: 'Verification code confirmed successfully.'
  };
}

/**
 * Cancels or clears any active OTP for an email.
 */
export function invalidateOtp(email: string): void {
  activeOtpStore.delete(email.trim().toLowerCase());
}
