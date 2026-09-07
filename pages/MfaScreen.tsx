import React, { useState, useRef, useEffect } from 'react';
import { useSystemSettings } from '../contexts/SettingsContext';
import { 
  ShieldCheck, 
  KeyRound, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  ArrowLeft,
  Smartphone,
  Lock,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { RateLimiter, generateTimedOTP, verifyTimedOTP } from '../utils/securityUtils';

interface MfaScreenProps {
  onVerify: () => void;
  onCancel?: () => void;
}

const BACKUP_RECOVERY_CODE = 'MASUMA-SEC-9842-RECV';

const MfaScreen: React.FC<MfaScreenProps> = ({ onVerify, onCancel }) => {
  const { settings } = useSystemSettings();
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showBackupCodeInput, setShowBackupCodeInput] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  
  // Rate limit
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [resendCooldown, setResendCooldown] = useState<number>(30);
  
  const [currentOtp, setCurrentOtp] = useState<string>('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const adminEmail = (settings.adminEmail || 'admin@masuma.co.ke').toLowerCase();

  // Initialize or load OTP
  useEffect(() => {
    const { code } = generateTimedOTP(adminEmail);
    setCurrentOtp(code);
  }, [adminEmail]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  const logSecurityEvent = (
    event: 'FAILED_LOGIN' | 'SUCCESSFUL_LOGIN' | 'IP_BLOCK_ALERT',
    details: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ) => {
    try {
      const stored = localStorage.getItem('masuma_security_audit_logs');
      const logs = stored ? JSON.parse(stored) : [];
      const newLog = {
        id: 'evt_' + Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        event,
        details,
        ipAddress: '197.248.31.98',
        location: 'Nairobi, Kenya',
        userAgent: navigator.userAgent || 'Mozilla/5.0 ERP Enclave',
        severity
      };
      localStorage.setItem('masuma_security_audit_logs', JSON.stringify([newLog, ...logs].slice(0, 100)));
    } catch {}
  };

  const handleDigitChange = (index: number, value: string) => {
    if (lockoutRemaining > 0) return;
    setError('');

    // Handle paste event of 6 digits
    if (value.length > 1) {
      const clean = value.replace(/\D/g, '').slice(0, 6);
      if (clean.length > 0) {
        const nextDigits = [...digits];
        for (let i = 0; i < clean.length; i++) {
          if (index + i < 6) {
            nextDigits[index + i] = clean[i];
          }
        }
        setDigits(nextDigits);
        const nextFocus = Math.min(index + clean.length, 5);
        inputRefs.current[nextFocus]?.focus();
      }
      return;
    }

    const cleanChar = value.replace(/\D/g, '');
    const nextDigits = [...digits];
    nextDigits[index] = cleanChar;
    setDigits(nextDigits);

    // Auto advance focus to next input
    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    const { code } = generateTimedOTP(adminEmail);
    setCurrentOtp(code);
    setResendCooldown(45);
    setDigits(['', '', '', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const rateKey = `mfa_${adminEmail}`;
    const rateCheck = RateLimiter.check(rateKey, 5, 60);
    if (rateCheck.isBlocked) {
      setLockoutRemaining(rateCheck.remainingSeconds);
      setError(`Terminal locked for ${rateCheck.remainingSeconds}s due to consecutive invalid MFA tokens.`);
      logSecurityEvent(
        'IP_BLOCK_ALERT',
        `MFA brute force lock engaged: 5 failed attempts against session token`,
        'critical'
      );
      return;
    }

    if (showBackupCodeInput) {
      if (backupCode.trim().toUpperCase() === BACKUP_RECOVERY_CODE) {
        RateLimiter.reset(rateKey);
        logSecurityEvent(
          'SUCCESSFUL_LOGIN',
          `MFA bypassed via emergency cryptographic master recovery key for ${adminEmail}`,
          'medium'
        );
        onVerify();
      } else {
        const failure = RateLimiter.recordFailure(rateKey, 5, 60);
        if (failure.isBlocked) {
          setLockoutRemaining(failure.remainingSeconds);
          setError(`MFA locked for ${failure.remainingSeconds}s.`);
        } else {
          setError(`Invalid emergency recovery key. (${5 - failure.attempts} attempts left)`);
        }
        logSecurityEvent(
          'FAILED_LOGIN',
          `Invalid MFA emergency recovery key supplied for ${adminEmail}`,
          'high'
        );
      }
      return;
    }

    const code = digits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 verification digits.');
      return;
    }

    setIsVerifying(true);

    setTimeout(() => {
      // Validate code against timed OTP or current simulation OTP
      const verifyResult = verifyTimedOTP(adminEmail, code);
      const isMatch = verifyResult.valid || code === currentOtp;

      if (isMatch) {
        RateLimiter.reset(rateKey);
        logSecurityEvent(
          'SUCCESSFUL_LOGIN',
          `MFA 2-Factor step authenticated successfully for ${adminEmail}`,
          'low'
        );
        setIsVerifying(false);
        onVerify();
      } else {
        const failure = RateLimiter.recordFailure(rateKey, 5, 60);
        setIsVerifying(false);
        if (failure.isBlocked) {
          setLockoutRemaining(failure.remainingSeconds);
          setError(`MFA locked for ${failure.remainingSeconds}s due to failed attempts.`);
        } else {
          setError(`Invalid 6-digit verification code. (${5 - failure.attempts} attempts left before lockout)`);
        }
        logSecurityEvent(
          'FAILED_LOGIN',
          `Invalid MFA code entered for ${adminEmail}`,
          'high'
        );
      }
    }, 400);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-gray-950 font-sans p-4 relative overflow-hidden transition-colors duration-300">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-brand-orange/5 rounded-full filter blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full filter blur-3xl translate-y-1/3 translate-x-1/3"></div>

      <div className="w-full max-w-md p-5 sm:p-8 bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl relative z-10 mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-orange/10 text-brand-orange mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-gray-50 uppercase tracking-tight">
            Two-Factor Authentication
          </h1>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-gray-400">
            {showBackupCodeInput 
              ? 'Enter your emergency master recovery bypass key.' 
              : `Enter the 6-digit security PIN sent to your authenticator.`}
          </p>
        </div>

        <form onSubmit={handleMfaSubmit} className="space-y-6">
          {!showBackupCodeInput ? (
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 block text-center mb-3">
                Security PIN Code
              </label>
              <div className="flex justify-center gap-2.5">
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    disabled={lockoutRemaining > 0}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-12 h-14 text-center text-2xl font-black rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-all disabled:opacity-50"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                Emergency Recovery Key
              </label>
              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                placeholder="e.g. MASUMA-SEC-9842-RECV"
                className="w-full px-4 py-3 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800 rounded-xl font-mono text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Demo Master Key: <code className="font-mono font-bold text-brand-orange">MASUMA-SEC-9842-RECV</code>
              </p>
            </div>
          )}

          {/* Rate limit or error */}
          {lockoutRemaining > 0 ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs rounded-xl font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>MFA locked for <strong className="font-mono">{lockoutRemaining}s</strong></span>
            </div>
          ) : error ? (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isVerifying || lockoutRemaining > 0}
            className="w-full py-3 px-4 rounded-xl shadow-lg shadow-brand-orange/20 text-xs font-black uppercase tracking-wider text-white bg-brand-orange hover:bg-orange-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Authenticating Enclave...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Authorize Session</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-xs pt-2">
            {!showBackupCodeInput ? (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className="text-slate-500 hover:text-brand-orange dark:text-slate-400 font-semibold disabled:opacity-50 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowBackupCodeInput(false)}
                className="text-slate-500 hover:text-brand-orange dark:text-slate-400 font-semibold cursor-pointer"
              >
                Use 6-Digit PIN
              </button>
            )}

            {!showBackupCodeInput && (
              <button
                type="button"
                onClick={() => setShowBackupCodeInput(true)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[11px] underline cursor-pointer"
              >
                Lost Authenticator?
              </button>
            )}
          </div>
        </form>

        {onCancel && (
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={onCancel}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-semibold flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cancel and return to Login</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MfaScreen;
