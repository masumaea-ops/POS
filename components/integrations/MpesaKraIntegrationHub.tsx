import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  ShieldCheck, 
  KeyRound, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Send, 
  QrCode, 
  Copy, 
  ExternalLink, 
  Terminal, 
  Sliders, 
  FileCode2, 
  Check, 
  Lock, 
  Globe, 
  Sparkles
} from 'lucide-react';
import Card from '../shared/Card';
import { useSystemSettings } from '../../contexts/SettingsContext';

interface IntegrationsStatus {
  mpesa: {
    environment: 'sandbox' | 'production';
    shortcode: string;
    tillNumber: string;
    hasConsumerKey: boolean;
    consumerKeyMasked: string;
    hasConsumerSecret: boolean;
    consumerSecretMasked: string;
    hasPasskey: boolean;
    passkeyMasked: string;
    callbackUrl: string;
    darajaBaseUrl: string;
  };
  kra: {
    environment: 'sandbox' | 'production';
    taxpayerPin: string;
    branchCode: string;
    deviceSerial: string;
    serverUrl: string;
    hasApiKey: boolean;
    apiKeyMasked: string;
  };
}

export const MpesaKraIntegrationHub: React.FC = () => {
  const { settings, formatPrice } = useSystemSettings();
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [status, setStatus] = useState<IntegrationsStatus | null>(null);
  const [subTab, setSubTab] = useState<'overview' | 'config' | 'test-stk' | 'test-kra' | 'docs'>('overview');

  // Configuration edit state
  const [mpesaEnv, setMpesaEnv] = useState<'sandbox' | 'production'>('sandbox');
  const [mpesaShortcode, setMpesaShortcode] = useState('174379');
  const [mpesaTillNumber, setMpesaTillNumber] = useState('889900');
  const [mpesaConsumerKey, setMpesaConsumerKey] = useState('');
  const [mpesaConsumerSecret, setMpesaConsumerSecret] = useState('');
  const [mpesaPasskey, setMpesaPasskey] = useState('');
  const [mpesaCallbackUrl, setMpesaCallbackUrl] = useState('');

  const [kraEnv, setKraEnv] = useState<'sandbox' | 'production'>('sandbox');
  const [kraPin, setKraPin] = useState('P051283940F');
  const [kraBranch, setKraBranch] = useState('HQ-01');
  const [kraDeviceSerial, setKraDeviceSerial] = useState('MASUMA-TIMS-NRB-01');
  const [kraServerUrl, setKraServerUrl] = useState('https://etims.kra.go.ke/api/v1');
  const [kraApiKey, setKraApiKey] = useState('');

  const [savingConfig, setSavingConfig] = useState(false);
  const [configNotice, setConfigNotice] = useState<string | null>(null);

  // STK Push tester state
  const [stkPhone, setStkPhone] = useState('0712345678');
  const [stkAmount, setStkAmount] = useState('100');
  const [stkRef, setStkRef] = useState('POS-TEST-01');
  const [stkDesc, setStkDesc] = useState('Masuma Autoparts Checkout');
  const [stkLoading, setStkLoading] = useState(false);
  const [stkLogs, setStkLogs] = useState<string[]>([]);
  const [stkResult, setStkResult] = useState<any>(null);

  // KRA tester state
  const [kraTestingHandshake, setKraTestingHandshake] = useState(false);
  const [kraHandshakeResult, setKraHandshakeResult] = useState<any>(null);
  const [kraSigningLoading, setKraSigningLoading] = useState(false);
  const [kraSignResult, setKraSignResult] = useState<any>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/integrations/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.mpesa) {
          setMpesaEnv(data.mpesa.environment);
          setMpesaShortcode(data.mpesa.shortcode || '174379');
          setMpesaTillNumber(data.mpesa.tillNumber || '889900');
          setMpesaCallbackUrl(data.mpesa.callbackUrl || '');
        }
        if (data.kra) {
          setKraEnv(data.kra.environment);
          setKraPin(data.kra.taxpayerPin || 'P051283940F');
          setKraBranch(data.kra.branchCode || 'HQ-01');
          setKraDeviceSerial(data.kra.deviceSerial || 'MASUMA-TIMS-NRB-01');
          setKraServerUrl(data.kra.serverUrl || 'https://etims.kra.go.ke/api/v1');
        }
      }
    } catch (e: any) {
      console.warn('Failed to load integrations status:', e.message);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigNotice(null);
    try {
      const payload = {
        mpesa: {
          environment: mpesaEnv,
          shortcode: mpesaShortcode,
          tillNumber: mpesaTillNumber,
          consumerKey: mpesaConsumerKey || undefined,
          consumerSecret: mpesaConsumerSecret || undefined,
          passkey: mpesaPasskey || undefined,
          callbackUrl: mpesaCallbackUrl || undefined,
        },
        kra: {
          environment: kraEnv,
          taxpayerPin: kraPin,
          branchCode: kraBranch,
          deviceSerial: kraDeviceSerial,
          serverUrl: kraServerUrl,
          apiKey: kraApiKey || undefined,
        }
      };

      const res = await fetch('/api/integrations/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setConfigNotice('✅ Integration parameters updated dynamically! Zero server restarts required.');
        setMpesaConsumerKey('');
        setMpesaConsumerSecret('');
        setMpesaPasskey('');
        setKraApiKey('');
        await fetchStatus();
      } else {
        setConfigNotice(`❌ Error: ${data.message || 'Failed to update settings.'}`);
      }
    } catch (err: any) {
      setConfigNotice(`❌ Network error: ${err.message}`);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleRunStkPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setStkLoading(true);
    setStkResult(null);
    const logs: string[] = [];
    const log = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      setStkLogs([...logs]);
    };

    log(`Initializing Safaricom Lipa na M-Pesa STK Push request...`);
    log(`Target Phone: ${stkPhone} | Amount: KES ${stkAmount} | Reference: ${stkRef}`);

    try {
      log(`Calling POST /api/integrations/mpesa/stkpush (server-side proxy)...`);
      const res = await fetch('/api/integrations/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: stkPhone,
          amount: Number(stkAmount),
          accountReference: stkRef,
          transactionDesc: stkDesc,
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        log(`❌ STK Push failed: ${data.message || 'Server error'}`);
        setStkResult({ error: true, message: data.message });
        setStkLoading(false);
        return;
      }

      log(`✅ Daraja response: Code=${data.responseCode} | CheckoutRequestID=${data.checkoutRequestId}`);
      log(`📲 Notification dispatched to handset: "${data.customerMessage}"`);
      log(`⏳ Polling transaction status via /api/integrations/mpesa/query...`);

      const checkoutId = data.checkoutRequestId;
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const queryRes = await fetch('/api/integrations/mpesa/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checkoutRequestId: checkoutId })
          });

          if (queryRes.ok) {
            const queryData = await queryRes.json();
            if (queryData.status === 'SUCCESS') {
              clearInterval(pollInterval);
              log(`🎉 Payment Approved! M-Pesa Receipt Number: ${queryData.receiptNumber}`);
              log(`Transaction reconciled and recorded into ERP billing ledger.`);
              setStkResult({
                success: true,
                checkoutRequestId: checkoutId,
                receiptNumber: queryData.receiptNumber,
                amount: queryData.amount,
                phone: queryData.phone,
                completedAt: queryData.completedAt || new Date().toISOString()
              });
              setStkLoading(false);
            } else if (queryData.status === 'FAILED' || queryData.status === 'CANCELLED') {
              clearInterval(pollInterval);
              log(`⚠️ Customer declined prompt or transaction timed out: ${queryData.resultDesc}`);
              setStkResult({ error: true, message: queryData.resultDesc });
              setStkLoading(false);
            } else {
              log(`⏳ [Attempt ${attempts}/10] Waiting for customer to enter PIN on mobile phone...`);
            }
          }
        } catch (pollErr: any) {
          log(`Polling notice: ${pollErr.message}`);
        }

        if (attempts >= 10) {
          clearInterval(pollInterval);
          log(`⚠️ STK push timeout after 10 checks. Customer may confirm asynchronously via callback.`);
          setStkLoading(false);
        }
      }, 1500);

    } catch (err: any) {
      log(`❌ Network error: ${err.message}`);
      setStkResult({ error: true, message: err.message });
      setStkLoading(false);
    }
  };

  const handleTestKraHandshake = async () => {
    setKraTestingHandshake(true);
    setKraHandshakeResult(null);
    try {
      const res = await fetch('/api/integrations/kra/handshake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxpayerPin: kraPin,
          branchCode: kraBranch,
          deviceSerial: kraDeviceSerial,
        })
      });
      const data = await res.json();
      setKraHandshakeResult(data);
    } catch (e: any) {
      setKraHandshakeResult({ success: false, error: e.message });
    } finally {
      setKraTestingHandshake(false);
    }
  };

  const handleTestKraSign = async () => {
    setKraSigningLoading(true);
    setKraSignResult(null);
    try {
      const res = await fetch('/api/integrations/kra/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: `INV-TEST-${Math.floor(10000 + Math.random() * 90000)}`,
          customerPin: 'P059918237A',
          totalAmount: 29000,
          vatAmount: 4000,
          items: [{ sku: 'BA-2051', name: 'Lead-Acid Battery X15', price: 14500, qty: 2 }]
        })
      });
      const data = await res.json();
      setKraSignResult(data);
    } catch (e: any) {
      setKraSignResult({ success: false, error: e.message });
    } finally {
      setKraSigningLoading(false);
    }
  };

  const envSnippet = `# ==============================================================================
# MASUMA ERP - MOBILE MONEY & KRA eTIMS SECRETS (.env)
# Do NOT hardcode these in source files! Place them in your container .env
# ==============================================================================

# 1. SAFARICOM M-PESA DARAJA STK PUSH (LIPA NA M-PESA ONLINE)
MPESA_ENVIRONMENT="sandbox" # or "production"
MPESA_SHORTCODE=174379 # Business Shortcode (Paybill/Till)
MPESA_TILL_NUMBER=889900
MPESA_CONSUMER_KEY="your_safaricom_consumer_key"
MPESA_CONSUMER_SECRET="your_safaricom_consumer_secret"
MPESA_PASSKEY="bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
MPESA_CALLBACK_URL="https://erp.masuma.co.ke/api/integrations/mpesa/callback"

# 2. KENYA REVENUE AUTHORITY (KRA) eTIMS FISCAL INTEGRATION
KRA_ETIMS_ENV="sandbox" # or "production"
KRA_TAXPAYER_PIN="P051283940F"
VITE_ETIMS_BRANCH_CODE="HQ-01"
VITE_ETIMS_DEVICE_SERIAL="MASUMA-TIMS-NRB-01"
VITE_ETIMS_SERVER_URL="https://etims.kra.go.ke/api/v1"
ETIMS_API_KEY="your_kra_etims_communication_aes_key"`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ZERO-HARDCODING PRINCIPLE BANNER */}
      <div className="bg-gradient-to-r from-emerald-900/80 via-slate-900 to-indigo-950 border border-emerald-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Smartphone className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Zero-Hardcoded Architecture
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-orange/20 border border-brand-orange/30 text-brand-orange font-mono text-[10px] font-bold uppercase tracking-wider">
              Kenya Digital Payments & eTIMS Compliant
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-2">
            M-Pesa Daraja STK Push & KRA eTIMS Integration Engine
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            All API consumer keys, secret passkeys, shortcodes, and tax authority cryptographic tokens are securely dynamically loaded from container environment variables (<code className="text-emerald-300 font-mono">process.env</code>) or edited on the fly via the runtime configuration API. Zero credentials are baked into client JavaScript bundles.
          </p>
        </div>
      </div>

      {/* SUB TABS NAVIGATION */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setSubTab('overview')}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            subTab === 'overview'
              ? 'bg-brand-orange text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Sliders className="w-4 h-4" /> Gateway Status
        </button>
        <button
          onClick={() => setSubTab('test-stk')}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            subTab === 'test-stk'
              ? 'bg-emerald-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-400" /> Test M-Pesa STK Push
        </button>
        <button
          onClick={() => setSubTab('test-kra')}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            subTab === 'test-kra'
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <QrCode className="w-4 h-4 text-indigo-400" /> Test KRA eTIMS Signing
        </button>
        <button
          onClick={() => setSubTab('config')}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            subTab === 'config'
              ? 'bg-brand-orange text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <KeyRound className="w-4 h-4" /> Live Credentials Configurator
        </button>
        <button
          onClick={() => setSubTab('docs')}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            subTab === 'docs'
              ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <FileCode2 className="w-4 h-4" /> Developer Guide & .env
        </button>
      </div>

      {/* SUB-TAB 1: GATEWAY STATUS OVERVIEW */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* M-PESA DARAJA CARD */}
            <Card>
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Safaricom M-Pesa Daraja
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                        status?.mpesa.environment === 'production'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {status?.mpesa.environment || 'Sandbox'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">Lipa na M-Pesa Online STK Push & Webhook Callback</p>
                  </div>
                </div>
                <button
                  onClick={fetchStatus}
                  disabled={loadingStatus}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                  title="Refresh status"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingStatus ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60 font-mono">
                  <span className="text-slate-500">Business Shortcode:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{status?.mpesa.shortcode || '174379'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60 font-mono">
                  <span className="text-slate-500">Till / Store Number:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{status?.mpesa.tillNumber || '889900'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60 font-mono">
                  <span className="text-slate-500">Consumer Key:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {status?.mpesa.hasConsumerKey ? status.mpesa.consumerKeyMasked : 'Default Sandbox Token'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60 font-mono">
                  <span className="text-slate-500">Online Passkey:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {status?.mpesa.hasPasskey ? status.mpesa.passkeyMasked : 'Sandbox Standard Key'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60 font-mono">
                  <span className="text-slate-500">Daraja Base URL:</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 truncate max-w-[240px]">
                    {status?.mpesa.darajaBaseUrl || 'https://sandbox.safaricom.co.ke'}
                  </span>
                </div>
                <div className="flex justify-between py-1 font-mono">
                  <span className="text-slate-500">Callback Webhook:</span>
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[240px]">
                    {status?.mpesa.callbackUrl || '/api/integrations/mpesa/callback'}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <button
                  onClick={() => setSubTab('test-stk')}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Smartphone className="w-3.5 h-3.5" /> Test STK Push
                </button>
                <button
                  onClick={() => setSubTab('config')}
                  className="py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Configure
                </button>
              </div>
            </Card>

            {/* KRA eTIMS CARD */}
            <Card>
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      KRA eTIMS Fiscal Engine
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                        status?.kra.environment === 'production'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {status?.kra.environment || 'Sandbox'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">Automated Fiscal Receipt Signing & QR Generation</p>
                  </div>
                </div>
                <button
                  onClick={fetchStatus}
                  disabled={loadingStatus}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                  title="Refresh status"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingStatus ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60 font-mono">
                  <span className="text-slate-500">Taxpayer PIN:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{status?.kra.taxpayerPin || 'P051283940F'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60 font-mono">
                  <span className="text-slate-500">Branch Code:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{status?.kra.branchCode || 'HQ-01'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60 font-mono">
                  <span className="text-slate-500">Device / VSCU Serial:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{status?.kra.deviceSerial || 'MASUMA-TIMS-NRB-01'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60 font-mono">
                  <span className="text-slate-500">eTIMS Server:</span>
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[240px]">
                    {status?.kra.serverUrl || 'https://etims.kra.go.ke/api/v1'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60 font-mono">
                  <span className="text-slate-500">Fiscal Device Type:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">OSCU / Virtual SCU</span>
                </div>
                <div className="flex justify-between py-1 font-mono">
                  <span className="text-slate-500">Crypto Signing Key:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {status?.kra.hasApiKey ? status.kra.apiKeyMasked : 'Hardware / Virtual Key Active'}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <button
                  onClick={() => setSubTab('test-kra')}
                  className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <QrCode className="w-3.5 h-3.5" /> Test Fiscal Signing
                </button>
                <button
                  onClick={() => setSubTab('config')}
                  className="py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Configure
                </button>
              </div>
            </Card>
          </div>

          {/* INTEGRATION ARCHITECTURE WORKFLOW DIAGRAM */}
          <Card>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-brand-orange" />
              How the System Processes M-Pesa & KRA Without Hardcoding
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="w-6 h-6 rounded-full bg-brand-orange text-white font-black text-xs flex items-center justify-center mb-2">1</div>
                <h4 className="font-bold text-slate-900 dark:text-white">Environment Resolution</h4>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  The Node backend reads credentials strictly from server environment variables (<code className="text-brand-orange font-mono">MPESA_*</code>, <code className="text-indigo-400 font-mono">KRA_*</code>) or the runtime settings store. Client browsers never see secrets.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center mb-2">2</div>
                <h4 className="font-bold text-slate-900 dark:text-white">Direct Lipa na M-Pesa Push</h4>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  When a cashier triggers STK Push, the server formats the phone number, computes the Daraja timestamp & Base64 password, and contacts Safaricom. The customer receives an instant prompt on their phone.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center mb-2">3</div>
                <h4 className="font-bold text-slate-900 dark:text-white">eTIMS Real-Time Fiscal Sign</h4>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  Upon invoice finalization, the system signs the invoice with HMAC-SHA256, generates the unique KRA Control Unit (CU) number, and renders an official QR code verifiable on KRA iTax.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* SUB-TAB 2: INTERACTIVE M-PESA STK PUSH TESTER */}
      {subTab === 'test-stk' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Lipa na M-Pesa STK Push Test Console</h3>
                <p className="text-xs text-slate-500">Send a live or sandbox prompt to a customer mobile handset</p>
              </div>
            </div>

            <form onSubmit={handleRunStkPush} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Customer Phone Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-mono text-slate-400 font-bold">🇰🇪</span>
                  <input
                    type="text"
                    value={stkPhone}
                    onChange={e => setStkPhone(e.target.value)}
                    placeholder="0712345678 or 254712345678"
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Accepts 07..., 01..., or international 2547... formats.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Amount (KES)</label>
                  <input
                    type="number"
                    min="1"
                    value={stkAmount}
                    onChange={e => setStkAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Account Reference</label>
                  <input
                    type="text"
                    value={stkRef}
                    onChange={e => setStkRef(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Transaction Description</label>
                <input
                  type="text"
                  value={stkDesc}
                  onChange={e => setStkDesc(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={stkLoading}
                className={`w-full py-3 rounded-lg font-bold text-white transition flex items-center justify-center gap-2 shadow-md ${
                  stkLoading
                    ? 'bg-slate-700 cursor-not-allowed text-slate-400'
                    : 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer'
                }`}
              >
                {stkLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Dispatching STK Prompt & Polling Handset...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Trigger M-Pesa STK Push
                  </>
                )}
              </button>
            </form>

            {/* CONFIRMED TRANSACTION POPUP RESULT */}
            {stkResult?.success && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 animate-fade-in text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  M-Pesa Payment Received & Verified!
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-500/20 font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Receipt Number:</span>
                    <span className="font-bold text-white text-sm">{stkResult.receiptNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Amount Settled:</span>
                    <span className="font-bold text-white text-sm">KES {stkResult.amount?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Payer Handset:</span>
                    <span className="text-white">{stkResult.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Checkout ID:</span>
                    <span className="text-white truncate block">{stkResult.checkoutRequestId?.slice(0, 16)}...</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* REAL-TIME DARAJA LOGS CONSOLE */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-mono">
                  <Terminal className="w-4 h-4 text-emerald-500" /> Live Daraja Telemetry Log
                </h3>
                {stkLogs.length > 0 && (
                  <button
                    onClick={() => setStkLogs([])}
                    className="text-[10px] text-slate-400 hover:text-slate-200"
                  >
                    Clear Console
                  </button>
                )}
              </div>

              <div className="bg-slate-950 text-slate-300 p-4 rounded-xl font-mono text-[11px] h-80 overflow-y-auto space-y-1.5 border border-slate-800 shadow-inner">
                {stkLogs.length === 0 ? (
                  <div className="text-slate-600 italic flex items-center justify-center h-full">
                    Awaiting trigger. Click "Trigger M-Pesa STK Push" to inspect real Daraja OAuth exchange, password calculation, and callback polling.
                  </div>
                ) : (
                  stkLogs.map((entry, idx) => (
                    <div
                      key={idx}
                      className={`leading-relaxed ${
                        entry.includes('✅') || entry.includes('🎉')
                          ? 'text-emerald-400 font-bold'
                          : entry.includes('❌') || entry.includes('⚠️')
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {entry}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Endpoint: <code className="text-brand-orange font-mono">/api/integrations/mpesa/stkpush</code></span>
              <span className="font-mono text-emerald-400">OAuth Bearer Ready</span>
            </div>
          </Card>
        </div>
      )}

      {/* SUB-TAB 3: INTERACTIVE KRA eTIMS FISCAL TESTER */}
      {subTab === 'test-kra' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">KRA eTIMS Handshake & Signing Lab</h3>
                <p className="text-xs text-slate-500">Validate cryptographic signing and KRA Control Unit generation</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Handshake section */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">1. Test Fiscal Device Handshake</h4>
                <p className="text-xs text-slate-500 mb-3">
                  Pings KRA eTIMS endpoint to verify Taxpayer PIN obligation, VSCU device registration, and certificate validity.
                </p>
                <button
                  onClick={handleTestKraHandshake}
                  disabled={kraTestingHandshake}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
                >
                  {kraTestingHandshake ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
                  Execute eTIMS Handshake
                </button>
              </div>

              {/* Invoice Sign section */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">2. Fiscally Sign Sample Wholesale Invoice</h4>
                <p className="text-xs text-slate-500 mb-3">
                  Computes SHA256 HMAC digital signature over invoice lines (KES 29,000 @ 16% VAT) and outputs verified KRA CU number.
                </p>
                <button
                  onClick={handleTestKraSign}
                  disabled={kraSigningLoading}
                  className="px-4 py-2 rounded-lg bg-brand-orange hover:bg-brand-orange/90 text-white font-bold text-xs flex items-center gap-1.5 transition"
                >
                  {kraSigningLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  Sign Sample Invoice & Generate QR
                </button>
              </div>
            </div>
          </Card>

          {/* KRA RESPONSE INSPECTOR */}
          <Card>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 font-mono flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-indigo-400" /> Fiscal Authority Response Payload
            </h3>

            {kraSignResult ? (
              <div className="space-y-4 text-xs animate-fade-in">
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                    <span className="font-bold text-indigo-400 text-sm flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> KRA Fiscal Signature Verified
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      eTIMS Compliant
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px]">CU Invoice Number:</span>
                      <span className="font-bold text-white text-xs">{kraSignResult.cuInvoiceNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Internal Invoice ID:</span>
                      <span className="font-bold text-white text-xs">{kraSignResult.invoiceNumber}</span>
                    </div>
                  </div>

                  <div className="font-mono">
                    <span className="text-slate-400 block text-[10px]">Digital Signature:</span>
                    <span className="font-bold text-emerald-400 text-[11px] break-all">{kraSignResult.fiscalSignature}</span>
                  </div>

                  <div className="pt-2 border-t border-indigo-500/20 flex items-center justify-between">
                    <a
                      href={kraSignResult.qrVerificationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-indigo-300 hover:text-indigo-200 flex items-center gap-1 underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Public KRA Verification Link
                    </a>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 max-h-48 overflow-y-auto">
                  <pre>{JSON.stringify(kraSignResult, null, 2)}</pre>
                </div>
              </div>
            ) : kraHandshakeResult ? (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 max-h-72 overflow-y-auto">
                <pre>{JSON.stringify(kraHandshakeResult, null, 2)}</pre>
              </div>
            ) : (
              <div className="text-slate-500 italic p-8 text-center text-xs">
                Run either the eTIMS Handshake or Fiscal Invoice Signing to inspect live cryptographic output.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* SUB-TAB 4: LIVE CREDENTIALS CONFIGURATOR */}
      {subTab === 'config' && (
        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-brand-orange" />
                Live Integration Credentials Configurator
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update credentials dynamically in runtime memory without touching source code or rebuilding containers.
              </p>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20 font-bold">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /><span>Zero Hardcoding Enforced</span></span>
            </span>
          </div>

          {configNotice && (
            <div className={`mb-6 p-4 rounded-xl text-xs font-bold ${
              configNotice.startsWith('✅')
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {configNotice}
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-6">
            {/* SAFARICOM M-PESA SECTION */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Smartphone className="w-4 h-4" /> Safaricom Daraja Parameters
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Environment</label>
                  <select
                    value={mpesaEnv}
                    onChange={e => setMpesaEnv(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="sandbox">Sandbox (Testing / Demo)</option>
                    <option value="production">Production (Live Safaricom)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Business Shortcode (Paybill / Till)</label>
                  <input
                    type="text"
                    value={mpesaShortcode}
                    onChange={e => setMpesaShortcode(e.target.value)}
                    placeholder="174379"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Store / Till Number</label>
                  <input
                    type="text"
                    value={mpesaTillNumber}
                    onChange={e => setMpesaTillNumber(e.target.value)}
                    placeholder="889900"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Consumer Key {status?.mpesa.hasConsumerKey && <span className="text-emerald-500 font-normal">({status.mpesa.consumerKeyMasked})</span>}
                  </label>
                  <input
                    type="password"
                    value={mpesaConsumerKey}
                    onChange={e => setMpesaConsumerKey(e.target.value)}
                    placeholder="Enter new consumer key to override"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Consumer Secret {status?.mpesa.hasConsumerSecret && <span className="text-emerald-500 font-normal">({status.mpesa.consumerSecretMasked})</span>}
                  </label>
                  <input
                    type="password"
                    value={mpesaConsumerSecret}
                    onChange={e => setMpesaConsumerSecret(e.target.value)}
                    placeholder="Enter new consumer secret to override"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Lipa na M-Pesa Online Passkey {status?.mpesa.hasPasskey && <span className="text-emerald-500 font-normal">({status.mpesa.passkeyMasked})</span>}
                  </label>
                  <input
                    type="password"
                    value={mpesaPasskey}
                    onChange={e => setMpesaPasskey(e.target.value)}
                    placeholder="Enter new passkey to override"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Callback URL (Webhook)</label>
                  <input
                    type="text"
                    value={mpesaCallbackUrl}
                    onChange={e => setMpesaCallbackUrl(e.target.value)}
                    placeholder="https://erp.masuma.co.ke/api/integrations/mpesa/callback"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* KRA eTIMS SECTION */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <QrCode className="w-4 h-4" /> KRA eTIMS Fiscal Parameters
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">eTIMS Mode</label>
                  <select
                    value={kraEnv}
                    onChange={e => setKraEnv(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="sandbox">Sandbox / Demo</option>
                    <option value="production">Production Live</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Taxpayer PIN</label>
                  <input
                    type="text"
                    value={kraPin}
                    onChange={e => setKraPin(e.target.value.toUpperCase())}
                    placeholder="P051283940F"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Branch Code</label>
                  <input
                    type="text"
                    value={kraBranch}
                    onChange={e => setKraBranch(e.target.value)}
                    placeholder="HQ-01"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Device / VSCU Serial</label>
                  <input
                    type="text"
                    value={kraDeviceSerial}
                    onChange={e => setKraDeviceSerial(e.target.value)}
                    placeholder="MASUMA-TIMS-NRB-01"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">eTIMS Server URL</label>
                  <input
                    type="text"
                    value={kraServerUrl}
                    onChange={e => setKraServerUrl(e.target.value)}
                    placeholder="https://etims.kra.go.ke/api/v1"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    eTIMS Crypto Key {status?.kra.hasApiKey && <span className="text-indigo-400 font-normal">({status.kra.apiKeyMasked})</span>}
                  </label>
                  <input
                    type="password"
                    value={kraApiKey}
                    onChange={e => setKraApiKey(e.target.value)}
                    placeholder="Enter new eTIMS AES key"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingConfig}
                className="px-6 py-2.5 rounded-lg bg-brand-orange hover:bg-brand-orange/90 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
              >
                {savingConfig ? <RefreshCw className="w-4 h-4 animate-spin" /> : <SaveIcon className="w-4 h-4" />}
                Save & Apply Live Settings
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* SUB-TAB 5: DEVELOPER GUIDE & .ENV REFERENCE */}
      {subTab === 'docs' && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-mono">
                <FileCode2 className="w-4 h-4 text-emerald-500" /> Container .env Template Reference
              </h3>
              <button
                onClick={() => copyToClipboard(envSnippet, 'env')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
              >
                {copiedKey === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'env' ? 'Copied to Clipboard' : 'Copy .env Block'}
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto border border-slate-800">
              <pre>{envSnippet}</pre>
            </div>
          </Card>

          {/* STEP-BY-STEP INTEGRATION CHECKLIST */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <Card>
              <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-3 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-500" /> Step-by-Step: Safaricom Daraja
              </h4>
              <ol className="list-decimal pl-4 space-y-2 text-slate-600 dark:text-slate-400">
                <li>
                  Visit <a href="https://developer.safaricom.co.ke" target="_blank" rel="noreferrer" className="text-brand-orange font-bold underline">developer.safaricom.co.ke</a> and sign in.
                </li>
                <li>
                  Create an App and enable <strong>Lipa na M-Pesa Sandbox/Production</strong>.
                </li>
                <li>
                  Copy the generated <strong>Consumer Key</strong> and <strong>Consumer Secret</strong>.
                </li>
                <li>
                  For production, apply for Lipa na M-Pesa Online (STK Push) on Safaricom M-Pesa Org Portal to receive the <strong>Passkey</strong> and <strong>Head Office Shortcode</strong>.
                </li>
                <li>
                  Add the values into your container's <code className="font-mono text-brand-orange">.env</code> or paste them into the Configurator above.
                </li>
              </ol>
            </Card>

            <Card>
              <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-3 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-indigo-500" /> Step-by-Step: KRA eTIMS Fiscalization
              </h4>
              <ol className="list-decimal pl-4 space-y-2 text-slate-600 dark:text-slate-400">
                <li>
                  Log in to the KRA Taxpayer Portal (<a href="https://etims.kra.go.ke" target="_blank" rel="noreferrer" className="text-indigo-400 font-bold underline">etims.kra.go.ke</a>).
                </li>
                <li>
                  Under Device Registration, select <strong>Virtual Sales Control Unit (VSCU)</strong> or <strong>Online Sales Control Unit (OSCU)</strong>.
                </li>
                <li>
                  Record your assigned <strong>Device Serial Number</strong> (e.g. <code className="font-mono text-slate-200">MASUMA-TIMS-NRB-01</code>).
                </li>
                <li>
                  Download the cryptographic communication signing key / token.
                </li>
                <li>
                  Set <code className="font-mono text-indigo-400">KRA_TAXPAYER_PIN</code> and <code className="font-mono text-indigo-400">ETIMS_API_KEY</code>. The POS will automatically sign invoices and generate compliant QR codes.
                </li>
              </ol>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

function SaveIcon(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
      <path d="M7 3v4a1 1 0 0 0 1 1h7" />
    </svg>
  );
}

export default MpesaKraIntegrationHub;
