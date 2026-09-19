import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Masuma ERP - Production SMTP Configuration Service
 * 
 * Manages SMTP credentials and mail transporter instances.
 * Supports loading from environment variables, dynamic testing,
 * and masking sensitive credentials for diagnostics.
 */

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean; // true for 465, false for 587 or 25
  user: string;
  pass: string;
  from: string;
  fromName: string;
  fromAddress: string;
  replyTo?: string;
  service?: string; // Optional known service e.g. 'gmail', 'SendGrid'
}

export interface PublicSmtpStatus {
  isConfigured: boolean;
  host: string;
  port: number;
  secure: boolean;
  userMasked: string;
  fromAddress: string;
  service?: string;
  transportReady?: boolean;
}

// In-memory overrides (can be updated dynamically via admin settings during runtime)
let runtimeConfigOverride: Partial<SmtpConfig> | null = null;
let cachedTransporter: Transporter | null = null;
let lastTransporterKey = '';

/**
 * Robustly parses and sanitizes the sender display name, email address, and replyTo.
 * Strips erroneous backslashes, stray quotes, and handles domain mismatch between
 * the display sender and the authenticated SMTP user to prevent RFC 553 5.7.1 rejection.
 */
export function sanitizeSender(rawFrom: string | undefined, smtpUser: string): {
  name: string;
  address: string;
  replyTo?: string;
  formatted: string;
} {
  const fallbackUser = (smtpUser || '').trim();
  // Strip backslashes, escaped quotes, and newlines
  let clean = (rawFrom || '').replace(/\\/g, '').replace(/["'\r\n]/g, ' ').trim();

  // Extract email if enclosed in angle brackets or matching standard pattern
  const emailMatch = clean.match(/<([^>]+)>/) || clean.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  let email = emailMatch ? (emailMatch[1] || emailMatch[0]).trim().toLowerCase() : '';

  // Extract display name by removing the email and any angle brackets
  let name = clean.replace(/<[^>]+>/g, '').replace(email, '').replace(/\s+/g, ' ').trim();
  if (!name) {
    name = 'Masuma EA Ltd';
  }

  let replyTo: string | undefined = process.env.REPLY_TO ? process.env.REPLY_TO.replace(/["'\r\n\\]/g, '').trim() : undefined;

  // Domain ownership check: if authenticated as notifications@masuma.africa, sending as alerts@masuma.co.ke
  // will cause 553 5.7.1 "Sender address rejected: not owned by user notifications@masuma.africa".
  if (fallbackUser && fallbackUser.includes('@')) {
    const smtpDomain = fallbackUser.split('@')[1]?.toLowerCase();
    const emailDomain = email ? email.split('@')[1]?.toLowerCase() : '';

    if (!email) {
      email = fallbackUser;
    } else if (smtpDomain && emailDomain && smtpDomain !== emailDomain) {
      console.warn(`[Email Service] Warning: EMAIL_FROM address (${email}) does not match authenticated SMTP user domain (${fallbackUser}). Setting sender to ${fallbackUser} with Reply-To: ${email} to satisfy SMTP anti-spoofing policy.`);
      if (!replyTo) {
        replyTo = email;
      }
      email = fallbackUser;
    }
  } else if (!email && fallbackUser) {
    email = fallbackUser;
  }

  if (!email) {
    email = 'noreply@masuma.co.ke';
  }

  return {
    name,
    address: email,
    replyTo,
    formatted: `"${name}" <${email}>`
  };
}

/**
 * Retrieves the active SMTP configuration from environment variables or runtime overrides.
 */
export function getSmtpConfig(): SmtpConfig {
  const envHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const envPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const envSecure = process.env.SMTP_SECURE === 'true' || envPort === 465;
  const envUser = process.env.SMTP_USER || '';
  const envPass = process.env.SMTP_PASS || '';
  const envService = process.env.SMTP_SERVICE || undefined;

  const sender = sanitizeSender(process.env.EMAIL_FROM, envUser);

  const baseConfig: SmtpConfig = {
    host: envHost,
    port: envPort,
    secure: envSecure,
    user: envUser,
    pass: envPass,
    from: sender.formatted,
    fromName: sender.name,
    fromAddress: sender.address,
    replyTo: sender.replyTo,
    service: envService
  };

  if (!runtimeConfigOverride) {
    return baseConfig;
  }

  const merged: SmtpConfig = {
    ...baseConfig,
    ...runtimeConfigOverride,
    port: runtimeConfigOverride.port !== undefined ? Number(runtimeConfigOverride.port) : baseConfig.port,
    secure: runtimeConfigOverride.secure !== undefined ? Boolean(runtimeConfigOverride.secure) : baseConfig.secure,
  };

  if (runtimeConfigOverride.from || runtimeConfigOverride.user) {
    const overrideSender = sanitizeSender(runtimeConfigOverride.from || merged.from, runtimeConfigOverride.user || merged.user);
    merged.from = overrideSender.formatted;
    merged.fromName = overrideSender.name;
    merged.fromAddress = overrideSender.address;
    merged.replyTo = overrideSender.replyTo || merged.replyTo;
  }

  return merged;
}

/**
 * Updates runtime SMTP configuration in memory (e.g. from admin console).
 */
export function updateRuntimeSmtpConfig(overrides: Partial<SmtpConfig>): void {
  runtimeConfigOverride = {
    ...(runtimeConfigOverride || {}),
    ...overrides
  };
  // Invalidate cached transporter
  cachedTransporter = null;
  lastTransporterKey = '';
}

/**
 * Checks if SMTP credentials are provided and non-empty.
 */
export function isSmtpConfigured(): boolean {
  const config = getSmtpConfig();
  return Boolean((config.host || config.service) && config.user && config.pass);
}

/**
 * Masks an email or username string for safe public/diagnostic display.
 * Example: 'admin@masuma.co.ke' -> 'ad***@masuma.co.ke'
 */
export function maskCredential(val: string): string {
  if (!val) return 'Not configured';
  if (val.includes('@')) {
    const [local, domain] = val.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local.slice(0, 2)}***@${domain}`;
  }
  if (val.length <= 4) return '****';
  return `${val.slice(0, 2)}***${val.slice(-2)}`;
}

/**
 * Returns safe, masked configuration status for UI inspection.
 */
export function getPublicSmtpStatus(): PublicSmtpStatus {
  const config = getSmtpConfig();
  return {
    isConfigured: isSmtpConfigured(),
    host: config.host,
    port: config.port,
    secure: config.secure,
    userMasked: maskCredential(config.user),
    fromAddress: config.from,
    service: config.service,
  };
}

/**
 * Creates or retrieves a cached Nodemailer Transporter instance.
 */
export function getMailTransporter(): Transporter {
  const config = getSmtpConfig();
  const currentKey = `${config.host}:${config.port}:${config.secure}:${config.user}:${config.service || ''}`;

  if (cachedTransporter && lastTransporterKey === currentKey) {
    return cachedTransporter;
  }

  const transportOptions: any = {
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production' && process.env.SMTP_ALLOW_SELFSIGNED !== 'true',
    }
  };

  if (config.service) {
    transportOptions.service = config.service;
  }

  cachedTransporter = nodemailer.createTransport(transportOptions);
  lastTransporterKey = currentKey;
  return cachedTransporter;
}

/**
 * Verifies the connection and handshake with the SMTP server.
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; message: string }> {
  if (!isSmtpConfigured()) {
    return {
      success: false,
      message: 'SMTP credentials are not configured in environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS).'
    };
  }

  try {
    const transporter = getMailTransporter();
    await transporter.verify();
    return {
      success: true,
      message: `SMTP connection established successfully to ${getSmtpConfig().host}:${getSmtpConfig().port}`
    };
  } catch (error: any) {
    return {
      success: false,
      message: `SMTP connection verification failed: ${error.message}`
    };
  }
}
