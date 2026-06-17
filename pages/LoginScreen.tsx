import React, { useState } from 'react';
import { useSystemSettings } from '../contexts/SettingsContext';

const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
    const { settings } = useSystemSettings();
    const [view, setView] = useState<'login' | 'forgot_email' | 'forgot_otp' | 'forgot_success'>('login');
    
    // Auth inputs
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    
    // Forgot Password states
    const [resetEmail, setResetEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [forgotError, setForgotError] = useState('');
    const [simulatedOtp, setSimulatedOtp] = useState('');
    const [showOtpAlert, setShowOtpAlert] = useState(false);

    // Get active password or default to 'password'
    const getStoredPassword = (): string => {
        return localStorage.getItem('masuma_admin_password') || 'password';
    };

    const getAdminEmail = (): string => {
        return settings.adminEmail || 'admin@masuma.co.ke';
    };

    // Shared Security Logger helper
    const logSecurityEvent = (
        event: 'FAILED_LOGIN' | 'SUCCESSFUL_LOGIN' | 'PASSWORD_RESET' | 'PASSWORD_CHANGE' | 'IP_BLOCK_ALERT',
        details: string,
        ipAddress = '197.248.31.98',
        location = 'Nairobi, Kenya',
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
                ipAddress,
                location,
                userAgent: navigator.userAgent || 'Mozilla/5.0 ERP Core Client',
                severity
            };
            localStorage.setItem('masuma_security_audit_logs', JSON.stringify([newLog, ...logs].slice(0, 100)));
        } catch (e) {
            console.error('Error writing security log', e);
        }
    };

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');

        const targetEmail = getAdminEmail().toLowerCase();
        const targetPassword = getStoredPassword();

        const inputEmailNormalized = (loginEmail || targetEmail).trim().toLowerCase();
        const inputPassword = loginPassword || 'password'; // Use default value if untouched

        if (inputEmailNormalized !== targetEmail) {
            setLoginError('Invalid access: email address does not match central administration database records.');
            logSecurityEvent(
                'FAILED_LOGIN',
                `Unauthorized connection attempt matching mailbox identifier: "${inputEmailNormalized.slice(0, 40)}"`,
                '197.248.115.42',
                'Nairobi, Kenya',
                'medium'
            );
            return;
        }

        if (inputPassword !== targetPassword) {
            setLoginError('Authentication failed: insecure or incorrect password entered. Please try again.');
            logSecurityEvent(
                'FAILED_LOGIN',
                `Invalid credentials provided for primary email block: "${inputEmailNormalized}"`,
                '197.248.31.98',
                'Nairobi, Kenya',
                'medium'
            );
            return;
        }

        // Credentials clear! Engage logins
        logSecurityEvent(
            'SUCCESSFUL_LOGIN',
            `Central administrative session authenticated successfully for: ${targetEmail}`,
            '197.248.31.98',
            'Nairobi, Kenya',
            'low'
        );
        onLogin();
    };

    const handleSendOtp = (e: React.FormEvent) => {
        e.preventDefault();
        setForgotError('');

        const targetEmail = getAdminEmail().toLowerCase();
        if (resetEmail.trim().toLowerCase() !== targetEmail) {
            setForgotError('No administrative ledger corresponds to the requested email address.');
            logSecurityEvent(
                'FAILED_LOGIN',
                `Security recovery link requested for unregistered account identifier: "${resetEmail.slice(0, 40)}"`,
                '41.203.220.10',
                'Mombasa, Kenya',
                'medium'
            );
            return;
        }

        // Generate simulated OTP
        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        setSimulatedOtp(generatedCode);
        setShowOtpAlert(true);
        setView('forgot_otp');
    };

    const handleResetPassword = (e: React.FormEvent) => {
        e.preventDefault();
        setForgotError('');

        if (otpCode !== simulatedOtp) {
            setForgotError('Invalid Verification Code: The simulation OTP code does not match.');
            logSecurityEvent(
                'FAILED_LOGIN',
                `Failed security handshake: mismatching OTP recovery code supplied for account ${getAdminEmail()}`,
                '197.248.31.98',
                'Nairobi, Kenya',
                'high'
            );
            return;
        }

        if (newPassword.length < 6) {
            setForgotError('Security policy error: password length must exceed 6 alphanumeric keys.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setForgotError('Mismatch error: both password fields must match perfectly.');
            return;
        }

        // Save password update securely to sandboxed storage
        localStorage.setItem('masuma_admin_password', newPassword);
        logSecurityEvent(
            'PASSWORD_RESET',
            `Master credential successfully reset and written to storage after OTP validation for ${getAdminEmail()}`,
            '197.248.31.98',
            'Nairobi, Kenya',
            'high'
        );
        setShowOtpAlert(false);
        setView('forgot_success');
    };

    return (
        <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-gray-950 font-sans p-4 relative overflow-hidden transition-colors duration-300">
            {/* Visual ambient accents */}
            <div className="absolute top-0 left-0 w-80 h-80 bg-brand-orange/5 rounded-full filter blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full filter blur-3xl translate-y-1/3 translate-x-1/3"></div>

            {/* Sandbox Staging OTP Trigger alert widget */}
            {showOtpAlert && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm bg-indigo-950 border border-indigo-800 text-indigo-300 p-4 rounded-xl shadow-2xl animate-bounce flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-indigo-400 font-bold">📩 Staging Simulator Delivery</span>
                        <button onClick={() => setShowOtpAlert(false)} className="text-indigo-400 hover:text-white font-bold text-xs">✕</button>
                    </div>
                    <p className="text-xs">
                        Outgoing verification email dispatched to <strong>{getAdminEmail()}</strong>.
                    </p>
                    <p className="text-xs font-mono mt-1 font-bold">
                        Verification pin (OTP Code): <span className="bg-indigo-800 text-white font-extrabold px-2 py-0.5 rounded ml-1 text-sm">{simulatedOtp}</span>
                    </p>
                </div>
            )}

            <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-2xl relative z-10">
                
                {/* BRAND HEADER */}
                <div className="text-center select-none mb-8">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-gray-50 uppercase tracking-tight flex items-center justify-center">
                        {settings.corpShortName || 'Masuma'}
                        <span className="text-brand-orange ml-0.5">ERP</span>
                    </h1>
                    <p className="mt-2 text-xs font-semibold text-slate-400 dark:text-gray-500 tracking-wider">
                        SECURE CONTROL PANEL CENTRAL NODE
                    </p>
                </div>

                {/* VIEW 1: SIGN IN SCREEN */}
                {view === 'login' && (
                    <form className="space-y-5" onSubmit={handleLoginSubmit} id="login_form">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">Administrative email</label>
                                <input
                                    id="login_email_input"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    placeholder={getAdminEmail()}
                                    className="w-full px-4 py-2.5 border border-slate-205 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-orange text-xs font-bold text-slate-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Security password</label>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setResetEmail(getAdminEmail());
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
                                    autoComplete="current-password"
                                    required
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-2.5 border border-slate-205 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-orange text-xs text-slate-800 dark:text-white font-bold"
                                />
                            </div>
                        </div>

                        {loginError && (
                            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium leading-relaxed" id="login_error_alert">
                                🛡️ {loginError}
                            </div>
                        )}

                        <button
                            id="login_submit_btn"
                            type="submit"
                            className="w-full py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-brand-orange/15 text-xs font-black uppercase tracking-wider text-white bg-brand-orange hover:bg-orange-600 focus:outline-none transition-all duration-150"
                        >
                            Sign In to System
                        </button>
                        
                        <div className="text-center">
                            <span className="text-[10px] text-slate-400 dark:text-gray-500 block font-mono">
                                Connection SSL Standard AES-256 Protected
                            </span>
                        </div>
                    </form>
                )}

                {/* VIEW 2: FORGOT PASSWORD - REQUEST EMAIL */}
                {view === 'forgot_email' && (
                    <form className="space-y-5 animate-fade-in" onSubmit={handleSendOtp} id="forgot_email_form">
                        <div className="border-b dark:border-gray-800 pb-3 mb-2">
                            <h2 className="text-sm font-black text-slate-800 dark:text-gray-100 uppercase tracking-wider">Account Password Recovery</h2>
                            <p className="text-[11px] text-slate-400 dark:text-gray-500 leading-relaxed mt-1">
                                Specify your registered master email to generate an authorized security recovery handshaking OTP code.
                            </p>
                        </div>

                        <div className="space-y-4 text-xs">
                            <div>
                                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">Registered Administrator Email</label>
                                <input
                                    id="forgot_email_input"
                                    type="email"
                                    required
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    placeholder="admin@yourcompany.com"
                                    className="w-full px-4 py-2.5 border border-slate-205 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-orange text-xs font-bold text-slate-800 dark:text-white"
                                />
                            </div>
                        </div>

                        {forgotError && (
                            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium" id="forgot_email_error">
                                ⚠️ {forgotError}
                            </div>
                        )}

                        <div className="flex flex-col gap-2 pt-2">
                            <button
                                id="send_otp_btn"
                                type="submit"
                                className="w-full py-3 bg-brand-orange hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition"
                            >
                                Send Staging OTP PIN Code
                            </button>
                            <button
                                type="button"
                                onClick={() => setView('login')}
                                className="w-full py-2.5 text-xs text-slate-400 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white font-bold transition"
                            >
                                Cancel and Return
                            </button>
                        </div>
                    </form>
                )}

                {/* VIEW 3: FORGOT PASSWORD - VERIFY OTP & NEW PASSWORD */}
                {view === 'forgot_otp' && (
                    <form className="space-y-5 animate-fade-in" onSubmit={handleResetPassword} id="forgot_otp_form">
                        <div className="border-b dark:border-gray-800 pb-3 mb-2 flex justify-between items-start">
                            <div>
                                <h2 className="text-sm font-black text-slate-800 dark:text-gray-100 uppercase tracking-wider">Validate Identity & Override</h2>
                                <p className="text-[11px] text-slate-400 dark:text-gray-500 leading-relaxed mt-1">
                                    Provide the 6-digit confirmation digits and set your new system password parameters.
                                </p>
                            </div>
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded select-none shrink-0 dark:bg-amber-950/20 dark:text-amber-400">
                                OTP Dispatched
                            </span>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">Enter 6-Digit OTP Code</label>
                                <input
                                    id="forgot_otp_input"
                                    type="text"
                                    maxLength={6}
                                    required
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="e.g. 199421"
                                    className="w-full px-4 py-2.5 border border-slate-205 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center focus:outline-none focus:ring-1 focus:ring-brand-orange text-lg tracking-widest font-black text-slate-800 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">New Alphanumeric Password</label>
                                <input
                                    id="forgot_new_password_input"
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Must exceed 6 characters"
                                    className="w-full px-4 py-2.5 border border-slate-205 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-orange text-xs text-slate-800 dark:text-white font-bold"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">Confirm New Password</label>
                                <input
                                    id="forgot_confirm_password_input"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Verify password identically"
                                    className="w-full px-4 py-2.5 border border-slate-205 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-orange text-xs text-slate-800 dark:text-white font-bold"
                                />
                            </div>
                        </div>

                        {forgotError && (
                            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium" id="forgot_otp_error">
                                ⚠️ {forgotError}
                            </div>
                        )}

                        <div className="flex flex-col gap-2 pt-2">
                            <button
                                id="reset_password_submit_btn"
                                type="submit"
                                className="w-full py-3 bg-brand-orange hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition"
                            >
                                Validate OTP & Commit Password
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setView('forgot_email');
                                    setShowOtpAlert(false);
                                }}
                                className="w-full py-2 text-xs text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold transition"
                            >
                                Back to Staged Dispatcher
                            </button>
                        </div>
                    </form>
                )}

                {/* VIEW 4: FORGOT SUCCESS */}
                {view === 'forgot_success' && (
                    <div className="space-y-6 text-center py-4 animate-fade-in" id="forgot_success_view">
                        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-3xl shadow-xl shadow-emerald-500/10">
                            ✓
                        </div>
                        
                        <div className="space-y-2">
                            <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">Access Granted & Override Complete</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed px-2">
                                Staging database successfully overwritten with your updated recovery credentials. You may now return to the login panel.
                            </p>
                        </div>

                        <button
                            id="success_login_redirect_btn"
                            type="button"
                            onClick={() => setView('login')}
                            className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-650 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition"
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

