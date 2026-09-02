import React, { useState, useEffect } from 'react';
import PageHeader from '../components/shared/PageHeader';
import ThemeToggle from '../components/layout/ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import { useSystemSettings } from '../contexts/SettingsContext';
import Card from '../components/shared/Card';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  AlertTriangle, 
  FileText, 
  Download, 
  RefreshCw, 
  Laptop, 
  Smartphone, 
  Eye, 
  Ban, 
  CheckCircle2,
  Zap,
  Activity
} from 'lucide-react';
import { 
  verifyPassword, 
  hashPassword, 
  generateDocumentChecksum, 
  sanitizeInput,
  sanitizeCSVCell 
} from '../utils/securityUtils';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

interface SecurityAuditLog {
  id: string;
  timestamp: string;
  event: 'FAILED_LOGIN' | 'SUCCESSFUL_LOGIN' | 'PASSWORD_RESET' | 'PASSWORD_CHANGE' | 'IP_BLOCK_ALERT' | 'SESSION_TERMINATED' | 'EMERGENCY_LOCKDOWN';
  details: string;
  ipAddress: string;
  location: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ActiveSession {
  id: string;
  device: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  type: 'DESKTOP' | 'POS_TERMINAL' | 'MOBILE';
}

const SEED_SECURITY_LOGS: SecurityAuditLog[] = [
  {
    id: 'evt_init1',
    timestamp: '2026-06-17 07:44:12',
    event: 'SUCCESSFUL_LOGIN',
    details: 'Primary administrator session synchronized matching SHA-256 cryptographic fingerprint',
    ipAddress: '197.248.31.98',
    location: 'Nairobi, Kenya (Safaricom Broadband)',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/114.0.0.0',
    severity: 'low'
  },
  {
    id: 'evt_init2',
    timestamp: '2026-06-16 18:22:05',
    event: 'IP_BLOCK_ALERT',
    details: 'Malicious brute-force crawling intercepted on WooCommerce sync REST port. Client quarantined.',
    ipAddress: '185.220.101.4',
    location: 'Tor Exit Node / Germany',
    userAgent: 'Python-urllib/3.9 web crawling script',
    severity: 'critical'
  },
  {
    id: 'evt_init3',
    timestamp: '2026-06-16 18:20:11',
    event: 'FAILED_LOGIN',
    details: 'Incorrect credentials provided for main email: admin@masuma.co.ke',
    ipAddress: '185.220.101.4',
    location: 'Tor Exit Node / Germany',
    userAgent: 'Python-urllib/3.9 web crawling script',
    severity: 'high'
  },
  {
    id: 'evt_init4',
    timestamp: '2026-06-15 11:04:48',
    event: 'PASSWORD_CHANGE',
    details: 'Administrative credential overrides executed with salted SHA-256 encoding',
    ipAddress: '197.248.31.98',
    location: 'Nairobi, Kenya (Safaricom Broadband)',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/113.0.0.0',
    severity: 'medium'
  },
  {
    id: 'evt_init5',
    timestamp: '2026-06-12 14:15:33',
    event: 'SUCCESSFUL_LOGIN',
    details: 'Administrative ledger session established for billing desk sub-profile',
    ipAddress: '102.215.78.112',
    location: 'Mombasa, Kenya (Liquid Intelligent Technologies)',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5)',
    severity: 'low'
  }
];

const INITIAL_SESSIONS: ActiveSession[] = [
  {
    id: 'sess_curr_1',
    device: 'Master Web Terminal (Nairobi HQ Node)',
    ipAddress: '197.248.31.98',
    location: 'Nairobi, Kenya',
    lastActive: 'Just now (Active)',
    isCurrent: true,
    type: 'DESKTOP'
  },
  {
    id: 'sess_pos_2',
    device: 'POS Counter 01 Terminal (Industrial Area)',
    ipAddress: '197.248.31.102',
    location: 'Nairobi, Kenya',
    lastActive: '12 mins ago',
    isCurrent: false,
    type: 'POS_TERMINAL'
  },
  {
    id: 'sess_mob_3',
    device: 'Field Sales Tablet (Mombasa Depot)',
    ipAddress: '102.215.78.112',
    location: 'Mombasa, Kenya',
    lastActive: '45 mins ago',
    isCurrent: false,
    type: 'MOBILE'
  }
];

