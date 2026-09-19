import React, { useState } from 'react';
import { useSystemSettings } from '../../contexts/SettingsContext';
import { 
  AlertTriangle, 
  TrendingUp, 
  ArrowRight, 
  Activity, 
  Users, 
  Settings,
  Boxes,
  Clock,
  Send,
  CheckCircle2,
  Smartphone,
  Banknote,
  Landmark,
  CreditCard,
  FileText,
  DollarSign,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import DailySalesVolumeChart from './DailySalesVolumeChart';
import { useNavigate } from 'react-router-dom';

export const ExecutiveAdminDashboard: React.FC = () => {
  const { settings, formatPrice } = useSystemSettings();
  const navigate = useNavigate();

  // Stateful billing and notice alarms
  const [dunStatus, setDunStatus] = useState<Record<number, 'idle' | 'sending' | 'sent'>>({});
  const [activeSegment, setActiveSegment] = useState<'all' | 'risk' | 'normal'>('all');
  const [notificationToast, setNotificationToast] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'info';
  } | null>(null);

  // Send interactive SMS alert (In-app friendly notification instead of window.alert)
  const triggerDunSMS = (custId: number, name: string, phone: string, outstanding: number, aged60: number, aged90: number) => {
    setDunStatus(prev => ({ ...prev, [custId]: 'sending' }));
    
    const totalDueFormatted = outstanding.toLocaleString();
    const over60Formatted = (aged60 + aged90).toLocaleString();
    
    const parsedMessage = settings.dunningSmsTemplate
      .replace(/{customerName}/g, name)
      .replace(/{companyName}/g, settings.corpName)
      .replace(/{totalDue}/g, totalDueFormatted)
      .replace(/{over60}/g, over60Formatted)
      .replace(/{currency}/g, settings.currency);

    setTimeout(() => {
      setDunStatus(prev => ({ ...prev, [custId]: 'sent' }));
      setNotificationToast({
        visible: true,
        title: `Dunning Notice Dispatched`,
        message: `SMS sent to ${name} (${phone || '0712345678'}): "${parsedMessage.slice(0, 75)}..."`,
        type: 'success'
      });

      // Auto-hide toast after 4.5 seconds
      setTimeout(() => {
        setNotificationToast(null);
      }, 4500);
    }, 750);
  };

  // Real-time Hourly Trading Velocity dataset for Recharts
  const hourlyData = [
    { hour: '08:00', revenue: 45000, orders: 12, label: 'Opening Shift' },
    { hour: '10:00', revenue: 125000, orders: 28, label: 'Morning Peak' },
    { hour: '12:00', revenue: 280000, orders: 64, label: 'Midday B2B Dispatch' },
    { hour: '14:00', revenue: 195000, orders: 42, label: 'Afternoon Retail' },
    { hour: '16:00', revenue: 340000, orders: 78, label: 'Peak Trade Window' },
    { hour: '18:00', revenue: 90000, orders: 23, label: 'Evening Reconciliation' },
  ];

  // Localized Payment Settlement Channels
  const gateways = [
    { 
      key: 'mpesa', 
      name: `${settings.currency === 'KES' ? 'M-Pesa Express' : 'Mobile Pay'}`, 
      value: 520000, 
      percentage: 55, 
      icon: Smartphone,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400' 
    },
    { 
      key: 'cash', 
      name: 'Counter Cash', 
      value: 236000, 
      percentage: 25, 
      icon: Banknote,
      color: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400' 
    },
    { 
      key: 'eft', 
      name: 'Bank Direct EFT', 
      value: 141000, 
      percentage: 15, 
      icon: Landmark,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600 dark:text-indigo-400' 
    },
    { 
      key: 'card', 
      name: 'Card & PDQ Terminal', 
      value: 47500, 
      percentage: 5, 
      icon: CreditCard,
      color: 'bg-brand-orange',
      textColor: 'text-brand-orange' 
    },
  ];

  // Aged Credit accounts tracker
  const agedAccounts = [
    { id: 2, name: 'John Doe Motors (JDM)', email: 'john@jdmotors.co.ke', phone: '0712345678', limit: 250000, outstanding: 145000, aged30: 95000, aged60: 50000, aged90: 0 },
    { id: 3, name: 'Jane Smith Garage', email: 'jane@jsgarage.co.ke', phone: '0787654321', limit: 120000, outstanding: 88000, aged30: 20000, aged60: 48000, aged90: 20000 },
    { id: 4, name: 'AutoFix Solutions Ltd', email: 'procurement@autofix.co.ke', phone: '0722000111', limit: 500000, outstanding: 310000, aged30: 210000, aged60: 100000, aged90: 0 },
    { id: 5, name: 'Nairobi Fleet Logistics', email: 'fleet@nairobi.co.ke', phone: '0733555222', limit: 300000, outstanding: 285000, aged30: 50000, aged60: 120000, aged90: 115000 },
  ];

  const totalOutstandingAR = agedAccounts.reduce((acc, c) => acc + c.outstanding, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* IN-APP TOAST NOTIFICATION (WORLD-CLASS & FRIENDLY) */}
      {notificationToast && (
        <div className="p-4 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-800 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">{notificationToast.title}</p>
              <p className="text-xs text-slate-300">{notificationToast.message}</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setNotificationToast(null)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* EXECUTIVE COMMAND HEADER */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-600">
                Executive Management Hub
              </span>
              <span className="text-xs text-slate-400 font-medium">Unrestricted Master Clearance</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Executive Group Operations
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Consolidated trading performance, multi-branch liquidity, inventory capital valuation, and commercial credit dunning.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-600 transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Financial Reports</span>
            </button>
          </div>
        </div>

        {/* QUICK REAL-TIME PERFORMANCE HIGHLIGHTS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-700/60 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Gross Operating Margin</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">34.2%</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium ml-1">On benchmark</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Today Liquidity Velocity</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{formatPrice(944500)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">eTIMS Sync Health</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>100% Synced</span>
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Central Warehouse Fill</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">94.8% SLA</span>
          </div>
        </div>
      </div>

      {/* FOUR BALANCED WORLD-CLASS METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Aggregated Today's Sales */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Aggregated Sales (Today)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              944,500
            </span>
            <span className="text-xs font-medium text-slate-500">{settings.currency}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4%</span>
            </span>
            <span className="text-slate-400 text-[11px]">vs yesterday ({formatPrice(797000)})</span>
          </div>
        </div>

        {/* Metric 2: B2B Accounts Receivable Outstanding */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Aged Accounts Receivable</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {totalOutstandingAR.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-slate-500">{settings.currency}</span>
          </div>
          <div className="mt-3 text-xs pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <div className="flex justify-between items-center text-[11px] text-slate-500 mb-1.5">
              <span>Risk Threshold (80% Cap)</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">70.4% Utilized</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '70.4%' }} />
            </div>
          </div>
        </div>

        {/* Metric 3: Warehouse Stock Capitalization */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Stock Capitalization</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              4,120,000
            </span>
            <span className="text-xs font-medium text-slate-500">{settings.currency}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300">
              12 SKU Categories
            </span>
            <span className="text-slate-400 text-[11px]">2 Central Hubs</span>
          </div>
        </div>

        {/* Metric 4: Inventory Risk Factors */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Inventory Alert Queue</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 tracking-tight">
              4
            </span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Items Under Reorder Point</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => navigate('/purchasing')}
              className="text-brand-orange hover:underline font-semibold flex items-center gap-1 cursor-pointer text-xs"
            >
              <span>Dispatch Restock POs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-slate-400 text-[11px]">Automated Sourcing</span>
          </div>
        </div>
      </div>

      {/* 7-DAY DAILY SALES VOLUME RECHARTS VISUALIZATION */}
      <DailySalesVolumeChart className="mt-2" />

      {/* HOURLY VELOCITY (RECHARTS AREA) & LOCAL PAYMENT SETTLEMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CLEAN RECHARTS HOURLY VELOCITY AREA CHART */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Hourly Trading Velocity (Today)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Real-time point-of-sale activities and revenue momentum across daytime trading hours.</p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                <Activity className="w-3.5 h-3.5 text-brand-orange" />
                <span>Peak: 16:00 (KES 340k)</span>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-56 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hourlyRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff5000" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ff5000" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                  <XAxis 
                    dataKey="hour" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontSize: 11, fill: '#94a3b8' }} 
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontSize: 11, fill: '#94a3b8' }} 
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} 
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-800 text-white p-3 rounded-xl shadow-xl text-xs">
                          <div className="flex items-center justify-between gap-4 font-bold pb-1 border-b border-slate-800">
                            <span>{d.hour}</span>
                            <span className="text-brand-orange text-[10px] uppercase">{d.label}</span>
                          </div>
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between gap-4 text-slate-300">
                              <span>Revenue:</span>
                              <strong className="text-white">{formatPrice(d.revenue)}</strong>
                            </div>
                            <div className="flex justify-between gap-4 text-slate-400 text-[11px]">
                              <span>Orders:</span>
                              <span>{d.orders} tickets</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#ff5000"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#hourlyRevenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-700/60 mt-2">
            <span>Trading Hours: 08:00 - 18:00 EAT</span>
            <span className="text-slate-400">Total Daytime Transactions: <strong className="text-slate-700 dark:text-slate-200">247 Orders</strong></span>
          </div>
        </div>

        {/* PAYMENT SETTLEMENT CHANNELS */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Settlement Channels</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Breakdown of gross POS payments collected.</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">Today</span>
            </div>

            <div className="space-y-4">
              {gateways.map(g => {
                const Icon = g.icon;
                return (
                  <div key={g.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-300">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{g.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-white">{formatPrice(g.value)}</span>
                        <span className="text-slate-400 ml-1.5 text-[11px]">({g.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${g.color} rounded-full`} style={{ width: `${g.percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 mt-4 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Reconciled:</span>
            <span className="font-bold text-slate-900 dark:text-white">{formatPrice(944500)}</span>
          </div>
        </div>
      </div>

      {/* B2B AGED ACCOUNTS RECEIVABLE TABLE & DUNNING ENGINE */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">B2B Corporate Debtors & Dunning Engine</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {agedAccounts.length} Active Accounts
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Commercial credit ledgers with automated SMS reminders and aged balance aging.
            </p>
          </div>
          
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-700/60 rounded-xl border border-slate-200/80 dark:border-slate-600">
            <button
              type="button"
              onClick={() => setActiveSegment('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeSegment === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Clients
            </button>
            <button
              type="button"
              onClick={() => setActiveSegment('risk')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeSegment === 'risk'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              High Risk (&gt;60 Days)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="pb-3 font-semibold">Corporate Client</th>
                <th className="pb-3 font-semibold">Credit Limit</th>
                <th className="pb-3 text-right font-semibold">Outstanding Balance</th>
                <th className="pb-3 text-right font-semibold">0-30 Days</th>
                <th className="pb-3 text-right font-semibold">31-60 Days</th>
                <th className="pb-3 text-right font-semibold text-rose-500">61-90+ Days</th>
                <th className="pb-3 text-center font-semibold">Dunning Notice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {agedAccounts
                .filter(acc => activeSegment === 'all' || acc.aged60 > 0 || acc.aged90 > 0)
                .map(acc => {
                  const status = dunStatus[acc.id] || 'idle';
                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors">
                      <td className="py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white text-xs">{acc.name}</div>
                        <div className="text-[11px] text-slate-400">{acc.phone} • {acc.email}</div>
                      </td>
                      <td className="py-3.5 text-slate-600 dark:text-slate-300 font-medium">
                        {formatPrice(acc.limit)}
                      </td>
                      <td className="py-3.5 text-right font-bold text-slate-900 dark:text-white">
                        {formatPrice(acc.outstanding)}
                      </td>
                      <td className="py-3.5 text-right text-slate-500">
                        {formatPrice(acc.aged30)}
                      </td>
                      <td className="py-3.5 text-right font-medium text-amber-600 dark:text-amber-400">
                        {formatPrice(acc.aged60)}
                      </td>
                      <td className="py-3.5 text-right font-bold text-rose-600 dark:text-rose-400">
                        {formatPrice(acc.aged90)}
                      </td>
                      <td className="py-3.5 text-center">
                        <button
                          type="button"
                          disabled={status === 'sending'}
                          onClick={() => triggerDunSMS(acc.id, acc.name, acc.phone, acc.outstanding, acc.aged60, acc.aged90)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer ${
                            status === 'sent'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : status === 'sending'
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                              : 'bg-brand-orange hover:bg-brand-orange/90 text-white shadow-xs'
                          }`}
                        >
                          {status === 'sent' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Notice Sent</span>
                            </>
                          ) : status === 'sending' ? (
                            <span>Dispatching...</span>
                          ) : (
                            <>
                              <Send className="w-3 h-3" />
                              <span>Send Notice</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ExecutiveAdminDashboard;
