import { getMailTransporter, getSmtpConfig, isSmtpConfigured, maskCredential } from './emailConfig';

/**
 * Masuma ERP - Production Email Utility Service
 * 
 * Provides production-grade email delivery for:
 * 1. Authentication one-time verification codes (OTP)
 * 2. Password recovery authorizations
 * 3. Security alert dispatches and audit notifications
 */

export interface SendVerificationOptions {
  userName?: string;
  expiryMinutes?: number;
  ipAddress?: string;
  actionName?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  message: string;
  messageId?: string;
  timestamp: string;
  recipientMasked: string;
  simulated?: boolean;
}

/**
 * Generates the responsive HTML email template for one-time verification codes.
 */
function buildVerificationHtmlTemplate(params: {
  otpCode: string;
  userName?: string;
  expiryMinutes: number;
  ipAddress?: string;
  actionName: string;
}): string {
  const { otpCode, userName, expiryMinutes, ipAddress, actionName } = params;
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Masuma ERP Security Verification Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }
    .email-wrapper {
      width: 100%;
      background-color: #0f172a;
      padding: 40px 16px;
    }
    .email-card {
      max-width: 520px;
      margin: 0 auto;
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .card-header {
      background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
      padding: 28px 24px;
      text-align: center;
    }
    .brand-title {
      margin: 0;
      color: #ffffff;
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .brand-subtitle {
      margin: 6px 0 0 0;
      color: rgba(255, 255, 255, 0.85);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .card-body {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 15px;
      font-weight: 600;
      color: #f8fafc;
      margin: 0 0 12px 0;
    }
    .instruction {
      font-size: 13px;
      line-height: 1.6;
      color: #94a3b8;
      margin: 0 0 24px 0;
    }
    .code-container {
      background-color: #090d16;
      border: 1.5px solid #ea580c;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin: 0 0 24px 0;
    }
    .code-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #94a3b8;
      margin-bottom: 8px;
      font-weight: 700;
    }
    .otp-code {
      font-family: 'SF Mono', Monaco, Menlo, Consolas, monospace;
      font-size: 34px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #f97316;
      margin: 0;
    }
    .expiry-note {
      font-size: 11px;
      color: #cbd5e1;
      margin-top: 8px;
      font-weight: 500;
    }
    .security-notice {
      background-color: #111827;
      border-left: 3px solid #f59e0b;
      padding: 12px 14px;
      border-radius: 6px;
      font-size: 11px;
      color: #cbd5e1;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .meta-box {
      border-top: 1px solid #334155;
      padding-top: 16px;
      font-size: 10.5px;
      color: #64748b;
      line-height: 1.6;
    }
    .card-footer {
      background-color: #0b1120;
      border-top: 1px solid #1e293b;
      padding: 18px 24px;
      text-align: center;
      font-size: 10.5px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-card">
      <div class="card-header">
        <h1 class="brand-title">MASUMA AUTO PARTS</h1>
        <p class="brand-subtitle">Enterprise ERP • Security Authentication Service</p>
      </div>
      <div class="card-body">
        <p class="greeting">Hello ${userName ? userName : 'Authorized User'},</p>
        <p class="instruction">
          A request was initiated to perform <strong>${actionName}</strong> for your Masuma ERP terminal account. Use the one-time verification code below to authorize this session:
        </p>
        
        <div class="code-container">
          <div class="code-label">Verification Code</div>
          <div class="otp-code">${otpCode}</div>
          <div class="expiry-note">Valid for the next ${expiryMinutes} minutes</div>
        </div>

        <div class="security-notice">
          <strong>Security Notice:</strong> Never share this code with anyone. Masuma technical personnel will never ask for your verification code. If you did not initiate this request, please change your password immediately.
        </div>

        <div class="meta-box">
          <div><strong>Request Timestamp:</strong> ${new Date().toUTCString()}</div>
          ${ipAddress ? `<div><strong>Originating IP / Client:</strong> ${ipAddress}</div>` : ''}
          <div><strong>Security Protocol:</strong> AES-256 / SHA-256 Time-Bound OTP</div>
        </div>
      </div>
      <div class="card-footer">
        &copy; ${currentYear} Masuma Auto Parts East Africa Ltd. Commercial St, Industrial Area, Nairobi.<br>
        Automated transactional notification • Please do not reply directly to this message.
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Utility function to send verification codes to user emails for production authentication,
 * replacing console or on-screen mock-ups.
 *
 * @param toEmail The recipient's email address
 * @param otpCode The 6-digit verification code
 * @param options Additional delivery context (name, expiry, ipAddress, actionName)
 */
export async function sendVerificationCodeEmail(
  toEmail: string,
  otpCode: string,
  options?: SendVerificationOptions
): Promise<EmailDispatchResult> {
  const cleanEmail = toEmail.trim().toLowerCase();
  const masked = maskCredential(cleanEmail);
  const expiryMinutes = options?.expiryMinutes || 5;
  const actionName = options?.actionName || 'Password Recovery Verification';
  const userName = options?.userName || '';
  const ipAddress = options?.ipAddress || '';

  const timestamp = new Date().toISOString();
  const subject = `[Masuma ERP] ${otpCode} is your verification code`;

  const htmlContent = buildVerificationHtmlTemplate({
    otpCode,
    userName,
    expiryMinutes,
    ipAddress,
    actionName
  });

  const textContent = `
MASUMA AUTO PARTS ERP - SECURITY VERIFICATION
============================================

Hello ${userName || 'Authorized User'},

Your one-time verification code for ${actionName} is:

  >>  ${otpCode}  <<

This code will expire in ${expiryMinutes} minutes.

SECURITY ADVISORY:
Never disclose this code to anyone. Masuma IT administrators will never request this verification PIN.
If you did not request this verification, please inspect your account immediately.

Timestamp: ${timestamp}
Masuma Auto Parts East Africa Ltd - Enterprise Systems
  `.trim();

  // If SMTP is properly configured with credentials, dispatch via real SMTP transport
  if (isSmtpConfigured()) {
    try {
      const transporter = getMailTransporter();
      const config = getSmtpConfig();

      const mailOptions: any = {
        from: {
          name: config.fromName || 'Masuma EA Ltd',
          address: config.fromAddress || config.user
        },
        to: cleanEmail,
        subject: subject,
        text: textContent,
        html: htmlContent,
      };

      if (config.replyTo) {
        mailOptions.replyTo = config.replyTo;
      }

      // Enforce envelope sender matching authenticated user to prevent SMTP 553 sender rejection
      if (config.user && config.user.includes('@')) {
        mailOptions.envelope = {
          from: config.user,
          to: cleanEmail
        };
      }

      const info = await transporter.sendMail(mailOptions);

      console.log(`[Email Service] Production verification code successfully dispatched to ${masked} (MessageID: ${info.messageId})`);

      return {
        success: true,
        message: `Verification code successfully dispatched to ${masked}.`,
        messageId: info.messageId,
        timestamp,
        recipientMasked: masked,
        simulated: false
      };
    } catch (err: any) {
      console.error(`[Email Service] Failed to send email via SMTP to ${masked}:`, err.message);
      
      // Fallback diagnostics: log clearly so the operator can inspect why SMTP failed
      return {
        success: false,
        message: `Failed to deliver verification code via SMTP: ${err.message}`,
        timestamp,
        recipientMasked: masked,
        simulated: false
      };
    }
  } else {
    // SMTP credentials not yet provided in .env
    console.warn(`[Email Service] SMTP is not configured. (Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env).`);
    console.log(`[Email Service] [STANDBY SECURITY AUDIT] Dispatched verification code for ${masked}: Code [${otpCode}] (Expires in ${expiryMinutes}m)`);

    return {
      success: true,
      message: `Verification code generated for ${masked}. (SMTP gateway is in standby mode. Configure SMTP_USER and SMTP_PASS in environment to deliver to external inbox).`,
      timestamp,
      recipientMasked: masked,
      simulated: true
    };
  }
}

/**
 * Utility function to send a test handshake email confirming SMTP configuration is operational.
 */
export async function sendTestEmail(toEmail: string): Promise<EmailDispatchResult> {
  const cleanEmail = toEmail.trim().toLowerCase();
  const masked = maskCredential(cleanEmail);
  const timestamp = new Date().toISOString();

  if (!isSmtpConfigured()) {
    return {
      success: false,
      message: 'Cannot send test email: SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) are not configured.',
      timestamp,
      recipientMasked: masked,
      simulated: false
    };
  }

  try {
    const transporter = getMailTransporter();
    const config = getSmtpConfig();

    const mailOptions: any = {
      from: {
        name: config.fromName || 'Masuma EA Ltd',
        address: config.fromAddress || config.user
      },
      to: cleanEmail,
      subject: '[Masuma ERP] SMTP Gateway Connection Test',
      text: `Masuma ERP SMTP Gateway Connection Test\n\nThis confirms that the Masuma ERP server can successfully connect to your SMTP server (${config.host}:${config.port}) and dispatch transactional emails.\n\nTimestamp: ${timestamp}`,
      html: `
        <div style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #ea580c; margin-top: 0;">Masuma ERP Gateway Test</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
            This email confirms that your production SMTP server (<strong>${config.host}:${config.port}</strong>) is properly connected and successfully delivering transactional messages.
          </p>
          <div style="background: #1e293b; padding: 12px 16px; border-radius: 8px; font-family: monospace; font-size: 12px; color: #38bdf8;">
            Status: 250 OK • Verified at ${timestamp}
          </div>
        </div>
      `
    };

    if (config.replyTo) {
      mailOptions.replyTo = config.replyTo;
    }

    if (config.user && config.user.includes('@')) {
      mailOptions.envelope = {
        from: config.user,
        to: cleanEmail
      };
    }

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: `Test email successfully dispatched to ${masked}. Check your inbox!`,
      messageId: info.messageId,
      timestamp,
      recipientMasked: masked,
      simulated: false
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Test email failed: ${err.message}`,
      timestamp,
      recipientMasked: masked,
      simulated: false
    };
  }
}
