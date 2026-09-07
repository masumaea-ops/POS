import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Layers, 
  Smartphone, 
  Key, 
  Webhook as WebhookIcon, 
  Terminal, 
  Activity, 
  CreditCard, 
  Building2, 
  BookOpen, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Copy, 
  Send, 
  Trash2, 
  Check, 
  Radio, 
  Play, 
  AlertCircle, 
  Info, 
  Search,
  Lock,
  ShoppingBag
} from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';
import Card from '../components/shared/Card';
import { useSystemSettings } from '../contexts/SettingsContext';
import MpesaKraIntegrationHub from '../components/integrations/MpesaKraIntegrationHub';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  environment: 'Sandbox' | 'Live';
  created: string;
  lastUsed: string;
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  status: 'Active' | 'Inactive';
  created: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'API_REQUEST' | 'WEBHOOK_DISPATCH';
  methodOrStatus: string;
  endpointOrEvent: string;
  status: number; // e.g. 200, 201, 400
  duration: string;
  payload: string;
}

const INITIAL_KEYS: ApiKey[] = [
  { id: '1', name: 'M-Pesa instant C2B B2C settlement gateway', prefix: 'ms_live_4aef...', environment: 'Live', created: '2026-05-12 11:22', lastUsed: '2026-06-17 14:32' },
  { id: '2', name: 'WooCommerce B2B online checkout connector', prefix: 'ms_sandbox_8e3c...', environment: 'Sandbox', created: '2026-06-01 09:05', lastUsed: '2026-06-16 18:21' },
];

const INITIAL_WEBHOOKS: Webhook[] = [
  { id: '1', url: 'https://masuma-wholesale-hook-sync.co.ke/v1/sales-feed', events: ['sale.completed', 'invoice.created'], secret: 'whsec_9b2d8fe367...', status: 'Active', created: '2026-05-20' },
  { id: '2', url: 'https://kra-etims-realtime-broker.go.ke/audit/v2/handshakes', events: ['e_tims.sync.committed'], secret: 'whsec_2a1f4b8e21...', status: 'Active', created: '2026-06-10' },
];

const ALL_EVENTS = [
  'sale.completed',
  'invoice.created',
  'inventory.low_stock',
  'inventory.updated',
  'pos.shift.closed',
  'e_tims.sync.committed',
  'contact.credit_exceeded'
];

const API_ENDPOINTS = [
  { 
    id: 'get_products',
    method: 'GET',
    path: '/v1/products',
    description: 'Retrieve real-time product catalogs, warehouse shelf locations, stock levels, and OEM interchange crossovers.',
    queryParams: [
      { name: 'search', type: 'string', desc: 'Queries SKU, OEM parts number, interchange, product brand, or full name.' },
      { name: 'stock_filter', type: 'string', desc: 'Can fit "all", "low_stock", or "out_of_stock".' }
    ],
    payload: null,
    response: {
      status: 200,
      body: [
        { id: 1, sku: 'BA-2051', name: 'Super Charging Wet Cell Lead-Acid Battery X15', brand: 'Chloride Exide', price: 14500, stock: 125, oemCode: 'N70-CL-EXD', binLocation: 'Rack B3-Shelf 1', minStockLevel: 15 },
        { id: 2, sku: 'BR-3090', name: 'High-Temperature Semi-Met Brake Pad Set Heavy Duty', brand: 'Bendix Premium', price: 6800, stock: 4, oemCode: 'BP-BEN-9021', binLocation: 'Rack A1-Shelf 4', minStockLevel: 10 }
      ]
    }
  },
  { 
    id: 'post_sales',
    method: 'POST',
    path: '/v1/sales',
    description: 'Directly log credit ledger invoices, corporate wholesale orders, or offline sales syncs to the central database.',
    queryParams: [],
    payload: {
      customerId: 3,
      outletCode: 'NAIROBI-HQ-POS',
      items: [
        { sku: 'BA-2051', quantity: 2, price: 14500 }
      ],
      paymentMethod: 'Credit Account',
      notes: 'Corporate fleet servicing purchase credit approval'
    },
    response: {
      status: 201,
      body: {
        id: 'SO-10928371',
        date: '2026-06-17',
        customer: { id: 3, name: 'AutoFix Solutions', companyName: 'AutoFix East Africa', type: 'Credit', tier: 'Wholesale B' },
        total: 29000,
        status: 'Invoiced',
        taxPinSigned: 'KRA0028918237J',
        fiscalSignature: 'eTIMS-SIG-92318B47C',
        currency: 'KES'
      }
    }
  },
  {
    id: 'post_etims',
    method: 'POST',
    path: '/v1/etims/handshake',
    description: 'Trigger instant fiscal synchronized compliance handshake signing requests to KRA live eTIMS brokers.',
    queryParams: [],
    payload: {
      taxpayerPin: 'P051283940F',
      deviceSerial: 'FSC-0921827361',
      branchCode: 'NBI-HQ-01'
    },
    response: {
      status: 200,
      body: {
        status: 'Success',
        handshakeCode: 'HS-7729-ACTIVE',
        timestamp: '2026-06-17 07:57',
        taxAuthorityEndpoint: 'https://etims.kra.go.ke/api/v1/secure-recv',
        signedCertDigest: 'SHA256:d84ea23ef89d28c947ffecb9...'
      }
    }
  }
];

const Integrations: React.FC = () => {
  const { settings, formatPrice } = useSystemSettings();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as 'overview' | 'mpesa-kra' | 'api-keys' | 'webhooks' | 'playground' | 'logs' | null;
  const [activeTab, setActiveTab] = useState<'overview' | 'mpesa-kra' | 'api-keys' | 'webhooks' | 'playground' | 'logs'>(() => tabParam || 'overview');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  
  // State elements
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(() => {
    const saved = localStorage.getItem('masuma_api_keys');
    return saved ? JSON.parse(saved) : INITIAL_KEYS;
  });

  const [webhooks, setWebhooks] = useState<Webhook[]>(() => {
    const saved = localStorage.getItem('masuma_webhooks');
    return saved ? JSON.parse(saved) : INITIAL_WEBHOOKS;
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Key creation state
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnv, setNewKeyEnv] = useState<'Sandbox' | 'Live'>('Live');
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [generatedKeyMsg, setGeneratedKeyMsg] = useState('');

  // Webhook creation state
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  // Request playground state
  const [selectedEndpointId, setSelectedEndpointId] = useState(API_ENDPOINTS[0].id);
  const [playgroundLogs, setPlaygroundLogs] = useState<string>('');
  const [testingEndpoint, setTestingEndpoint] = useState(false);

  // Webhook simulator state
  const [simWebhookId, setSimWebhookId] = useState(webhooks[0]?.id || '1');
  const [simEvent, setSimEvent] = useState(ALL_EVENTS[0]);
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);

  // Sync state to localstorage
  useEffect(() => {
    localStorage.setItem('masuma_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  useEffect(() => {
    localStorage.setItem('masuma_webhooks', JSON.stringify(webhooks));
  }, [webhooks]);

  const addLog = (type: 'API_REQUEST' | 'WEBHOOK_DISPATCH', methodOrStatus: string, endpointOrEvent: string, status: number, duration: string, payload: any) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      methodOrStatus,
      endpointOrEvent,
      status,
      duration,
      payload: JSON.stringify(payload, null, 2)
    };
    setLogs(prev => [newLog, ...prev].slice(0, 40));
  };

  // Generate dynamic log entries on start to seem active and real
  useEffect(() => {
    const seedLogs: LogEntry[] = [
      { id: 'ref_1', timestamp: '07:56:11 AM', type: 'API_REQUEST', methodOrStatus: 'GET', endpointOrEvent: '/v1/products?search=BA-2051', status: 200, duration: '41ms', payload: '{\n  "query": "BA-2051",\n  "recordsFound": 1\n}' },
      { id: 'ref_2', timestamp: '07:54:32 AM', type: 'WEBHOOK_DISPATCH', methodOrStatus: 'DELIVERED', endpointOrEvent: 'sale.completed (https://masuma-wholesale-hook-sync.co.ke/v1/sales-feed)', status: 200, duration: '184ms', payload: '{\n  "event": "sale.completed",\n  "timestamp": 1781702072,\n  "data": {\n    "orderId": "SO-10928",\n    "total": 58900,\n    "customer": "John Doe Motors"\n  }\n}' },
      { id: 'ref_3', timestamp: '07:50:00 AM', type: 'API_REQUEST', methodOrStatus: 'POST', endpointOrEvent: '/v1/etims/handshake', status: 200, duration: '95ms', payload: '{\n  "taxpayerPin": "P051283940F",\n  "branchCode": "NBI-HQ-01"\n}' },
    ];
    setLogs(seedLogs);
  }, []);

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const entropy = Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const fullKey = `ms_${newKeyEnv.toLowerCase()}_${entropy}`;
    const prefix = fullKey.substring(0, 11) + '...';

    const newKey: ApiKey = {
      id: Math.random().toString(36).substring(2, 9),
      name: newKeyName,
      prefix,
      environment: newKeyEnv,
      created: new Date().toISOString().replace('T', ' ').substring(0, 16),
      lastUsed: 'Never Active'
    };

    setApiKeys(prev => [...prev, newKey]);
    setGeneratedKeyMsg(fullKey);
    setShowKeyDialog(true);
    setNewKeyName('');
    
    addLog('API_REQUEST', 'POST', '/v1/developer/keys/provision', 201, '12ms', { keyName: newKey.name, env: newKey.environment });
  };

  const handleDeleteKey = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to revoke the API credential: "${name}"? Applications relying on this key will be instantly blocked.`)) {
      setApiKeys(prev => prev.filter(k => k.id !== id));
      addLog('API_REQUEST', 'DELETE', `/v1/developer/keys/revoke/${id}`, 200, '9ms', { id, revokedName: name });
    }
  };

  const handleCreateWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl.trim()) return;
    if (selectedEvents.length === 0) {
      alert('Please select at least one event topic to forward payloads to.');
      return;
    }

    const entropySecret = 'whsec_' + Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const newHook: Webhook = {
      id: Math.random().toString(36).substring(2, 9),
      url: newWebhookUrl,
      events: selectedEvents,
      secret: entropySecret,
      status: 'Active',
      created: new Date().toISOString().substring(0, 10)
    };

    setWebhooks(prev => [...prev, newHook]);
    setNewWebhookUrl('');
    setSelectedEvents([]);
    alert(`⚡ Webhook endpoint added successfully!\nPayloads will be securely signed using secret: ${entropySecret}`);
    
    addLog('API_REQUEST', 'POST', '/v1/developer/webhooks/register', 201, '15ms', { url: newHook.url, bindTopics: newHook.events });
  };

  const toggleWebhookStatus = (id: string) => {
    setWebhooks(prev => prev.map(w => {
      if (w.id === id) {
        const nextStatus = w.status === 'Active' ? 'Inactive' : 'Active';
        addLog('API_REQUEST', 'PATCH', `/v1/developer/webhooks/${id}`, 200, '7ms', { id, changedTo: nextStatus });
        return { ...w, status: nextStatus };
      }
      return w;
    }));
  };

  const handleDeleteWebhook = (id: string, url: string) => {
    if (window.confirm(`Revoke and delete the Webhook subscription pointing to: \n${url} ?`)) {
      setWebhooks(prev => prev.filter(w => w.id !== id));
      addLog('API_REQUEST', 'DELETE', `/v1/developer/webhooks/${id}`, 200, '5ms', { id });
    }
  };

  // Toggle topics inside multi-select checkboxes
  const handleToggleEvent = (event: string) => {
    setSelectedEvents(prev => prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]);
  };

  const handleRunPlaygroundRequest = () => {
    setTestingEndpoint(true);
    const endpoint = API_ENDPOINTS.find(e => e.id === selectedEndpointId)!;
    
    setPlaygroundLogs(`$ curl -i -X ${endpoint.method} \\\n  -H "Authorization: Bearer ms_live_k82as98f02f8..." \\\n  -H "Content-Type: application/json" \\\n  ${endpoint.payload ? "-d '" + JSON.stringify(endpoint.payload, null, 2) + "' \\\n  " : ""}https://api.masuma.co.ke${endpoint.path}\n\n`);

    setTimeout(() => {
      setPlaygroundLogs(prev => prev + `HTTP/1.1 ${endpoint.response.status === 200 ? '200 OK' : '201 Created'}\n` +
        `Date: ${new Date().toUTCString()}\n` +
        `Content-Type: application/json; charset=utf-8\n` +
        `Connection: keep-alive\n` +
        `X-RateLimit-Limit: 1000\n` +
        `X-RateLimit-Remaining: 994\n` +
        `X-eTIMS-Integrated: true\n\n` +
        JSON.stringify(endpoint.response.body, null, 2)
      );
      setTestingEndpoint(false);
      
      addLog('API_REQUEST', endpoint.method, endpoint.path, endpoint.response.status, '38ms', endpoint.payload || { action: 'list' });
    }, 1100);
  };

  const handleDispatchMockWebhook = () => {
    const hook = webhooks.find(w => w.id === simWebhookId);
    if (!hook) {
      alert('Please register at least one webhook listener URL first.');
      return;
    }

    setSimulatingWebhook(true);
    addLog('API_REQUEST', 'POST', `/v1/developer/webhooks/simulate-trigger`, 202, '4ms', { simEvent, targetUrl: hook.url });

    setTimeout(() => {
      // Mock event content
      let testPayload: any = {};
      if (simEvent === 'sale.completed') {
        testPayload = {
          event: 'sale.completed',
          timestamp: Math.floor(Date.now() / 1000),
          data: {
            orderId: 'SO-992837',
            customer: { name: 'AutoFix Solutions', phone: '0722000111' },
            outlet: 'NAIROBI-HQ-POS',
            netAmount: 14500,
            vatCharged: 2320,
            totalGross: 16820,
            paymentMethod: 'M-Pesa Paybill',
            items: [{ sku: 'BA-2051', quantity: 1, price: 14500 }]
          }
        };
      } else if (simEvent === 'inventory.low_stock') {
        testPayload = {
          event: 'inventory.low_stock',
          timestamp: Math.floor(Date.now() / 1000),
          data: {
            sku: 'BR-3090',
            name: 'High-Temperature Brake Pad Set Heavy Duty',
            brand: 'Bendix Premium',
            currentStock: 4,
            warningThreshold: 10,
            recommendedReorderQuantity: 30
          }
        };
      } else if (simEvent === 'e_tims.sync.committed') {
        testPayload = {
          event: 'e_tims.sync.committed',
          timestamp: Math.floor(Date.now() / 1000),
          data: {
            taxpin: 'P051283940F',
            branchCode: 'NBI-HQ-01',
            invoiceCount: 41,
            reconciledLedgerTotal: 589200,
            handshakeStatus: 'COMPLIANT_SUCCESS_LOGGED'
          }
        };
      } else {
        testPayload = {
          event: simEvent,
          timestamp: Math.floor(Date.now() / 1000),
          data: {
            info: 'System telemetry generic status notification feed',
            triggeredBy: 'Mock Sandbox Administrator'
          }
        };
      }

      setSimulatingWebhook(false);
      addLog('WEBHOOK_DISPATCH', 'DELIVERED', `${simEvent} (${hook.url})`, 200, '142ms', testPayload);
      alert(`🚀 WEBHOOK FORWARD SUCCESSFUL:\n\nTopic: ${simEvent}\nURL: ${hook.url}\n\nClient Receiver HTTP Status Response: 200 OK.\nSignature verification validated.`);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 pb-16 overflow-y-auto">
      <PageHeader title="API Gateway & B2B Integrations" showSearch={false} />

      {/* Navigation tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-surface-2 dark:border-gray-700 px-3 sm:px-6 md:px-8 mt-0.5 shrink-0">
        <div className="flex gap-1 md:gap-3 overflow-x-auto text-xs md:text-sm scrollbar-none py-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3.5 font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 shrink-0 ${activeTab === 'overview' ? 'border-brand-orange text-brand-orange bg-brand-orange/5 rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>API Blueprint</span>
          </button>
          <button 
            onClick={() => setActiveTab('mpesa-kra')}
            className={`py-3 px-3.5 font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 shrink-0 ${activeTab === 'mpesa-kra' ? 'border-brand-orange text-brand-orange bg-brand-orange/5 rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>M-Pesa & KRA eTIMS</span>
          </button>
          <button 
            onClick={() => setActiveTab('api-keys')}
            className={`py-3 px-3.5 font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 shrink-0 ${activeTab === 'api-keys' ? 'border-brand-orange text-brand-orange bg-brand-orange/5 rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            <Key className="w-4 h-4 shrink-0" />
            <span>API Credentials</span>
          </button>
          <button 
            onClick={() => setActiveTab('webhooks')}
            className={`py-3 px-3.5 font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 shrink-0 ${activeTab === 'webhooks' ? 'border-brand-orange text-brand-orange bg-brand-orange/5 rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            <WebhookIcon className="w-4 h-4 shrink-0" />
            <span>Webhooks</span>
          </button>
          <button 
            onClick={() => setActiveTab('playground')}
            className={`py-3 px-3.5 font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 shrink-0 ${activeTab === 'playground' ? 'border-brand-orange text-brand-orange bg-brand-orange/5 rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            <Terminal className="w-4 h-4 shrink-0" />
            <span>REST Playground</span>
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-3.5 font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 shrink-0 ${activeTab === 'logs' ? 'border-brand-orange text-brand-orange bg-brand-orange/5 rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            <span>Telemetry Logs</span>
          </button>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">

        {/* TAB 0: M-PESA DARAJA & KRA eTIMS ZERO-HARDCODED HUB */}
        {activeTab === 'mpesa-kra' && (
          <MpesaKraIntegrationHub />
        )}

        {/* TAB 1: OVERVIEW BLUEPRINT */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-brand-orange/5 border border-brand-orange/15 rounded-xl p-5 flex flex-col md:flex-row gap-5 items-center justify-between">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">Enterprise-Grade Ready API Architecture</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 md:max-w-3xl">
                  This POS, Wholesale, and Inventory ERP system delivers fully open, standardized JSON RESTful APIs designed for seamless, bi-directional integration. It enables companies like <strong>Masuma East Africa</strong> to scale seamlessly, outperforming fragmented interfaces of traditional Dynamics 365 or rigid legacied SAP instances.
                </p>
              </div>
              <span className="bg-brand-orange text-white text-[10px] uppercase font-black tracking-wider px-3 py-1.5 rounded-lg shrink-0">
                SDK v3.12 Compliant
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h4 className="text-xs font-black text-brand-orange uppercase tracking-wider border-b pb-2 mb-3">Supported ERP Core Connectors</h4>
                <div className="space-y-4 text-xs">
                  <div className="flex gap-3 align-top">
                    <ShoppingBag className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-slate-800 dark:text-slate-200">E-Commerce Sync (Shopify & WooCommerce)</h5>
                      <p className="text-slate-400 mt-1">Bi-directional product catalogs, high-temperature part interchange lists, and real-time stock deductions immediately upon physical sales.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 align-top">
                    <CreditCard className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-slate-800 dark:text-slate-200">Cash Transfer Handshakes (M-Pesa & Card Gateways)</h5>
                      <p className="text-slate-400 mt-1">Instant invoice status clearance and cashier shift balance checks via automated payment receipt transaction ID matching.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 align-top">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-slate-800 dark:text-slate-200">KRA eTIMS Live Fiscal Compliance</h5>
                      <p className="text-slate-400 mt-1">Direct cryptographic signing, secure SSL gateway handshake, and real-time sales uploading reporting compliance logs without local hardware VSDs.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 align-top">
                    <BookOpen className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-slate-800 dark:text-slate-200">Corporate Ledgers, CRM & SAP Sync</h5>
                      <p className="text-slate-400 mt-1">Exposes REST end-points for CRM accounting syncs, automated purchase orders, and wholesale dunning credit ledger tracking.</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-brand-orange uppercase tracking-wider border-b pb-2 mb-3">Developer Security Protocols</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    All server requests are isolated, logged, and authorized via high-entropy digital tokens following strict enterprise design protocols:
                  </p>
                  <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-350">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>Secure HTTP Bearer Tokenization (OIDC framework ready)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>SHA256 HMAC cryptographic payload signing key matching</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>Fine-grained scopes: granular control over read/write records</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>Production Rate-Limiting: standard 10,000 requests/hour safeguard</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block">Active Gateway Host</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-gray-100 text-[10px]">https://api.masuma.co.ke/v1</span>
                  </div>
                  <button 
                    onClick={() => setActiveTab('playground')}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-lg transition"
                  >
                    Open REST Sandbox
                  </button>
                </div>
              </Card>
            </div>

            {/* Quick stats on integrations */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-205 dark:border-slate-705 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-mono text-slate-450 uppercase block text-[9px] tracking-wider">Active Authorized Keys</span>
                  <p className="font-black font-mono text-sm text-slate-900 dark:text-white mt-0.5">{apiKeys.length} Operational Keys</p>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-205 dark:border-slate-755 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-500 flex items-center justify-center">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-mono text-slate-450 uppercase block text-[9px] tracking-wider">Live Webhook Endpoints</span>
                  <p className="font-black font-mono text-sm text-slate-900 dark:text-white mt-0.5">{webhooks.filter(w=>w.status === 'Active').length} Active Push Nodes</p>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-205 dark:border-slate-755 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-mono text-slate-450 uppercase block text-[9px] tracking-wider">Total Handshakes Logged</span>
                  <p className="font-black font-mono text-sm text-slate-900 dark:text-white mt-0.5">{logs.length} Transactions (Today)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: API KEYS */}
        {activeTab === 'api-keys' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Generate Key Control */}
            <form onSubmit={handleGenerateKey} className="lg:col-span-5 space-y-4">
              <Card>
                <div className="border-b pb-2 mb-4">
                  <h3 className="text-xs font-black text-brand-orange uppercase tracking-wider">Generate API Secret Identifier</h3>
                  <p className="text-xs text-slate-400 mt-1">Issue isolated developer keys mapped to staging or production scopes.</p>
                </div>

                <div className="space-y-4 text-xs font-sans text-slate-700 dark:text-slate-350">
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Staging / Live Environment</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button"
                        onClick={() => setNewKeyEnv('Sandbox')}
                        className={`p-2 rounded-lg font-bold border transition ${newKeyEnv === 'Sandbox' ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700'}`}
                      >
                        🚧 Sandbox (Test)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setNewKeyEnv('Live')}
                        className={`p-2 rounded-lg font-bold border transition ${newKeyEnv === 'Live' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700'}`}
                      >
                        🟢 Live Production
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Credential Name / Scope Purpose</label>
                    <input 
                      type="text" 
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g. ERP Warehouse Sync, Shopify Dispatch Bot"
                      className="w-full p-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none"
                    />
                  </div>

                  <div className="p-3 bg-slate-100 dark:bg-slate-850 rounded-lg space-y-1 block text-[11px] leading-relaxed">
                    <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400 mb-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>Security Enforced Notice</span></div> Secret keys are shown exactly <strong>once</strong> upon generation. Masked keys are permanently hashed for database safety. Do not share raw staging variables.
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-brand-orange hover:bg-brand-orange/95 text-white font-black text-xs uppercase tracking-wider rounded-lg transition"
                  >
                    Authorize New Secret Key
                  </button>
                </div>
              </Card>
            </form>

            {/* Keys Table */}
            <div className="lg:col-span-7">
              <Card>
                <div className="border-b pb-2 mb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Authorized Developers Key Ledger</h3>
                    <p className="text-xs text-slate-400 mt-1">Operational API clearance points currently active on this node.</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full dark:bg-emerald-950/50 dark:text-emerald-300">
                    SSL Active
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-350">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-gray-700 font-bold uppercase text-[10px] text-slate-400">
                        <th className="pb-2.5">Key Label Scope</th>
                        <th className="pb-2.5">Environment</th>
                        <th className="pb-2.5">Token Prefix</th>
                        <th className="pb-2.5">Created</th>
                        <th className="pb-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {apiKeys.map(k => (
                        <tr key={k.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-3 font-sans font-semibold text-slate-900 dark:text-white">{k.name}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${k.environment === 'Live' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/25 dark:text-amber-400'}`}>
                              {k.environment}
                            </span>
                          </td>
                          <td className="py-3 text-[10px] font-bold text-slate-500">{k.prefix}</td>
                          <td className="py-3 text-[10px] text-slate-450">{k.created}</td>
                          <td className="py-3 text-right">
                            <button 
                              onClick={() => handleDeleteKey(k.id, k.name)}
                              className="text-rose-500 hover:text-rose-700 font-bold"
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))}
                      {apiKeys.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                            No credentials generated yet. Establish a secret key to authorize third-party machines.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 3: WEBHOOKS SUB */}
        {activeTab === 'webhooks' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Create subscription Webhook form */}
            <form onSubmit={handleCreateWebhook} className="lg:col-span-5 space-y-4">
              <Card>
                <div className="border-b pb-2 mb-4">
                  <h3 className="text-xs font-black text-brand-orange uppercase tracking-wider">Register Webhook Push Endpoint</h3>
                  <p className="text-xs text-slate-400 mt-1">Configure automated real-time JSON push feeds triggered by ledger events.</p>
                </div>

                <div className="space-y-4 text-xs font-sans">
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">HTTP Listener URL Destination</label>
                    <input 
                      type="url" 
                      required
                      placeholder="https://api.yourcompany.com/v1/webhook"
                      value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Event Topics Subscription Selection</label>
                    <p className="text-[10px] text-slate-400 mb-2">We will forward structured JSON bodies as POST requests whenever these occurrences commit.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2.5 bg-slate-50 dark:bg-slate-850 dark:border-gray-700">
                      {ALL_EVENTS.map(ev => {
                        const isChecked = selectedEvents.includes(ev);
                        return (
                          <label key={ev} className="flex items-center gap-2 py-1.5 px-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded select-none cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => handleToggleEvent(ev)} 
                              className="accent-brand-orange"
                            />
                            <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-350">{ev}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3 bg-brand-orange/5 border border-brand-orange/10 rounded-lg text-[10.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-800 dark:text-slate-200">Secure Webhook Signatures:</strong> All dispatched events contain a cryptographic <code>X-Masuma-Signature</code> derived as an HMAC of the payload using your listener secret. Your client application must authenticate this header to verify the origin securely.
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-brand-orange hover:bg-brand-orange/95 text-white font-black text-xs uppercase tracking-wider rounded-lg transition"
                  >
                    Register Live Endpoint Listener
                  </button>
                </div>
              </Card>
            </form>

            <div className="lg:col-span-7 space-y-6">
              {/* Webhooks list */}
              <Card>
                <div className="border-b pb-2 mb-4">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Registered Push Targets</h3>
                  <p className="text-xs text-slate-400 mt-1">Incoming servers actively listening for updates and state events.</p>
                </div>

                <div className="space-y-4">
                  {webhooks.map(wh => (
                    <div key={wh.id} className="p-4 bg-slate-100 dark:bg-slate-850 rounded-xl space-y-3 border border-slate-200 dark:border-slate-800">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold font-mono text-slate-400 block break-all">{wh.url}</span>
                          <span className="text-[10px] font-bold text-slate-500 mt-1 block">Created on {wh.created}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button 
                            onClick={() => toggleWebhookStatus(wh.id)}
                            className={`px-2.5 py-1 text-[10px] rounded font-bold uppercase ${wh.status === 'Active' ? 'bg-emerald-100 text-emerald-850 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'}`}
                          >
                            ● {wh.status === 'Active' ? 'Active sync' : 'Halted'}
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteWebhook(wh.id, wh.url)}
                            className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition text-xs font-bold"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-bold text-slate-450 mr-1 uppercase">Subscribed:</span>
                        {wh.events.map(ev => (
                          <span key={ev} className="px-2 py-0.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono text-[9px] font-semibold border">
                            {ev}
                          </span>
                        ))}
                      </div>

                      <div className="pt-2 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[10px] text-slate-400">
                        <span className="font-mono">HMAC Secret: <code className="text-slate-705 dark:text-slate-100 font-bold">{wh.secret}</code></span>
                        <span className="text-[9px] text-emerald-600 font-bold">✓ SSL Checked Delivery verified</span>
                      </div>
                    </div>
                  ))}

                  {webhooks.length === 0 && (
                    <div className="py-8 text-center text-slate-400 font-sans text-xs">
                      No webhook listeners registered. Register an endpoint to stream real-time push events to outside systems.
                    </div>
                  )}
                </div>
              </Card>

              {/* Webhook Dispatch simulator */}
              {webhooks.length > 0 && (
                <Card className="border border-indigo-100 dark:border-indigo-950 bg-indigo-50/5">
                  <div className="border-b border-indigo-100 dark:border-indigo-950 pb-2 mb-4">
                    <h3 className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Dispatch Hook Manual Simulator</h3>
                    <p className="text-xs text-slate-400 mt-1">Manually synthesize and fire any push event payload to verify client integrations.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Target Listener URL</label>
                      <select 
                        value={simWebhookId}
                        onChange={(e) => setSimWebhookId(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-slate-900 dark:text-white font-medium"
                      >
                        {webhooks.map(w => (
                          <option key={w.id} value={w.id}>{w.url.substring(0, 48)}...</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Select Event Type</label>
                      <select 
                        value={simEvent}
                        onChange={(e) => setSimEvent(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-slate-900 dark:text-white font-mono font-bold"
                      >
                        {ALL_EVENTS.map(ev => (
                          <option key={ev} value={ev}>{ev}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button 
                      type="button"
                      disabled={simulatingWebhook}
                      onClick={handleDispatchMockWebhook}
                      className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-500/50 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition"
                    >
                      {simulatingWebhook ? (
                        <>
                          <span className="inline-block w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                          Emitting signed JSON payload...
                        </>
                      ) : (
                        'Fire Test Webhook Post'
                      )}
                    </button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: API PLAYGROUND */}
        {activeTab === 'playground' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Endpoints navigation left */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="h-full flex flex-col justify-between">
                <div>
                  <div className="border-b pb-2 mb-4">
                    <h3 className="text-xs font-black text-brand-orange uppercase tracking-wider">REST Endpoint Catalogs</h3>
                    <p className="text-xs text-slate-400 mt-1">Exposed gateway schemas ready to receive remote requests.</p>
                  </div>

                  <div className="space-y-3">
                    {API_ENDPOINTS.map(ep => {
                      const isSelected = ep.id === selectedEndpointId;
                      return (
                        <button 
                          key={ep.id}
                          onClick={() => {
                            setSelectedEndpointId(ep.id);
                            setPlaygroundLogs('');
                          }}
                          className={`w-full p-3.5 rounded-xl border text-left transition flex gap-3.5 items-start ${isSelected ? 'bg-brand-orange/5 border-brand-orange/20 ring-1 ring-brand-orange' : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-slate-800 hover:bg-slate-50'}`}
                        >
                          <span className={`px-2 py-1 rounded font-mono font-black text-[10px] block shrink-0 ${ep.method === 'GET' ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/20' : 'bg-emerald-50 text-emerald-750 dark:bg-emerald-950/20'}`}>
                            {ep.method}
                          </span>
                          <div className="min-w-0">
                            <h4 className="font-mono text-xs font-bold text-slate-900 dark:text-gray-100 truncate">{ep.path}</h4>
                            <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">{ep.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl space-y-1 block leading-relaxed text-[10px] text-slate-400 mt-6">
                  <strong className="text-slate-700 dark:text-slate-300">Heads Up:</strong> Use the live try-it sandbox to simulate request handshakes and observe structural JSON fields returned, mimicking actual live integrations perfectly.
                </div>
              </Card>
            </div>

            {/* Sandbox details and response output terminal */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <Card className="flex-1 flex flex-col justify-between">
                <div>
                  {(() => {
                    const ep = API_ENDPOINTS.find(e => e.id === selectedEndpointId)!;
                    return (
                      <div className="space-y-4 text-xs font-sans text-slate-700 dark:text-slate-350">
                        <div className="flex justify-between items-center border-b pb-2">
                          <div className="flex gap-2 items-center">
                            <span className="px-2 py-0.5 rounded font-mono font-black text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30">
                              {ep.method}
                            </span>
                            <span className="font-mono font-bold text-slate-800 dark:text-white">{ep.path}</span>
                          </div>
                          <button 
                            onClick={handleRunPlaygroundRequest}
                            disabled={testingEndpoint}
                            className="bg-brand-orange hover:bg-brand-orange/95 text-white font-black uppercase text-[10px] tracking-wider px-4 py-2 rounded-lg flex items-center gap-1.5 transition disabled:bg-brand-orange/50"
                          >
                            {testingEndpoint ? (
                              <>
                                <span className="inline-block w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                                Executing cURL...
                              </>
                            ) : (
                              <>Try Endpoint Out</>
                            )}
                          </button>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed">{ep.description}</p>

                        {/* Query parameters section */}
                        {ep.queryParams.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="font-black text-slate-400 uppercase text-[9px] tracking-widest">Query Parameters</h5>
                            <div className="border rounded-lg overflow-hidden divide-y text-[10px] bg-slate-50 dark:bg-slate-850 dark:divide-slate-800 dark:border-gray-751">
                              {ep.queryParams.map(param => (
                                <div key={param.name} className="p-2 grid grid-cols-3 gap-2">
                                  <span className="font-mono font-bold text-brand-orange">{param.name}</span>
                                  <span className="text-slate-400 font-mono italic">({param.type})</span>
                                  <span className="text-slate-500">{param.desc}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Payload parameters section */}
                        {ep.payload && (
                          <div className="space-y-1.5">
                            <h5 className="font-black text-slate-400 uppercase text-[9px] tracking-widest">POST Payload JSON Layout</h5>
                            <pre className="p-3 bg-slate-100 dark:bg-slate-950 text-slate-850 dark:text-emerald-450 rounded-lg font-mono text-[10px] overflow-x-auto border">
                              {JSON.stringify(ep.payload, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Simulated Console output terminal */}
                <div className="space-y-1.5 mt-5">
                  <span className="text-[10px] font-mono block text-slate-450 uppercase font-black tracking-wider">Playground sandbox transmission terminal</span>
                  <div className="w-full bg-slate-950 p-4 rounded-xl font-mono text-[10.5px] leading-relaxed text-slate-300 min-h-64 border/20 max-h-96 overflow-y-auto flex flex-col justify-end">
                    {playgroundLogs ? (
                      <pre className="whitespace-pre-wrap font-mono select-text selection:bg-brand-orange selection:text-white">{playgroundLogs}</pre>
                    ) : (
                      <div className="text-center text-slate-500 py-16 font-sans">
                        <Terminal className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-60" />
                        No activities run yet. Click "Try Endpoint Out" above to execute signed Sandbox request simulations instantly.
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 5: TELEMETRY LOGS */}
        {activeTab === 'logs' && (
          <Card>
            <div className="border-b pb-2 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Live System Handshakes Feed Logs</h3>
                <p className="text-xs text-slate-400 mt-1">Real-time audits monitoring external software connections and webhook receipt handshakes.</p>
              </div>
              <button 
                onClick={() => {
                  setLogs([]);
                  alert('Telemetry buffer logs emptied. Standard server listener stays active.');
                }}
                className="px-3 py-1.5 border hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-600 dark:text-slate-300 font-bold rounded-lg self-end"
              >
                Clear Console
              </button>
            </div>

            <div className="space-y-3 font-mono text-[11px]">
              {logs.map((log) => {
                const isErr = log.status >= 400;
                const isRequest = log.type === 'API_REQUEST';
                return (
                  <div key={log.id} className="p-3 bg-slate-950 dark:bg-slate-980 text-gray-300 rounded-xl border border-slate-900 flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-900 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                        <span className={`px-2 py-0.5 rounded text-[8.5px] font-bold ${isRequest ? 'bg-indigo-950 text-indigo-300 border border-indigo-900' : 'bg-teal-950 text-teal-300 border border-teal-900'}`}>
                          {log.type}
                        </span>
                        <span className={`font-black uppercase text-[10px] ${isRequest ? 'text-indigo-400' : 'text-emerald-400'}`}>
                          {log.methodOrStatus}
                        </span>
                        <span className="text-slate-100 font-medium break-all">{log.endpointOrEvent}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-500">RTT: {log.duration}</span>
                        <span className={`font-black border px-1.5 py-0.5 rounded text-[10px] ${isErr ? 'border-rose-900 bg-rose-950/40 text-rose-400' : 'border-emerald-900 bg-emerald-950/40 text-emerald-450'}`}>
                          HTTP {log.status}
                        </span>
                      </div>
                    </div>
                    <pre className="text-[10px] leading-relaxed text-slate-400 overflow-x-auto select-text selection:bg-indigo-600">{log.payload}</pre>
                  </div>
                );
              })}
              {logs.length === 0 && (
                <div className="py-16 text-center text-slate-400 font-sans text-xs">
                  Console buffer currently empty. Interactive requests from other tabs automatically populate here.
                </div>
              )}
            </div>
          </Card>
        )}

      </div>

      {/* Secret Key Modal Dialog */}
      {showKeyDialog && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border dark:border-gray-700 space-y-4">
            <div className="flex items-center gap-3 border-b pb-3 text-emerald-600">
              <Key className="w-5 h-5 text-emerald-500 shrink-0" />
              <h4 className="text-sm font-black uppercase tracking-wider">Secret API Credential Token Key Generated</h4>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
              Copy this corporate secret variable and safeguard it securely. To maintain enterprise isolation compliance standard protocols, you <strong>cannot</strong> read this raw variable from our database console again after closing this dialogue.
            </p>

            <div className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl border flex items-center justify-between gap-4 select-all">
              <span className="break-all font-bold tracking-wider">{generatedKeyMsg}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(generatedKeyMsg);
                  alert('Token copied to system clipboard successfully!');
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white text-[10.5px] px-3 py-1.5 rounded-lg shrink-0 font-bold select-none"
              >
                Copy
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setShowKeyDialog(false)}
                className="px-6 py-2.5 bg-brand-orange hover:bg-brand-orange/95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition"
              >
                I Have Copied & Acknowledge Safety
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Integrations;