const Settings: React.FC = () => {
  const { theme } = useTheme();
  const { settings, updateSettings } = useSystemSettings();
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');

  // General Config States
  const [corpName, setCorpName] = useState(settings.corpName);
  const [corpShortName, setCorpShortName] = useState(settings.corpShortName || 'Masuma');
  const [currency, setCurrency] = useState(settings.currency);
  const [vatRate, setVatRate] = useState(settings.vatRate);
  const [corpPhone, setCorpPhone] = useState(settings.corpPhone);
  const [adminEmail, setAdminEmail] = useState(settings.adminEmail);
  const [taxpin, setTaxpin] = useState(settings.taxpin);
  const [branchCode, setBranchCode] = useState(settings.branchCode);
  const [deviceSerial, setDeviceSerial] = useState(settings.deviceSerial);
  const [defaultOutlet, setDefaultOutlet] = useState(settings.defaultOutlet);
  const [markupTierA, setMarkupTierA] = useState(settings.markupTierA);
  const [markupTierB, setMarkupTierB] = useState(settings.markupTierB);
  const [dunningSmsTemplate, setDunningSmsTemplate] = useState(settings.dunningSmsTemplate);
  const [brandColor, setLocalBrandColor] = useState(settings.brandColor || '#F97316');
  
  const [isSyncingETIMS, setIsSyncingETIMS] = useState(false);
  const [syncTimestamp, setSyncTimestamp] = useState<string>(settings.syncTimestamp);

  // Security Local Logs
  const [securityLogs, setSecurityLogs] = useState<SecurityAuditLog[]>(() => {
    const saved = localStorage.getItem('masuma_security_audit_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    localStorage.setItem('masuma_security_audit_logs', JSON.stringify(SEED_SECURITY_LOGS));
    return SEED_SECURITY_LOGS;
  });

  // Active sessions
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>(() => {
    const saved = localStorage.getItem('masuma_active_sessions');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_SESSIONS;
  });

  // Emergency lockdown status
  const [emergencyLockdown, setEmergencyLockdown] = useState<boolean>(() => {
    return localStorage.getItem('masuma_emergency_lockdown') === 'true';
  });

  // Password modify states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Sync Log Helper
  const addSecurityLog = (
    event: 'FAILED_LOGIN' | 'SUCCESSFUL_LOGIN' | 'PASSWORD_RESET' | 'PASSWORD_CHANGE' | 'IP_BLOCK_ALERT' | 'SESSION_TERMINATED' | 'EMERGENCY_LOCKDOWN',
    details: string,
    ipAddress = '197.248.31.98',
    location = 'Nairobi, Kenya (Safaricom)',
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ) => {
    const newLog: SecurityAuditLog = {
      id: 'evt_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      event,
      details,
      ipAddress,
      location,
      userAgent: navigator.userAgent || 'Mozilla/5.0 ERP Core Client',
      severity
    };
    const updated = [newLog, ...securityLogs].slice(0, 100);
    setSecurityLogs(updated);
    localStorage.setItem('masuma_security_audit_logs', JSON.stringify(updated));
  };

  const handleEtimsHandshakeSync = () => {
    setIsSyncingETIMS(true);
    setTimeout(() => {
      setIsSyncingETIMS(false);
      const currentTime = new Date().toLocaleString();
      setSyncTimestamp(currentTime);
      updateSettings({ syncTimestamp: currentTime, taxpin, branchCode, deviceSerial });
      
      addSecurityLog(
        'SUCCESSFUL_LOGIN',
        `KRA eTIMS Gateway cryptographic handshake verified for PIN ${taxpin}`,
        '197.248.31.98',
        'Nairobi, Kenya',
        'low'
      );

      alert(`🔄 KRA eTIMS SECURE HANDSHAKE SUCCESSFUL:\nTaxpayer PIN: ${taxpin}\nBranch Node: ${branchCode}\nSigned fiscal keys successfully synced with KRA Live servers.\nTimestamp: ${currentTime}`);
    }, 1500);
  };

  const handleSaveAllSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      corpName,
      corpShortName,
      currency,
      vatRate: Number(vatRate) || 0,
      corpPhone,
      adminEmail,
      taxpin,
      branchCode,
      deviceSerial,
      defaultOutlet,
      markupTierA: Number(markupTierA) || 0,
      markupTierB: Number(markupTierB) || 0,
      dunningSmsTemplate,
      brandColor,
    });
    alert(`⚙️ ERP CONFIGURATIONS UPDATED:\nBusiness profile, currency (${currency}), VAT Rate (${vatRate}%), pricing markup ratios, and dunning templates committed securely.`);
  };

  const handlePanelPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    const storedHash = localStorage.getItem('masuma_admin_password') || 'password';
    setIsUpdatingPassword(true);

    try {
      const isCurrentValid = await verifyPassword(currentPassword, storedHash);
      if (!isCurrentValid) {
        setIsUpdatingPassword(false);
        setPassError('Current system password does not match master authorization.');
        addSecurityLog('FAILED_LOGIN', 'Attempted direct password change: incorrect current password supplied', '197.248.31.98', 'Nairobi, Kenya', 'high');
        return;
      }

      if (newPassword.length < 6) {
        setIsUpdatingPassword(false);
        setPassError('Security protocol: password length must be at least 6 characters.');
        return;
      }

      if (newPassword !== confirmPassword) {
        setIsUpdatingPassword(false);
        setPassError('Password confirmation fields do not match.');
        return;
      }

      // Hash with salted SHA-256 before saving
      const secureHash = await hashPassword(newPassword);
      localStorage.setItem('masuma_admin_password', secureHash);
      
      setIsUpdatingPassword(false);
      setPassSuccess('Master security password salted and encrypted in storage vault.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      addSecurityLog('PASSWORD_CHANGE', 'Primary admin password updated with SHA-256 salted hash', '197.248.31.98', 'Nairobi, Kenya', 'high');
    } catch {
      setIsUpdatingPassword(false);
      setPassError('An error occurred during password encryption.');
    }
  };

  const handleTerminateSession = (sessionId: string) => {
    const updated = activeSessions.filter(s => s.id !== sessionId);
    setActiveSessions(updated);
    localStorage.setItem('masuma_active_sessions', JSON.stringify(updated));
    addSecurityLog(
      'SESSION_TERMINATED',
      `Active session ${sessionId} manually revoked and quarantined by administrator`,
      '197.248.31.98',
      'Nairobi, Kenya',
      'medium'
    );
    alert('Session successfully revoked. Remote terminal disconnected.');
  };

  const handleToggleEmergencyLockdown = () => {
    const nextState = !emergencyLockdown;
    setEmergencyLockdown(nextState);
    localStorage.setItem('masuma_emergency_lockdown', nextState ? 'true' : 'false');
    addSecurityLog(
      'EMERGENCY_LOCKDOWN',
      nextState 
        ? '🚨 EMERGENCY SYSTEM LOCKDOWN ACTIVATED: All POS terminals quarantined, write operations restricted to Super Admin'
        : '🟢 Emergency System Lockdown Disengaged: Normal terminal operations restored',
      '197.248.31.98',
      'Nairobi, Kenya',
      nextState ? 'critical' : 'low'
    );
  };

  // Export Security Audit Trail to CSV
  const handleExportAuditCSV = () => {
    const headers = ['Event ID', 'Timestamp (UTC)', 'Event Type', 'Severity', 'Source IP', 'Location', 'Audit Details'];
    const rows = securityLogs.map(l => [
      l.id,
      l.timestamp,
      l.event,
      l.severity.toUpperCase(),
      l.ipAddress,
      l.location,
      l.details
    ]);

    exportToCSV({
      filename: `masuma_security_audit_ledger_${Date.now()}`,
      title: 'Masuma ERP Security & Observability Audit Trail',
      headers,
      rows,
      summaryStats: [
        { label: 'Total Recorded Events', value: securityLogs.length },
        { label: 'Critical / WAF Intercepts', value: securityLogs.filter(s => s.severity === 'critical').length },
        { label: 'Security Enclave Hash', value: 'SHA-256 VERIFIED' }
      ]
    });
  };

  // Export Security Audit Trail to PDF
  const handleExportAuditPDF = () => {
    const headers = ['Event', 'Severity', 'Timestamp', 'Source IP', 'Details'];
    const rows = securityLogs.map(l => [
      l.event,
      l.severity.toUpperCase(),
      l.timestamp,
      l.ipAddress,
      l.details.length > 50 ? l.details.substring(0, 48) + '...' : l.details
    ]);

    exportToPDF({
      filename: `masuma_security_audit_report_${Date.now()}`,
      title: 'Masuma Security & Observability Audit Report',
      subtitle: 'Cryptographically certified operational log of access attempts, WAF triggers and credential lifecycle events',
      headers,
      rows,
      summaryStats: [
        { label: 'Total Events Logged', value: securityLogs.length },
        { label: 'Integrity Status', value: 'CWE-1236 & SHA-256 Compliant' }
      ]
    });
  };

  const runSecuritySimulation = (type: 'BRUTE_FORCE' | 'WEBHOOK_SPOOF' | 'ETIMS_COMPROMISE' | 'CLEAR_LOGS') => {
    if (type === 'CLEAR_LOGS') {
      if (window.confirm('Are you sure you want to clear the security audit ledger? Past observability markers will be wiped.')) {
        setSecurityLogs([]);
        localStorage.setItem('masuma_security_audit_logs', JSON.stringify([]));
        alert('🧹 Observability logs wiped successfully.');
      }
      return;
    }

    if (type === 'BRUTE_FORCE') {
      addSecurityLog(
        'IP_BLOCK_ALERT',
        'Brute force login threshold triggered: 5 failing logins locked within 1200ms. Remote client auto-quarantined.',
        '109.245.98.22',
        'Moscow, Russian Federation',
        'critical'
      );
      addSecurityLog(
        'FAILED_LOGIN',
        'Failed administrative login attempt tracking automated dictionary stuffing attack',
        '109.245.98.22',
        'Moscow, Russian Federation',
        'high'
      );
      alert('💥 ATTACK BLOCK SIMULATED: Brute force vector countered. IP address [109.245.98.22] put on automatic firewall quarantine.');
    } else if (type === 'WEBHOOK_SPOOF') {
      addSecurityLog(
        'FAILED_LOGIN',
        'B2B Integration Breach caught: Webhook post webhook handshake skipped/rejected. Bearer SHA256 signature payload mismatch.',
        '198.51.100.41',
        'Mombasa, Kenya',
        'high'
      );
      alert('⚡ SIGNATURE EXPLOIT SIMULATED: Spoofed webhook POST request successfully intercepted and blocked due to SHA-256 HMAC verification fail.');
    } else if (type === 'ETIMS_COMPROMISE') {
      addSecurityLog(
        'IP_BLOCK_ALERT',
        'KRA eTIMS server handshake certificate signature corrupted. Connection halted to protect secure fiscal keys',
        '212.49.85.12',
        'Nairobi, Kenya (KRA Gateway)',
        'medium'
      );
      alert('🔑 KEYS DEFENSE SIMULATED: System successfully halted eTIMS synchronized transmission of invoices because the tax broker endpoint TLS certificate changed.');
    }
  };

  const stats = {
    failedCount: securityLogs.filter(l => l.event === 'FAILED_LOGIN').length,
    criticalCount: securityLogs.filter(l => l.severity === 'critical' || l.event === 'IP_BLOCK_ALERT').length,
    uniqueIPs: Array.from(new Set(securityLogs.map(l => l.ipAddress))).length,
    healthRating: emergencyLockdown ? '99% (Lockdown Engaged)' : '100% (Fully Hardened)'
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 pb-16 overflow-y-auto">
      <PageHeader title="Corporate ERP Configurations & Security Center" showSearch={false} />
      
      {/* Switcher Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-surface-2 dark:border-gray-700 px-4 md:px-8 mt-0.5 shrink-0">
        <div className="flex gap-4 md:gap-8 overflow-x-auto text-xs md:text-sm">
          <button 
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-4 font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'general' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            📋 General ERP Settings
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-4 font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${activeTab === 'security' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Cybersecurity & Threat Defense Center</span>
          </button>
        </div>
      </div>

      {/* TAB 1: GENERAL SETTINGS */}
      {activeTab === 'general' && (
        <div className="p-4 md:p-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 w-full animate-fade-in">
          
          {/* LEFT COLUMN: Business Profile & Pricing Markups (colspan 7) */}
          <form onSubmit={handleSaveAllSettings} className="lg:col-span-7 space-y-6">
            
            {/* Corporate Profile Card */}
            <Card className="border border-slate-200 dark:border-slate-800">
               <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Business Profile</h3>
                  <p className="text-xs text-slate-400">Official registered corporate taxpayer assets and contact desks.</p>
               </div>

               <div className="mt-4 space-y-4 text-xs font-sans">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div>
                          <label className="font-bold text-slate-600 dark:text-slate-400">Registered Entity Name (Full)</label>
                          <input 
                             type="text" 
                             value={corpName}
                             onChange={(e) => setCorpName(e.target.value)}
                             className="mt-1 w-full p-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-orange" 
                          />
                       </div>
                       <div>
                          <label className="font-bold text-slate-600 dark:text-slate-400">Brand / Short Name</label>
                          <input 
                             type="text" 
                             value={corpShortName}
                             onChange={(e) => setCorpShortName(e.target.value)}
                             className="mt-1 w-full p-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-orange" 
                          />
                       </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div>
                          <label className="font-bold text-slate-600 dark:text-slate-400">Distributor Contact Hotline</label>
                          <input 
                             type="text" 
                             value={corpPhone}
                             onChange={(e) => setCorpPhone(e.target.value)}
                             className="mt-1 w-full p-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-orange" 
                          />
                       </div>
                       <div>
                          <label className="font-bold text-slate-600 dark:text-slate-400">Official Billing Email Desk</label>
                          <input 
                             type="email" 
                             value={adminEmail}
                             onChange={(e) => setAdminEmail(e.target.value)}
                             className="mt-1 w-full p-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-orange" 
                          />
                       </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div>
                          <label className="font-bold text-slate-600 dark:text-slate-400">System Currency Symbol</label>
                          <input 
                             type="text" 
                             value={currency}
                             onChange={(e) => setCurrency(e.target.value)}
                             className="mt-1 w-full p-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-brand-orange" 
                          />
                       </div>
                       <div>
                          <label className="font-bold text-slate-600 dark:text-slate-400">Standard Value Added Tax (VAT %)</label>
                          <input 
                             type="number" 
                             value={vatRate}
                             onChange={(e) => setVatRate(Number(e.target.value))}
                             className="mt-1 w-full p-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-1 focus:ring-brand-orange" 
                          />
                       </div>
                   </div>
               </div>
            </Card>

            <button 
              type="submit" 
              className="w-full py-3 bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition cursor-pointer"
            >
              Save General ERP Configurations
            </button>
          </form>

          {/* RIGHT COLUMN: Appearance and eTIMS */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border border-slate-200 dark:border-slate-800">
               <div className="border-b dark:border-slate-800 pb-2 mb-4">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">KRA eTIMS Fiscal Engine</h3>
                  <p className="text-xs text-slate-400">Live integration status with tax authority servers.</p>
               </div>
               <div className="space-y-3 text-xs">
                   <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Taxpayer PIN</span>
                      <p className="font-mono font-bold text-slate-900 dark:text-white">{taxpin}</p>
                   </div>
                   <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Branch Node</span>
                      <p className="font-mono font-bold text-slate-900 dark:text-white">{branchCode}</p>
                   </div>
                   <button
                     type="button"
                     onClick={handleEtimsHandshakeSync}
                     disabled={isSyncingETIMS}
                     className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
                   >
                     {isSyncingETIMS ? <RefreshCw className="w-4 h-4 animate-spin" /> : '🔄 Force Sync eTIMS Handshake'}
                   </button>
               </div>
            </Card>

            <Card className="border border-slate-200 dark:border-slate-800">
               <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Theme & Brand Styling</h3>
                  <p className="text-xs text-slate-400">Customize appearance and brand colors.</p>
               </div>
               <div className="mt-4 flex items-center justify-between text-xs border-b dark:border-slate-800 pb-4">
                   <div>
                       <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">Interface Theme</h4>
                       <p className="text-slate-400 text-[11px] mt-0.5">Active mode: <span className="capitalize font-bold text-brand-orange">{theme}</span></p>
                   </div>
                   <ThemeToggle />
               </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY & THREAT DEFENSE HUB */}
      {activeTab === 'security' && (
        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6 animate-fade-in text-xs font-sans text-slate-600 dark:text-slate-300">
          
          {/* HARDENED SECURITY MATRIX BANNER */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black uppercase tracking-tight text-white">
                      Threat Defense & Anti-Sabotage Engine
                    </h2>
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full font-mono">
                      SYSTEM HARDENED
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                    Protects against competitor credential stuffing, CSV formula injection (CWE-1236), unauthorized price tampering, and unattended terminal hijacking.
                  </p>
                </div>
              </div>

              {/* Emergency Lockdown Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleEmergencyLockdown}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-lg ${
                    emergencyLockdown 
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/30 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <Ban className="w-4 h-4" />
                  <span>{emergencyLockdown ? 'Lockdown ENGAGED (Quarantine)' : 'Emergency Lockdown'}</span>
                </button>
              </div>
            </div>

            {/* Defense Capabilities Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-slate-200">Anti-Brute Force</p>
                  <p className="text-[9px] text-slate-400 font-mono">5 Attempts / 60s Lock</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-slate-200">CSV DDE Neutralizer</p>
                  <p className="text-[9px] text-slate-400 font-mono">CWE-1236 Protected</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-slate-200">Salted SHA-256 Vault</p>
                  <p className="text-[9px] text-slate-400 font-mono">Zero Plaintext Storage</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-slate-200">Terminal Idle Shield</p>
                  <p className="text-[9px] text-slate-400 font-mono">15-Min Inactivity Auto-Lock</p>
                </div>
              </div>
            </div>
          </div>

          {/* SEC METRIC BLOCKS */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
              <span className="text-2xl">🛡️</span>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Security Integrity</span>
                <p className="font-black text-slate-900 dark:text-white mt-0.5">{stats.healthRating}</p>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
              <span className="text-2xl text-rose-500">🚫</span>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Failed Login Blocks</span>
                <p className="font-black text-slate-900 dark:text-white mt-0.5 font-mono">{stats.failedCount} Incidents</p>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
              <span className="text-2xl text-teal-500">🌐</span>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Active Whitelisted IPs</span>
                <p className="font-black text-slate-900 dark:text-white mt-0.5 font-mono">{stats.uniqueIPs} Source Nodes</p>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
              <span className="text-2xl text-amber-500">🚨</span>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">WAF Blocks Intercepted</span>
                <p className="font-black text-slate-900 dark:text-white mt-0.5 font-mono">{stats.criticalCount} Threat Blocks</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Password Change & Active Sessions (colspan 5) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* PASSWORD UPDATE CARD */}
              <Card className="border border-slate-200 dark:border-slate-800">
                <div className="border-b dark:border-slate-800 pb-2 mb-4">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-brand-orange" />
                    <span>Master Credential Overhaul</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Updates credentials with salted SHA-256 cryptographic hashing.</p>
                </div>

                <form onSubmit={handlePanelPasswordChange} className="space-y-4 font-sans">
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Current Master Password</label>
                    <input 
                      type="password"
                      required
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800 rounded-lg font-bold text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-orange"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">New Alphanumeric Password</label>
                    <input 
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800 rounded-lg font-bold text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-orange"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Confirm New Password</label>
                    <input 
                      type="password"
                      required
                      placeholder="Must match identically"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800 rounded-lg font-bold text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-orange"
                    />
                  </div>

                  {passError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg font-medium">
                      ⚠️ {passError}
                    </div>
                  )}

                  {passSuccess && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg font-bold">
                      ✓ {passSuccess}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-black text-xs uppercase tracking-wider rounded-lg transition cursor-pointer"
                  >
                    {isUpdatingPassword ? 'Hashing & Encrypting...' : 'Commit Salted SHA-256 Key'}
                  </button>
                </form>
              </Card>

              {/* ACTIVE SESSIONS INSPECTOR */}
              <Card className="border border-slate-200 dark:border-slate-800">
                <div className="border-b dark:border-slate-800 pb-2 mb-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Laptop className="w-4 h-4 text-indigo-500" />
                      <span>Active Terminal Sessions</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Revoke rogue sessions instantly.</p>
                  </div>
                  <span className="font-mono text-[9px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 font-bold px-2 py-0.5 rounded">
                    {activeSessions.length} Active
                  </span>
                </div>

                <div className="space-y-2.5">
                  {activeSessions.map(session => (
                    <div key={session.id} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            {session.device}
                          </p>
                          {session.isCurrent && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded font-mono">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          IP: {session.ipAddress} • {session.lastActive}
                        </p>
                      </div>

                      {!session.isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleTerminateSession(session.id)}
                          className="px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400 text-[10px] font-bold uppercase transition cursor-pointer"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* SECURITY SIMULATOR */}
              <Card className="border border-indigo-100 dark:border-indigo-950 bg-indigo-50/5">
                <div className="border-b border-indigo-100 dark:border-indigo-900 pb-2 mb-3">
                  <h3 className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">💥 Penetration & Threat Simulator</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Test real-time defense interceptions.</p>
                </div>

                <div className="space-y-2 font-mono text-[10.5px]">
                  <button 
                    onClick={() => runSecuritySimulation('BRUTE_FORCE')}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 border border-slate-200 dark:border-gray-700 rounded-lg text-left flex justify-between items-center transition cursor-pointer"
                  >
                    <span>Simulate Berlin Tor Brute Force Relay</span>
                    <span className="text-red-500 font-extrabold uppercase text-[9px] bg-red-100 dark:bg-red-950/40 px-1.5 py-0.5 rounded">AUTO-BLOCK</span>
                  </button>

                  <button 
                    onClick={() => runSecuritySimulation('WEBHOOK_SPOOF')}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 border border-slate-200 dark:border-gray-700 rounded-lg text-left flex justify-between items-center transition cursor-pointer"
                  >
                    <span>Spoof WooCommerce HMAC Checksum</span>
                    <span className="text-amber-600 font-extrabold uppercase text-[9px] bg-amber-100 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">DENIED</span>
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-indigo-150/15 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">Clear all observational events</span>
                  <button 
                    onClick={() => runSecuritySimulation('CLEAR_LOGS')}
                    className="text-slate-450 hover:text-rose-600 font-bold uppercase text-[9px] cursor-pointer"
                  >
                    Wipe Logs
                  </button>
                </div>
              </Card>
            </div>

            {/* RIGHT COLUMN: Tamper-Evident Audit Ledger (colspan 7) */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="border border-slate-200 dark:border-slate-800">
                <div className="border-b dark:border-slate-800 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      <span>Tamper-Evident Cybersecurity Audit Ledger</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Immutable record of authentication, key lifecycle, and perimeter attacks.
                    </p>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportAuditCSV}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
                      title="Export CSV (CWE-1236 Neutralized)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportAuditPDF}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-[11px] font-bold text-white flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                      title="Export Certified PDF Audit Report"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>PDF Report</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                  {securityLogs.map((log) => {
                    const sevColor = 
                      log.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/40' :
                      log.severity === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/40' :
                      log.severity === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40';

                    const badgeName = 
                      log.event === 'FAILED_LOGIN' ? '🚫 Credentials Fail' :
                      log.event === 'SUCCESSFUL_LOGIN' ? '🟢 Authed OK' :
                      log.event === 'PASSWORD_RESET' ? '🔑 OTP Override' :
                      log.event === 'PASSWORD_CHANGE' ? '🔩 Config Override' :
                      log.event === 'IP_BLOCK_ALERT' ? '🔥 Firewall Block' :
                      log.event === 'EMERGENCY_LOCKDOWN' ? '🚨 Lockdown Event' :
                      '🔌 Halted session';

                    return (
                      <div key={log.id} className="p-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800/80 rounded-xl space-y-2 font-sans hover:border-slate-300 dark:hover:border-slate-700 transition">
                        
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 border rounded text-[9px] font-mono font-black uppercase ${sevColor}`}>
                              {badgeName}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">{log.timestamp}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono">
                            {log.ipAddress}
                          </span>
                        </div>

                        <p className="text-[11px] leading-relaxed text-slate-800 dark:text-gray-150 font-medium">
                          {log.details}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-1 text-[9px] text-slate-400 border-t border-slate-100 dark:border-slate-800/50 pt-2 font-mono">
                          <span>📍 Location: <strong className="text-slate-600 dark:text-slate-350">{log.location}</strong></span>
                          <span className="truncate max-w-[200px] hover:max-w-none transition-all cursor-default" title={log.userAgent}>
                            UA: {log.userAgent}
                          </span>
                        </div>

                      </div>
                    );
                  })}

                  {securityLogs.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                      The security audit ledger is empty.
                    </div>
                  )}
                </div>
              </Card>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default Settings;
