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
 * Retrieves the active SMTP configuration from environment variables or runtime overrides.
 */
export function getSmtpConfig(): SmtpConfig {
  const envHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const envPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const envSecure = process.env.SMTP_SECURE === 'true' || envPort === 465;
  const envUser = process.env.SMTP_USER || '';
  const envPass = process.env.SMTP_PASS || '';
  const envFrom = process.env.EMAIL_FROM || (envUser ? `"Masuma ERP Security" <${envUser}>` : '"Masuma ERP Security" <noreply@masuma.co.ke>');
  const envService = process.env.SMTP_SERVICE || undefined;

  const baseConfig: SmtpConfig = {
    host: envHost,
    port: envPort,
    secure: envSecure,
    user: envUser,
    pass: envPass,
    from: envFrom,
    service: envService
  };

  if (!runtimeConfigOverride) {
    return baseConfig;
  }

  return {
    ...baseConfig,
    ...runtimeConfigOverride,
    port: runtimeConfigOverride.port !== undefined ? Number(runtimeConfigOverride.port) : baseConfig.port,
    secure: runtimeConfigOverride.secure !== undefined ? Boolean(runtimeConfigOverride.secure) : baseConfig.secure,
  };
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
