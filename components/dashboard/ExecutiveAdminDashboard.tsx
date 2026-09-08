import React, { useState } from 'react';
import { useSystemSettings } from '../../contexts/SettingsContext';
import { AlertTriangle, TrendingUp, ShieldCheck, ArrowRight, Activity, Users, Settings } from 'lucide-react';
import DailySalesVolumeChart from './DailySalesVolumeChart';
import { useNavigate } from 'react-router-dom';

interface ExecutiveAdminDashboardProps {
  onOpenRbacMatrix: () => void;
}

export const ExecutiveAdminDashboard: React.FC<ExecutiveAdminDashboardProps> = ({ onOpenRbacMatrix }) => {
  const { settings, formatPrice } = useSystemSettings();
  const navigate = useNavigate();

  // Stateful billing and notice alarms
  const [dunStatus, setDunStatus] = useState<Record<number, string>>({});
  const [activeSegment, setActiveSegment] = useState<'all' | 'risk' | 'normal'>('all');
  const [hoveredHour, setHoveredHour] = useState<{ x: number; label: string; val: number } | null>(null);

  // Send interactive SMS alert
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
      alert(`💬 DUNNING NOTIFICATION EMITTED:\nGateway Status: DISPATCHED\nTo: ${name} (${phone || '0712345678'})\n\nMessage Payload:\n"${parsedMessage}"`);
    }, 1200);
  };

  // 1. Interactive SVG Hourly Sales data points
  const hourlyData = [
    { label: '08:00', val: 45000, x: 40, y: 160 },
    { label: '10:00', val: 125000, x: 100, y: 110 },
    { label: '12:00', val: 280000, x: 160, y: 30 },
    { label: '14:00', val: 195000, x: 220, y: 70 },
    { label: '16:00', val: 340000, x: 280, y: 10 },
    { label: '18:00', val: 90000, x: 340, y: 130 },
  ];

  // 2. Localized Payment Gateway Split
  const gateways = [
    { key: 'mpesa', name: `${settings.currency === 'KES' ? 'M-Pesa' : 'Mobile Pay'}`, value: 520000, color: 'bg-emerald-500', fill: '#10b981', percentage: 55 },
    { key: 'cash', name: 'Cash', value: 236000, color: 'bg-amber-500', fill: '#f59e0b', percentage: 25 },
    { key: 'eft', name: 'Bank EFT Transfer', value: 141000, color: 'bg-indigo-500', fill: '#6366f1', percentage: 15 },
    { key: 'card', name: 'Visa / Card', value: 47500, color: 'bg-rose-500', fill: '#f43f5e', percentage: 5 },
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
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Scope Banner */}
      <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-indigo-500/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Super Administrator • Unrestricted Group Clearance
              </span>
              <span className="text-xs text-slate-400 font-mono">Full CRUD & System Authority</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              Executive Group Operations Center
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Enterprise P&L, multi-branch liquidity, inventory capital valuation, and group security enforcement.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenRbacMatrix}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Full RBAC Matrix</span>
            </button>
          </div>
        </div>
      </div>

      {/* FOUR EXECUTIVE METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Sales */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aggregated Sales (Today)</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">944,500</span>
            <span className="text-xs font-bold text-slate-500">{settings.currency}</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
            <span className="inline-flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /><span>+18.4%</span></span>
            <span className="text-[10px] font-medium text-slate-400">vs yesterday {formatPrice(797000)}</span>
          </div>
        </div>

        {/* B2B Accounts Receivable Outstanding */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aged Accounts Receivable</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {totalOutstandingAR.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-500">{settings.currency}</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Risk Threshold: 80% Cap</span>
            <span className="font-mono text-slate-500 dark:text-slate-350">70.4% Util</span>
          </div>
          <div className="mt-2 w-full h-1.5 bg-slate-100 dark:bg-slate-750 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: '70.4%' }}></div>
          </div>
        </div>

        {/* Est Inventory Value */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Warehouse stock capitalization</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">4,120,000</span>
            <span className="text-xs font-bold text-slate-500">{settings.currency}</span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-xs">
            <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-black">12 SKU Types</span>
            <span className="text-slate-400">Across 2 Warehouses</span>
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory risk factors</span>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-4xl font-black text-red-500 font-mono">4</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Critical Part types<br/>Warning</span>
          </div>
          <div className="mt-2.5 text-xs text-amber-600 font-semibold flex items-center gap-1">
            <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Need Immediate reorder dispatch POs</span>
          </div>
        </div>
      </div>

      {/* 7-DAY DAILY SALES VOLUME RECHARTS VISUALIZATION */}
      <DailySalesVolumeChart className="mt-2" />

      {/* Hourly Volatility and Payment Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* CHART A: Sales frequency curves */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700 lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-slate-950 dark:text-white">Hourly Sales Target Volatility</h3>
                <p className="text-xs text-slate-400">Real-time point-of-sale activities across trading hours.</p>
              </div>
              <span className="bg-brand-orange/10 text-brand-orange px-2.5 py-1 rounded font-bold text-[11px] uppercase">Interactive</span>
            </div>
            
            {/* Curve container */}
            <div className="relative mt-8 h-48 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800 p-4 flex items-center justify-center">
              <svg className="w-full h-full text-brand-orange" viewBox="0 0 380 180" preserveAspectRatio="none">
                <line x1="0" y1="10" x2="380" y2="10" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
                <line x1="0" y1="70" x2="380" y2="70" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
                <line x1="0" y1="130" x2="380" y2="130" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
                
                <path 
                  d="M 40,180 L 40,160 Q 100,110 160,30 T 280,10 T 340,130 L 340,180 Z" 
                  fill="url(#gradientSalesAdmin)" 
                  opacity="0.15" 
                />
                
                <path 
                  d="M 40,160 Q 100,110 160,30 T 280,10 T 340,130" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                />
                
                {hourlyData.map((node, i) => (
                  <g 
                    key={i} 
                    onMouseEnter={() => setHoveredHour(node)}
                    onMouseLeave={() => setHoveredHour(null)}
                    className="cursor-pointer"
                  >
                    <circle 
                      cx={node.x} 
                      cy={node.y} 
                      r={hoveredHour?.label === node.label ? "7" : "4.5"} 
                      className="fill-brand-orange stroke-white dark:stroke-slate-800 text-brand-orange transition-all duration-150"
                      strokeWidth="2"
                    />
                  </g>
                ))}

                <defs>
                  <linearGradient id="gradientSalesAdmin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ff5000" />
                    <stop offset="100%" stopColor="#ff5000" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              {hoveredHour && (
                <div 
                  className="absolute bg-slate-900 border border-slate-700 text-white p-2 text-[10px] rounded shadow-2xl pointer-events-none transition-all duration-150 z-20"
                  style={{ left: `${hoveredHour.x}px`, top: `${hoveredHour.y - 45}px` }}
                >
                  <span className="font-bold block uppercase text-amber-500 font-mono">{hoveredHour.label}</span>
                  <span>Revenue: <strong className="font-sans">{formatPrice(hoveredHour.val)}</strong></span>
                </div>
              )}
            </div>

            <div className="mt-3 flex justify-between px-4 font-mono text-[9px] text-slate-400">
              {hourlyData.map((d, idx) => (
                <span key={idx}>{d.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* CHART B: Regional Payment splits */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700 lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-950 dark:text-white">Corporate Payment Splits</h3>
            <p className="text-xs text-slate-400">Settlement share breakdown of POS checkouts.</p>

            <div className="mt-6 space-y-4">
              {gateways.map(g => (
                <div key={g.key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{g.name}</span>
                    <span className="font-mono text-slate-500">{formatPrice(g.value)} ({g.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full ${g.color}`} style={{ width: `${g.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Aged Accounts Receivable Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">B2B Corporate Debtors & Dunning Engine</h3>
            <p className="text-xs text-slate-400">Overdue commercial invoices with integrated SMS notification dispatch.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSegment('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${activeSegment === 'all' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}
            >
              All Clients
            </button>
            <button
              type="button"
              onClick={() => setActiveSegment('risk')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${activeSegment === 'risk' ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}
            >
              At Risk (&gt;60d)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase text-slate-400">
                <th className="pb-3">Client Account</th>
                <th className="pb-3">Credit Limit</th>
                <th className="pb-3 text-right">Outstanding</th>
                <th className="pb-3 text-right">0-30 Days</th>
                <th className="pb-3 text-right">31-60 Days</th>
                <th className="pb-3 text-right text-rose-500">61-90+ Days</th>
                <th className="pb-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {agedAccounts
                .filter(acc => activeSegment === 'all' || acc.aged60 > 0 || acc.aged90 > 0)
                .map(acc => (
                  <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 font-mono">
                    <td className="py-3 font-sans">
                      <div className="font-bold text-slate-900 dark:text-white">{acc.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{acc.email}</span>
                    </td>
                    <td className="py-3">{formatPrice(acc.limit)}</td>
                    <td className="py-3 text-right font-black text-slate-900 dark:text-white">{formatPrice(acc.outstanding)}</td>
                    <td className="py-3 text-right text-slate-500">{formatPrice(acc.aged30)}</td>
                    <td className="py-3 text-right text-amber-500">{formatPrice(acc.aged60)}</td>
                    <td className="py-3 text-right text-rose-500 font-bold">{formatPrice(acc.aged90)}</td>
                    <td className="py-3 text-center">
                      <button
                        type="button"
                        onClick={() => triggerDunSMS(acc.id, acc.name, acc.phone, acc.outstanding, acc.aged60, acc.aged90)}
                        className="px-2.5 py-1 bg-brand-orange text-white text-[10px] font-bold rounded-lg hover:bg-brand-orange/90 transition"
                      >
                        {dunStatus[acc.id] === 'sent' ? 'SMS Sent' : dunStatus[acc.id] === 'sending' ? 'Sending...' : 'Emit SMS'}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveAdminDashboard;
