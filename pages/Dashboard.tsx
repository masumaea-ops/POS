import React, { useState } from 'react';
import { MOCK_CUSTOMERS, MOCK_PRODUCTS } from '../data/mockData';

const Dashboard: React.FC = () => {
  // Stateful billing and notice alarms
  const [dunStatus, setDunStatus] = useState<Record<number, string>>({});
  const [activeSegment, setActiveSegment] = useState<'all' | 'risk' | 'normal'>('all');
  const [hoveredHour, setHoveredHour] = useState<{ x: number; label: string; val: number } | null>(null);
  const [hoveredGate, setHoveredGate] = useState<string | null>(null);

  // Send interactive SMS alert
  const triggerDunSMS = (custId: number, name: string, phone: string, amount: number) => {
    setDunStatus(prev => ({ ...prev, [custId]: 'sending' }));
    setTimeout(() => {
      setDunStatus(prev => ({ ...prev, [custId]: 'sent' }));
      alert(`💬 DUNNING SERVICE RUNNING:\nSMS notice containing Lipa na M-Pesa payment API link dispatched securely to ${name} (${phone || '0712345678'}) for KES ${amount.toLocaleString()}!`);
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

  // 2. Localized Payment Gateway Split split
  const gateways = [
    { key: 'mpesa', name: 'M-Pesa (Mobile)', value: 520000, color: 'bg-emerald-500', fill: '#10b981', percentage: 55 },
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
    <div className="p-4 md:p-8 bg-slate-50 dark:bg-slate-900 min-h-full pb-16">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-gray-100 uppercase tracking-tight">Executive Operations Center</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Masuma Autoparts East African Distributor Command Console</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
             <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">eTIMS API CONNECTED</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="font-semibold text-slate-500 dark:text-slate-400">Terminal: NRB-LANE-01</span>
        </div>
      </div>

      {/* FOUR EXECUTIVE METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Today's Sales */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aggregated Sales (Today)</span>
           <div className="flex items-baseline gap-2 mt-2">
             <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">944,500</span>
             <span className="text-xs font-bold text-slate-500">KES</span>
           </div>
           <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
              <span>📈 +18.4%</span>
              <span className="text-[10px] font-medium text-slate-400">vs yesterday KES 797K</span>
           </div>
        </div>

        {/* B2B Accounts Receivable Outstanding */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aged accounts receivable</span>
           <div className="flex items-baseline gap-2 mt-2">
             <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono">823,000</span>
             <span className="text-xs font-bold text-slate-500">KES</span>
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Warehouse stock capitalization</span>
           <div className="flex items-baseline gap-2 mt-2">
             <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">4,120,000</span>
             <span className="text-xs font-bold text-slate-500">KES</span>
           </div>
           <div className="mt-2.5 flex items-center gap-2 text-xs">
              <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-black">12 SKU Types</span>
              <span className="text-slate-400">Across 2 Warehouses</span>
           </div>
        </div>

        {/* Low stock alerts */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory risk factors</span>
           <div className="flex items-center gap-3 mt-2">
             <span className="text-4xl font-black text-red-500 font-mono">4</span>
             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Critical Part types<br/>Warning</span>
           </div>
           <div className="mt-2.5 text-xs text-amber-600 font-semibold flex items-center gap-1">
              <span>⚠️ Need Immediate reorder dispatch POs</span>
           </div>
        </div>
      </div>

      {/* RECHART SIMULATED CUSTOM HIGH-CONTRAST INTERACTIVE SVG GRAPHICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
        
        {/* CHART A: Sales frequency curves */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 lg:col-span-8 flex flex-col justify-between">
           <div>
             <div className="flex justify-between items-start">
               <div>
                 <h3 className="text-lg font-black text-slate-950 dark:text-white">Hourly Sales Target Volatility</h3>
                 <p className="text-xs text-slate-400">Real-time point-of-sale activities across trading hours. Hover node triggers detail.</p>
               </div>
               <span className="bg-brand-orange/10 text-brand-orange px-2.5 py-1 rounded font-bold text-[11px] uppercase">Interactive</span>
             </div>
             
             {/* Curve container */}
             <div className="relative mt-8 h-48 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800 p-4 flex items-center justify-center">
                
                {/* SVG Curve Canvas */}
                <svg className="w-full h-full text-brand-orange" viewBox="0 0 380 180" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="10" x2="380" y2="10" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
                  <line x1="0" y1="70" x2="380" y2="70" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
                  <line x1="0" y1="130" x2="380" y2="130" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
                  
                  {/* Fills Area under Curve */}
                  <path 
                    d="M 40,180 L 40,160 Q 100,110 160,30 T 280,10 T 340,130 L 340,180 Z" 
                    fill="url(#gradientSales)" 
                    opacity="0.15" 
                  />
                  
                  {/* Base smooth line */}
                  <path 
                    d="M 40,160 Q 100,110 160,30 T 280,10 T 340,130" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                  />

                  {/* Intersective interactives */}
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

                  {/* Gradient definition */}
                  <defs>
                     <linearGradient id="gradientSales" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ff5000" />
                        <stop offset="100%" stopColor="#ff5000" stopOpacity="0" />
                     </linearGradient>
                  </defs>
                </svg>

                {/* Simulated Floating Tooltip */}
                {hoveredHour && (
                  <div 
                    className="absolute bg-slate-900 border border-slate-750 text-white p-2 text-[10px] rounded shadow-2xl pointer-events-none transition-all duration-150 z-20"
                    style={{ left: `${hoveredHour.x}px`, top: `${hoveredHour.y - 45}px` }}
                  >
                     <span className="font-bold block uppercase text-amber-500 font-mono">{hoveredHour.label}</span>
                     <span>Revenue: <strong className="font-sans">KES {hoveredHour.val.toLocaleString()}</strong></span>
                  </div>
                )}
             </div>

             {/* Chart Legend Axis */}
             <div className="mt-3 flex justify-between px-4 font-mono text-[9px] text-slate-400">
               {hourlyData.map((d, idx) => (
                  <span key={idx}>{d.label}</span>
               ))}
             </div>
           </div>

           <div className="border-t border-slate-100 dark:border-slate-850 pt-4 mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Peak Distributor Traffic: <strong className="text-slate-800 dark:text-slate-200">12:00 - 16:30</strong></span>
              <span className="font-bold underline cursor-pointer hover:text-brand-orange">Load Complete Report</span>
           </div>
        </div>

        {/* CHART B: Regional Payment splits (Gateways) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 lg:col-span-4 flex flex-col justify-between">
           <div>
             <h3 className="text-lg font-black text-slate-950 dark:text-white">East African Payment Splits</h3>
             <p className="text-xs text-slate-400">Settlement share breakdown of POS checkouts.</p>

             <div className="mt-6 space-y-4">
                {gateways.map(g => (
                  <div 
                     key={g.key} 
                     onMouseEnter={() => setHoveredGate(g.key)}
                     onMouseLeave={() => setHoveredGate(null)}
                     className={`p-3.5 rounded-xl border transition-all ${
                       hoveredGate === g.key 
                       ? 'bg-slate-50 dark:bg-slate-750/70 border-slate-200 dark:border-slate-700 scale-[1.02]' 
                       : 'bg-transparent border-transparent'
                     }`}
                  >
                     <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                           <span className={`w-3 h-3 rounded-full ${g.color}`}></span>
                           <span className="font-bold text-slate-700 dark:text-slate-300">{g.name}</span>
                        </div>
                        <span className="font-mono font-black text-slate-950 dark:text-white">{g.percentage}%</span>
                     </div>
                     <div className="mt-2.5 h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${g.color}`} 
                          style={{ width: `${g.percentage}%` }}
                        ></div>
                     </div>
                     <p className="text-[10px] text-slate-400 text-right mt-1 font-mono">KES {g.value.toLocaleString()}</p>
                  </div>
                ))}
             </div>
           </div>

           <div className="border-t border-slate-100 dark:border-slate-850 pt-4 mt-4 text-[10px] text-slate-400 font-mono text-center uppercase tracking-wide">
              M-Pesa Gateway Dominates: 55% share
           </div>
        </div>
      </div>

      {/* B2B DEBT COLLECTION AGED ACCOUNTS CONTROL TABLE */}
      <div className="mt-10 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-755 pb-4 mb-4">
             <div>
                 <h3 className="text-xl font-black text-slate-900 dark:text-white">B2B Aged Accounts Receivables (AR) Ledger</h3>
                 <p className="text-xs text-slate-400">Aging debt breakdown tracking credit risks and dunning logs.</p>
             </div>
             
             {/* Filter Tabs */}
             <div className="flex p-1 bg-slate-100 dark:bg-slate-900 text-xs font-bold rounded-lg border dark:border-slate-700 shrink-0">
                 <button 
                   onClick={() => setActiveSegment('all')}
                   className={`px-3.5 py-1.5 rounded ${activeSegment === 'all' ? 'bg-white dark:bg-slate-800 shadow-xs text-brand-orange' : 'text-slate-600 dark:text-slate-350'}`}
                 >
                   All Accounts
                 </button>
                 <button 
                   onClick={() => setActiveSegment('risk')}
                   className={`px-3.5 py-1.5 rounded ${activeSegment === 'risk' ? 'bg-white dark:bg-slate-800 shadow-xs text-amber-600' : 'text-slate-600 dark:text-slate-350'}`}
                 >
                   Aged 60+ Days Warning
                 </button>
             </div>
         </div>

         {/* Aged AR Table Grid */}
         <div className="overflow-x-auto">
             <table className="w-full text-left text-xs">
                 <thead className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wide">
                     <tr>
                         <th className="p-3">B2B Distributor Client</th>
                         <th className="p-3">Credit Limit Cap</th>
                         <th className="p-3 text-right">Oust. Balance</th>
                         <th className="p-3 text-right">0-30 Days Aging</th>
                         <th className="p-3 text-right">31-60 Days Aging</th>
                         <th className="p-3 text-right font-semibold text-rose-500">61-90+ Days (Severe)</th>
                         <th className="p-3 text-center">Collection Dunning</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-150 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                     {agedAccounts
                       .filter(acc => {
                          if (activeSegment === 'risk') return acc.aged60 > 0 || acc.aged90 > 0;
                          return true;
                       })
                       .map(client => (
                         <tr key={client.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 font-mono">
                             <td className="p-4 font-sans">
                                 <strong className="text-slate-900 dark:text-white font-bold">{client.name}</strong>
                                 <span className="block text-[10px] text-slate-400">{client.email} | {client.phone}</span>
                             </td>
                             <td className="p-4">KES {client.limit.toLocaleString()}</td>
                             <td className="p-4 text-right font-black">KES {client.outstanding.toLocaleString()}</td>
                             <td className="p-4 text-right">KES {client.aged30.toLocaleString()}</td>
                             <td className="p-4 text-right">KES {client.aged60.toLocaleString()}</td>
                             <td className="p-4 text-right text-rose-500 font-extrabold">KES {client.aged90.toLocaleString()}</td>
                             <td className="p-4 text-center">
                                 {dunStatus[client.id] === 'sent' ? (
                                    <span className="inline-block bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold px-2.5 py-1 rounded text-[10px]">
                                       📨 Link Dispatched
                                    </span>
                                 ) : dunStatus[client.id] === 'sending' ? (
                                    <span className="inline-block text-slate-400 font-bold px-2.5 py-1 text-[10px] animate-pulse">
                                       ⏳ Transmitting...
                                    </span>
                                 ) : (
                                    <button 
                                      onClick={() => triggerDunSMS(client.id, client.name, client.phone, client.outstanding)}
                                      className="py-1 px-2.5 bg-brand-orange hover:bg-brand-orange/90 text-white rounded font-bold text-[10px] uppercase shadow-xs hover:scale-105 transition-all"
                                    >
                                       Discharge SMS Reminder
                                    </button>
                                 )}
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>
         
         <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex justify-between font-bold text-slate-600 dark:text-slate-400">
           <span>Aged Receivables Pool Value: <strong className="text-slate-900 dark:text-white font-mono">KES {totalOutstandingAR.toLocaleString()}</strong></span>
           <span className="text-emerald-500 animate-pulse">All accounts audited this cycle.</span>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
