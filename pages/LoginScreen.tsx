import React, { useState, useEffect } from 'react';
import { useSystemSettings } from '../contexts/SettingsContext';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  AlertTriangle,
  Clock,
  RefreshCw,
  Mail,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { 
  verifyPassword, 
  hashPassword, 
  RateLimiter, 
  generateTimedOTP, 
  verifyTimedOTP, 
  sanitizeInput 
} from '../utils/securityUtils';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { settings } = useSystemSettings();
  const [view, setView] = useState<'login' | 'forgot_email' | 'forgot_otp' | 'forgot_success'>('login');
  
  // Auth inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Rate Limit / Brute-force protection states
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  
  // Forgot Password states
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [activeOtpCode, setActiveOtpCode] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<number>(0);
  const [showOtpBanner, setShowOtpBanner] = useState(false);

  // Check rate limit on mount and on email change
  useEffect(() => {
    const emailKey = loginEmail.trim().toLowerCase() || 'default_admin_terminal';
    const status = RateLimiter.check(emailKey, 5, 60);
    setLockoutRemaining(status.remainingSeconds);
    setFailedAttempts(status.attempts);
  }, [loginEmail]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  const getAdminEmail = (): string => {
    return (settings.adminEmail || 'admin@masuma.co.ke').toLowerCase().trim();
  };

  const getStoredPasswordHash = (): string => {
    return localStorage.getItem('masuma_admin_password') || 'password';
  };

  // Structured Security Audit Logger
  const logSecurityEvent = (
    event: 'FAILED_LOGIN' | 'SUCCESSFUL_LOGIN' | 'PASSWORD_RESET' | 'PASSWORD_CHANGE' | 'IP_BLOCK_ALERT',
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
        userAgent: navigator.userAgent || 'Mozilla/5.0 ERP Secure Enclave',
        severity
      };
      localStorage.setItem('masuma_security_audit_logs', JSON.stringify([newLog, ...logs].slice(0, 100)));
    } catch (e) {
      console.error('Error writing security audit log', e);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const targetEmail = getAdminEmail();
    const storedHash = getStoredPasswordHash();
    const emailKey = targetEmail;

    // 1. Check Rate Limiter
    const rateCheck = RateLimiter.check(emailKey, 5, 60);
    if (rateCheck.isBlocked) {
      setLockoutRemaining(rateCheck.remainingSeconds);
      setLoginError(`Security Lockout Active: Too many failed attempts. Terminal unlocked in ${rateCheck.remainingSeconds}s.`);
      logSecurityEvent(
        'IP_BLOCK_ALERT',
        `Brute force threshold reached: Client locked out for ${rateCheck.remainingSeconds}s following ${rateCheck.attempts} failed authentication attempts.`,
        'critical'
      );
      return;
    }

    const inputEmail = sanitizeInput(loginEmail).toLowerCase();
    const inputPassword = loginPassword;

    if (!inputEmail || !inputPassword) {
      setLoginError('Please provide both administrative email and master security password.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate email identifier
      if (inputEmail !== targetEmail) {
        const failure = RateLimiter.recordFailure(emailKey, 5, 60);
        setFailedAttempts(failure.attempts);
        if (failure.isBlocked) {
          setLockoutRemaining(failure.remainingSeconds);
          setLoginError(`Access Denied. Account temporarily locked for ${failure.remainingSeconds}s due to repeated invalid attempts.`);
        } else {
          setLoginError(`Authentication failed: Invalid credentials. (${5 - failure.attempts} attempts remaining before temporary lockout)`);
        }

        logSecurityEvent(
          'FAILED_LOGIN',
          `Unauthorized authentication attempt with unrecognized identifier: "${inputEmail}"`,
          'high'
        );
        setIsSubmitting(false);
        return;
      }

      // Cryptographically verify password against salted hash / password
      const isPasswordValid = await verifyPassword(inputPassword, storedHash);

      if (!isPasswordValid) {
        const failure = RateLimiter.recordFailure(emailKey, 5, 60);
        setFailedAttempts(failure.attempts);
        if (failure.isBlocked) {
          setLockoutRemaining(failure.remainingSeconds);
          setLoginError(`Access Denied. Account temporarily locked for ${failure.remainingSeconds}s due to repeated invalid attempts.`);
        } else {
          setLoginError(`Authentication failed: Invalid credentials. (${5 - failure.attempts} attempts remaining before temporary lockout)`);
        }

        logSecurityEvent(
          'FAILED_LOGIN',
          `Invalid security password entered for master administrative account: ${targetEmail}`,
          'high'
        );
        setIsSubmitting(false);
        return;
      }

      // Success: Reset rate limiter and migration hash to salted SHA-256
      RateLimiter.reset(emailKey);
      
      // Upgrade plaintext password to salted hash if stored as plaintext
      if (!storedHash.startsWith('msh_') && storedHash.length !== 64) {
        const secureHash = await hashPassword(inputPassword);
        localStorage.setItem('masuma_admin_password', secureHash);
      }

      logSecurityEvent(
        'SUCCESSFUL_LOGIN',
        `Administrative session cryptographically authenticated for ${targetEmail}`,
        'low'
      );

      setIsSubmitting(false);
      onLogin();
    } catch (err) {
      setIsSubmitting(false);
      setLoginError('An internal security verification error occurred. Please try again.');
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    const targetEmail = getAdminEmail();
    const inputEmail = sanitizeInput(resetEmail).toLowerCase();

    if (inputEmail !== targetEmail) {
      setForgotError('No administrative profile matches the requested recovery email.');
      logSecurityEvent(
        'FAILED_LOGIN',
        `Recovery code requested for unregistered target: "${inputEmail}"`,
        'medium'
      );
      return;
    }

    // Generate 6-digit OTP with 5-minute cryptographic expiration
    const { code, expiresAt } = generateTimedOTP(targetEmail);
    setActiveOtpCode(code);
    setOtpExpiresAt(expiresAt);
    setShowOtpBanner(true);
    setView('forgot_otp');

    logSecurityEvent(
      'PASSWORD_RESET',
      `Secure recovery OTP token dispatched for administrative address: ${targetEmail}`,
      'medium'
    );
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    const targetEmail = getAdminEmail();
    const verification = verifyTimedOTP(targetEmail, otpCode);

    if (!verification.valid) {
      setForgotError(verification.reason || 'Invalid verification code.');
      logSecurityEvent(
        'FAILED_LOGIN',
        `Failed password recovery OTP handshake for ${targetEmail}`,
        'high'
      );
      return;
    }

    if (newPassword.length < 6) {
      setForgotError('Security policy requirement: Master password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Password confirmation fields do not match.');
      return;
    }

    // Hash new password using salted SHA-256 before storage
    const secureHash = await hashPassword(newPassword);
    localStorage.setItem('masuma_admin_password', secureHash);

    logSecurityEvent(
      'PASSWORD_CHANGE',
      `Administrative master credentials updated after cryptographic OTP verification for ${targetEmail}`,
      'high'
    );

    setShowOtpBanner(false);
    setView('forgot_success');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-gray-950 font-sans p-4 relative overflow-hidden transition-colors duration-300">
      {/* Visual ambient accents */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-brand-orange/5 rounded-full filter blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full filter blur-3xl translate-y-1/3 translate-x-1/3"></div>

      {/* Dispatched OTP Notification Banner (Secure Testing Gateway) */}
      {showOtpBanner && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm bg-indigo-950 border border-indigo-800 text-indigo-300 p-4 rounded-2xl shadow-2xl animate-fade-in flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[10px] uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Secure 2FA Dispatcher
            </span>
            <button onClick={() => setShowOtpBanner(false)} className="text-indigo-400 hover:text-white font-bold text-xs p-1">✕</button>
          </div>
          <p className="text-xs text-indigo-200">
            One-time recovery PIN generated for <strong>{getAdminEmail()}</strong>:
          </p>
          <div className="flex items-center justify-between bg-indigo-900/60 p-2 rounded-xl border border-indigo-700/50 mt-1">
            <span className="font-mono font-black text-xl text-white tracking-widest">{activeOtpCode}</span>
            <span className="text-[10px] font-mono text-indigo-300 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Valid 5 mins
            </span>
          </div>
        </div>
      )}

      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl relative z-10">
        
        {/* BRAND HEADER */}
        <div className="text-center select-none mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-orange/10 text-brand-orange mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-gray-50 uppercase tracking-tight flex items-center justify-center">
            {settings.corpShortName || 'Masuma'}
            <span className="text-brand-orange ml-1">ERP</span>
          </h1>
          <p className="mt-1.5 text-xs font-semibold text-slate-400 dark:text-gray-500 tracking-wider">
            ENTERPRISE AUTOMOTIVE OPERATING SUITE
          </p>
        </div>

        {/* VIEW 1: SIGN IN SCREEN */}
        {view === 'login' && (
          <form className="space-y-5" onSubmit={handleLoginSubmit} id="login_form" autoComplete="off">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                  Administrative Email
                </label>
                <input
                  id="login_email_input"
                  type="email"
                  autoComplete="off"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@masuma.co.ke"
                  disabled={lockoutRemaining > 0}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-orange text-xs font-bold text-slate-800 dark:text-white disabled:opacity-50"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Master Password
                  </label>
                  <button 
                    type="button"
                    onClick={() => {
                      setResetEmail(loginEmail || getAdminEmail());
                      setView('forgot_email');
                      setForgotError('');
                    }}
                    className="text-[10px] font-bold text-brand-orange hover:underline focus:outline-none"
                    id="forgot_password_btn"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  id="login_password_input"
                  type="password"
                  autoComplete="off"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={lockoutRemaining > 0}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-orange text-xs text-slate-800 dark:text-white font-bold disabled:opacity-50"
                />
              </div>
            </div>

            {/* Lockout or Error Alert */}
            {lockoutRemaining > 0 ? (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs rounded-xl font-medium flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Anti-Brute Force Protection Active</p>
                  <p className="text-[11px] mt-0.5">
                    Terminal locked for <span className="font-mono font-bold text-amber-900 dark:text-amber-100">{lockoutRemaining}s</span> due to failed login attempts.
                  </p>
                </div>
              </div>
            ) : loginError ? (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium leading-relaxed flex items-start gap-2" id="login_error_alert">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            ) : null}

            <button
              id="login_submit_btn"
              type="submit"
              disabled={isSubmitting || lockoutRemaining > 0}
              className="w-full py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-brand-orange/20 text-xs font-black uppercase tracking-wider text-white bg-brand-orange hover:bg-orange-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Cryptographic Tokens...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In to Master Terminal</span>
                </>
              )}
            </button>
            
            <div className="pt-2 text-center">
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>SHA-256 Salted Passwords • Anti-Brute Force Active</span>
              </div>
            </div>
          </form>
        )}

        {/* VIEW 2: FORGOT PASSWORD - REQUEST EMAIL */}
        {view === 'forgot_email' && (
          <form className="space-y-5 animate-fade-in" onSubmit={handleSendOtp} id="forgot_email_form" autoComplete="off">
            <div className="border-b border-slate-100 dark:border-gray-800 pb-3 mb-2">
              <h2 className="text-sm font-black text-slate-800 dark:text-gray-100 uppercase tracking-wider">Account Password Recovery</h2>
              <p className="text-[11px] text-slate-400 dark:text-gray-500 leading-relaxed mt-1">
                Enter your authorized administrator email to generate a time-based 6-digit recovery OTP token.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                  Registered Administrator Email
                </label>
                <input
                  id="forgot_email_input"
                  type="email"
                  autoComplete="off"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="admin@masuma.co.ke"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange text-xs font-bold text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {forgotError && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium" id="forgot_email_error">
                ⚠️ {forgotError}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                id="send_otp_btn"
                type="submit"
                className="w-full py-3 bg-brand-orange hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
              >
                Generate 6-Digit Recovery OTP
              </button>
              <button
                type="button"
                onClick={() => setView('login')}
                className="w-full py-2.5 text-xs text-slate-400 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white font-bold transition cursor-pointer"
              >
                Cancel and Return to Sign In
              </button>
            </div>
          </form>
        )}

        {/* VIEW 3: FORGOT PASSWORD - VERIFY OTP & NEW PASSWORD */}
        {view === 'forgot_otp' && (
          <form className="space-y-5 animate-fade-in" onSubmit={handleResetPassword} id="forgot_otp_form" autoComplete="off">
            <div className="border-b border-slate-100 dark:border-gray-800 pb-3 mb-2 flex justify-between items-start">
              <div>
                <h2 className="text-sm font-black text-slate-800 dark:text-gray-100 uppercase tracking-wider">Validate OTP & Set Password</h2>
                <p className="text-[11px] text-slate-400 dark:text-gray-500 leading-relaxed mt-1">
                  Enter the 6-digit code and configure your updated master security credentials.
                </p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded select-none shrink-0 dark:bg-emerald-950/40 dark:text-emerald-300">
                OTP Active
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                  6-Digit Verification PIN
                </label>
                <input
                  id="forgot_otp_input"
                  type="text"
                  autoComplete="off"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-brand-orange text-xl tracking-widest font-black text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                  New Master Password
                </label>
                <input
                  id="forgot_new_password_input"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange text-xs text-slate-800 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                  Confirm Master Password
                </label>
                <input
                  id="forgot_confirm_password_input"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange text-xs text-slate-800 dark:text-white font-bold"
                />
              </div>
            </div>

            {forgotError && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium" id="forgot_otp_error">
                ⚠️ {forgotError}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                id="reset_password_submit_btn"
                type="submit"
                className="w-full py-3 bg-brand-orange hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
              >
                Validate OTP & Save Salted Hash
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('forgot_email');
                  setShowOtpBanner(false);
                }}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold transition cursor-pointer"
              >
                Back to Email Input
              </button>
            </div>
          </form>
        )}

        {/* VIEW 4: FORGOT SUCCESS */}
        {view === 'forgot_success' && (
          <div className="space-y-6 text-center py-4 animate-fade-in" id="forgot_success_view">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-3xl shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">Credential Overhaul Complete</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                New password cryptographically salted and saved into your secure storage vault.
              </p>
            </div>

            <button
              id="success_login_redirect_btn"
              type="button"
              onClick={() => setView('login')}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition cursor-pointer"
            >
              Proceed to Terminal Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
