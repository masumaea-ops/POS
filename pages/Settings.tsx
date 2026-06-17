import React, { useState } from 'react';
import PageHeader from '../components/shared/PageHeader';
import ThemeToggle from '../components/layout/ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import { useSystemSettings } from '../contexts/SettingsContext';
import Card from '../components/shared/Card';

interface SecurityAuditLog {
  id: string;
  timestamp: string;
  event: 'FAILED_LOGIN' | 'SUCCESSFUL_LOGIN' | 'PASSWORD_RESET' | 'PASSWORD_CHANGE' | 'IP_BLOCK_ALERT' | 'SESSION_TERMINATED';
  details: string;
  ipAddress: string;
  location: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const SEED_SECURITY_LOGS: SecurityAuditLog[] = [
  {
    id: 'evt_init1',
    timestamp: '2026-06-17 07:44:12',
    event: 'SUCCESSFUL_LOGIN',
    details: 'Primary administrator session synchronized matching secure fingerprint key',
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
    details: 'Administrative credential overrides executed via secure central control node',
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

const Settings: React.FC = () => {
  const { theme } = useTheme();
  const { settings, updateSettings } = useSystemSettings();
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');

  // Create local editing states pre-filled with global configs
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

  // Security Local log ledger states
  const [securityLogs, setSecurityLogs] = useState<SecurityAuditLog[]>(() => {
    const saved = localStorage.getItem('masuma_security_audit_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fall back
      }
    }
    localStorage.setItem('masuma_security_audit_logs', JSON.stringify(SEED_SECURITY_LOGS));
    return SEED_SECURITY_LOGS;
  });

  // Password modify states inside Settings Panel
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Sync Log Helper
  const addSecurityLog = (
    event: 'FAILED_LOGIN' | 'SUCCESSFUL_LOGIN' | 'PASSWORD_RESET' | 'PASSWORD_CHANGE' | 'IP_BLOCK_ALERT' | 'SESSION_TERMINATED',
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
    const updated = [newLog, ...securityLogs].slice(0, 50);
    setSecurityLogs(updated);
    localStorage.setItem('masuma_security_audit_logs', JSON.stringify(updated));
  };

  // Trigger eTIMS Mock Handshake Sync
  const handleEtimsHandshakeSync = () => {
    setIsSyncingETIMS(true);
    setTimeout(() => {
      setIsSyncingETIMS(false);
      const currentTime = new Date().toLocaleString();
      setSyncTimestamp(currentTime);
      updateSettings({ syncTimestamp: currentTime, taxpin, branchCode, deviceSerial });
      
      addSecurityLog(
        'SUCCESSFUL_LOGIN',
        `KRA eTIMS Gateway cryptographic handshaking signed and committed for TIN ${taxpin}`,
        '197.248.31.98',
        'Nairobi, Kenya',
        'low'
      );

      alert(`🔄 KRA eTIMS SECURE HANDSHAKE SUCCESSFUL:\nTaxpayer PIN: ${taxpin}\nBranch Node: ${branchCode}\nSigned fiscal keys successfully synced with KRA Live servers.\nTimestamp: ${currentTime}`);
    }, 2000);
  };

  // Save Settings Trigger
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

  // Administrative Password Override inside panel
  const handlePanelPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    const activePass = localStorage.getItem('masuma_admin_password') || 'password';
    if (currentPassword !== activePass) {
      setPassError('Current system password does not match database security authorization.');
      addSecurityLog('FAILED_LOGIN', 'Attempted direct password change: incorrect current password supplied', '197.248.31.98', 'Nairobi, Kenya', 'high');
      return;
    }

    if (newPassword.length < 6) {
      setPassError('Security protocol: password length must exceed 6 alphanumeric keys.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Password confirmation fields do not match.');
      return;
    }

    // Save
    localStorage.setItem('masuma_admin_password', newPassword);
    setPassSuccess('Security Password successfully overridden, synchronized and updated in db.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    addSecurityLog('PASSWORD_CHANGE', 'Primary admin password updated directly from system control panel', '197.248.31.98', 'Nairobi, Kenya', 'high');
  };

  // Run dynamic security simulations
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
        'Brute force login threshold triggered: 8 failing logins locked within 1200ms space. Remote client auto-quarantined.',
        '109.245.98.22',
        'Moscow, Russian Federation',
        'critical'
      );
      addSecurityLog(
        'FAILED_LOGIN',
        'Failed administrative login attempt tracking brute-force automated pattern parsing dictionary attack',
        '109.245.98.22',
        'Moscow, Russian Federation',
        'high'
      );
      alert('💥 ATTACK BLOCK SIMULATED: Brute force vector successfully countered. IP address [109.245.98.22] put on automatic firewall quarantine.');
    } else if (type === 'WEBHOOK_SPOOF') {
      addSecurityLog(
        'FAILED_LOGIN',
        'B2B Integration Breach caught: Webhook post webhook handshake skipped/rejected. Bearer SHA256 signature payload mismatch.',
        '198.51.100.41',
        'Mombasa, Kenya',
        'high'
      );
      alert('⚡ SIGNATURE SPLOIT SIMULATED: Spoofed webhook POST request successfully intercepted and blocked due to SHA256 HMAC verification fail.');
    } else if (type === 'ETIMS_COMPROMISE') {
      addSecurityLog(
        'IP_BLOCK_ALERT',
        'KRA eTIMS server handshake certificate signature corrupted. Connection halted to protect secure fiscal keys',
        '212.49.85.12',
        'Nairobi, Kenya (KRA Gateway)',
        'medium'
      );
      alert('🔑 KEYS DEFENCE SIMULATED: System successfully halted eTIMS synchronized transmission of invoices because the tax broker endpoint TLS certificate changed.');
    }
  };

  // Stats calculators
  const stats = {
    failedCount: securityLogs.filter(l => l.event === 'FAILED_LOGIN').length,
    criticalCount: securityLogs.filter(l => l.severity === 'critical' || l.event === 'IP_BLOCK_ALERT').length,
    uniqueIPs: Array.from(new Set(securityLogs.map(l => l.ipAddress))).length,
    healthRating: securityLogs.some(l => l.severity === 'critical') ? '92% (Guarded)' : '100% (Secure)'
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 pb-16 overflow-y-auto">
      <PageHeader title="Corporate ERP Configurations" showSearch={false} />
      
      {/* Switcher Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-surface-2 dark:border-gray-700 px-4 md:px-8 mt-0.5 shrink-0">
        <div className="flex gap-4 md:gap-8 overflow-x-auto text-xs md:text-sm">
          <button 
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-4 font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'general' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            📋 General ERP Settings
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-4 font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'security' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            🛡️ Administrative Security Observability Audit
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
                             placeholder="e.g. KES, USD, EUR, GBP" 
                          />
                       </div>
                       <div>
                          <label className="font-bold text-slate-600 dark:text-slate-400">Sales VAT Rate (%)</label>
                          <input 
                             type="number" 
                             value={vatRate}
                             onChange={(e) => setVatRate(Number(e.target.value) || 0)}
                             className="mt-1 w-full p-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-brand-orange"
                             placeholder="e.g. 16" 
                          />
                       </div>
                   </div>
               </div>
            </Card>

            {/* Pricing Markups Policies Card */}
            <Card className="border border-slate-200 dark:border-slate-800">
               <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Trading Markups & Outlets</h3>
                  <p className="text-xs text-slate-400">Configure safety margins and default physical branch assignment.</p>
               </div>

               <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
                    <div>
                       <label className="font-bold text-slate-600 dark:text-slate-400">Wholesale Tier A Markup (%)</label>
                       <input 
                          type="number"
                          value={markupTierA}
                          onChange={(e) => setMarkupTierA(Number(e.target.value) || 0)}
                          className="mt-1 w-full p-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-brand-orange" 
                       />
                    </div>
                    <div>
                       <label className="font-bold text-slate-600 dark:text-slate-400">Wholesale Tier B Markup (%)</label>
                       <input 
                          type="number"
                          value={markupTierB}
                          onChange={(e) => setMarkupTierB(Number(e.target.value) || 0)}
                          className="mt-1 w-full p-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-brand-orange" 
                       />
                    </div>
                    <div>
                       <label className="font-bold text-slate-600 dark:text-slate-400">Default POS Outlet Node</label>
                       <input 
                          type="text"
                          value={defaultOutlet}
                          onChange={(e) => setDefaultOutlet(e.target.value)}
                          className="mt-1 w-full p-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-orange" 
                       />
                    </div>
               </div>
            </Card>

            {/* Persistent Dunning Communication Template card */}
            <Card className="border border-slate-200 dark:border-slate-800">
               <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Arrears Dunning SMS Rules</h3>
                  <p className="text-xs text-slate-400">Customize text messages queued when triggering SMS dunning collection notifications.</p>
               </div>
               <div className="mt-4 text-xs">
                   <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Dunning Template</label>
                   <textarea
                       rows={3}
                       value={dunningSmsTemplate}
                       onChange={(e) => setDunningSmsTemplate(e.target.value)}
                       className="w-full p-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-slate-900 dark:text-white font-sans focus:outline-none focus:ring-1 focus:ring-brand-orange text-xs"
                       placeholder="Type template with {customerName}, {companyName}, {totalDue}, {over60}, {currency} placeholders..."
                   />
                   <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                      Supported bindings: <code className="text-brand-orange">{"{customerName}"}</code>, <code className="text-brand-orange">{"{companyName}"}</code>, <code className="text-brand-orange">{"{totalDue}"}</code>, <code className="text-brand-orange">{"{over60}"}</code>, <code className="text-brand-orange">{"{currency}"}</code>
                   </span>
               </div>
            </Card>

            {/* Submit Action */}
            <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  className="py-3 px-8 bg-brand-orange hover:bg-brand-orange/95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition hover:shadow-lg shadow-md font-sans"
                >
                    Save ERP Configurations
                </button>
            </div>

          </form>

          {/* RIGHT COLUMN: KRA eTIMS Legislative hooks & Themes (colspan 5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* KRA eTIMS Server compliance console */}
            <Card className="border border-slate-200 dark:border-slate-800">
               <div className="border-b dark:border-slate-800 pb-3 flex justify-between items-center">
                   <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">eTIMS Compliance Integration</h3>
                      <p className="text-[10px] text-slate-450">Digital tax compliance handshake and signing serial keys.</p>
                   </div>
                   <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
               </div>

               <div className="mt-4 space-y-4 text-xs font-mono">
                   <div>
                      <label className="font-bold text-slate-500 uppercase text-[9px]">Taxpayer TIN Reference ID</label>
                      <input 
                         type="text" 
                         value={taxpin}
                         onChange={(e) => setTaxpin(e.target.value)}
                         className="mt-1 w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none" 
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                       <div>
                          <label className="font-bold text-slate-500 uppercase text-[9px]">Device Serial FSC</label>
                          <input 
                             type="text" 
                             value={deviceSerial}
                             onChange={(e) => setDeviceSerial(e.target.value)}
                             className="mt-1.5 w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none" 
                          />
                       </div>
                       <div>
                          <label className="font-bold text-slate-500 uppercase text-[9px]">Branch HQ Code</label>
                          <input 
                             type="text" 
                             value={branchCode}
                             onChange={(e) => setBranchCode(e.target.value)}
                             className="mt-1.5 w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none" 
                          />
                       </div>
                   </div>

                   <div className="p-3 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
                       <span className="text-[9px] font-bold text-slate-400 block uppercase">Gateway handshakes sync history</span>
                       <span className="font-bold text-slate-700 dark:text-slate-300 block">{syncTimestamp}</span>
                   </div>

                   <button 
                     type="button"
                     onClick={handleEtimsHandshakeSync}
                     disabled={isSyncingETIMS}
                     className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500/50 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition"
                   >
                      {isSyncingETIMS ? (
                        <>
                          <span className="inline-block w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                          Synchronizing general keys...
                        </>
                      ) : (
                        '🔄 Force Sync eTIMS Handshake'
                      )}
                   </button>
               </div>
            </Card>

            {/* Theme appearance card */}
            <Card className="border border-slate-200 dark:border-slate-800">
               <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Appearance & Branding Colors</h3>
                  <p className="text-xs text-slate-400">Swap interface themes and customize dynamic brand accent colors.</p>
               </div>
               <div className="mt-4 flex items-center justify-between text-xs border-b dark:border-slate-800 pb-4">
                   <div>
                       <h4 className="font-bold text-slate-750 dark:text-slate-200 uppercase text-[10px]">Interface Theme</h4>
                       <p className="text-slate-450 mt-0.5">Active display selection: <span className="capitalize font-black font-mono text-brand-orange">{theme} mode</span></p>
                   </div>
                   <ThemeToggle />
               </div>
               <div className="mt-4 text-xs space-y-3">
                   <div>
                       <h4 className="font-bold text-slate-750 dark:text-slate-200 uppercase text-[10px]">Corporate Accent Color Theme</h4>
                       <p className="text-slate-400 mt-0.5">Select a brand-matched preset color or define a custom corporate palette hex value.</p>
                   </div>
                   <div className="grid grid-cols-4 gap-2">
                       {[
                         { name: 'Orange', hex: '#F97316' },
                         { name: 'Indigo', hex: '#6366F1' },
                         { name: 'Green', hex: '#10B981' },
                         { name: 'Teal', hex: '#14B8A6' },
                         { name: 'Blue', hex: '#2563EB' },
                         { name: 'Crimson', hex: '#E11D48' },
                         { name: 'Amber', hex: '#D97706' },
                         { name: 'Steel', hex: '#4B5563' },
                       ].map((preset) => (
                         <button
                           key={preset.name}
                           type="button"
                           onClick={() => {
                             setLocalBrandColor(preset.hex);
                             updateSettings({ brandColor: preset.hex });
                           }}
                           className={`p-1.5 rounded border text-left flex items-center gap-1.5 transition-all text-[10px] font-bold ${brandColor === preset.hex ? 'border-brand-orange bg-slate-100 dark:bg-slate-700 font-extrabold' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
                         >
                           <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: preset.hex }}></span>
                           <span className="truncate">{preset.name}</span>
                         </button>
                       ))}
                   </div>
                   <div className="flex items-center gap-3 pt-2">
                       <div className="flex-1">
                           <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Custom Brand Palette Hex</label>
                           <div className="flex gap-2">
                               <input 
                                 type="text" 
                                 value={brandColor}
                                 onChange={(e) => {
                                   const value = e.target.value;
                                   setLocalBrandColor(value);
                                   if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                                      updateSettings({ brandColor: value });
                                   }
                                 }}
                                 className="flex-1 p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 hover:border-slate-350 rounded font-mono font-bold"
                                 placeholder="#F97316"
                               />
                               <input 
                                 type="color" 
                                 value={brandColor.startsWith('#') && brandColor.length === 7 ? brandColor : '#F97316'}
                                 onChange={(e) => {
                                   const newCol = e.target.value;
                                   setLocalBrandColor(newCol);
                                   updateSettings({ brandColor: newCol });
                                 }}
                                 className="w-10 h-10 border border-slate-200 dark:border-slate-700 rounded cursor-pointer p-0.5 bg-white dark:bg-gray-800"
                               />
                           </div>
                       </div>
                   </div>
               </div>
            </Card>

          </div>

        </div>
      )}

      {/* TAB 2: SECURITY OBSERVABILITY AUDIT */}
      {activeTab === 'security' && (
        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6 animate-fade-in text-xs font-sans text-slate-600 dark:text-slate-300">
          
          {/* SEC METRIC BOCKS */}
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
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Failed Login Records</span>
                <p className="font-black text-slate-900 dark:text-white mt-0.5 font-mono">{stats.failedCount} Access Attempts</p>
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
            
            {/* DIRECT PASSWORD MODIFICATION PANEL */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="border border-slate-200 dark:border-slate-800">
                <div className="border-b dark:border-slate-805 pb-2 mb-4">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Master Administrative Password</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Directly change administrative credentials for primary node logins.</p>
                </div>

                <form onSubmit={handlePanelPasswordChange} className="space-y-4 font-sans">
                  <div>
                    <label className="font-bold text-slate-500 block mb-1">Current Password Authorization</label>
                    <input 
                      type="password"
                      required
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800 rounded-lg font-bold text-slate-850 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-500 block mb-1">New Alphanumeric Password</label>
                    <input 
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800 rounded-lg font-bold text-slate-850 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-500 block mb-1">Confirm New Password</label>
                    <input 
                      type="password"
                      required
                      placeholder="Must match identically"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800 rounded-lg font-bold text-slate-850 dark:text-white"
                    />
                  </div>

                  {passError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg font-medium">
                      ⚠️ {passError}
                    </div>
                  )}

                  {passSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg font-bold">
                      ✓ {passSuccess}
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-650 text-white font-black text-xs uppercase tracking-wider rounded-lg transition"
                  >
                    Commit Credential Change
                  </button>
                </form>
              </Card>

              {/* SECURITY SIMULATOR PLAYGROUND */}
              <Card className="border border-indigo-100 dark:border-indigo-950 bg-indigo-50/5">
                <div className="border-b border-indigo-100 dark:border-indigo-900 pb-2 mb-3">
                  <h3 className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">💥 Firewall & Intrusion Intercept Simulator</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Synthesize penetration threats to test WAF auto-quarantines and observation feeds.</p>
                </div>

                <div className="space-y-2 font-mono text-[10.5px]">
                  <button 
                    onClick={() => runSecuritySimulation('BRUTE_FORCE')}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 border border-slate-200 dark:border-gray-700 rounded-lg text-left flex justify-between items-center transition"
                  >
                    <span>🥊 Simulate Berlin Tor Brute Force Relay</span>
                    <span className="text-red-500 font-extrabold uppercase text-[9px] bg-red-105 px-1.5 py-0.5 rounded">AUTO-BLOCK</span>
                  </button>

                  <button 
                    onClick={() => runSecuritySimulation('WEBHOOK_SPOOF')}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 border border-slate-200 dark:border-gray-700 rounded-lg text-left flex justify-between items-center transition"
                  >
                    <span>🛡️ Spoof WooCommerce HMAC Checksum</span>
                    <span className="text-amber-600 font-extrabold uppercase text-[9px] bg-amber-105 px-1.5 py-0.5 rounded">DENIED</span>
                  </button>

                  <button 
                    onClick={() => runSecuritySimulation('ETIMS_COMPROMISE')}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 border border-slate-200 dark:border-gray-700 rounded-lg text-left flex justify-between items-center transition"
                  >
                    <span>⚠️ Alter KRA Private Key Cert Digest</span>
                    <span className="text-teal-600 font-extrabold uppercase text-[9px] bg-teal-105 px-1.5 py-0.5 rounded">QUARANTINED</span>
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-indigo-150/15 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">Clear all observational events</span>
                  <button 
                    onClick={() => runSecuritySimulation('CLEAR_LOGS')}
                    className="text-slate-450 hover:text-rose-600 font-bold uppercase text-[9px]"
                  >
                    Wipe Logs
                  </button>
                </div>
              </Card>
            </div>

            {/* SECURITY LOGS LEDGER LIST */}
            <div className="lg:col-span-7">
              <Card className="border border-slate-200 dark:border-slate-800">
                <div className="border-b dark:border-slate-805 pb-2 mb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Observable Cybersecurity Audit Ledger</h3>
                    <p className="text-xs text-slate-400 mt-1">Cryptographic handshakes, active admin gateways and remote IP entries log.</p>
                  </div>
                  <span className="font-mono text-[9px] bg-slate-100 text-slate-500 font-black px-2 py-0.5 rounded dark:bg-slate-800 dark:text-slate-400 uppercase tracking-widest animate-pulse">
                    OBSERVABILITY OPEN
                  </span>
                </div>

                <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
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
                      The security audit ledger is empty. Click a simulator module above or fail a login to see reactive items registered!
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
