import React, { useState } from 'react';
import PageHeader from '../components/shared/PageHeader';
import ThemeToggle from '../components/layout/ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import Card from '../components/shared/Card';

const Settings: React.FC = () => {
  const { theme } = useTheme();

  // General Settings States
  const [taxpin, setTaxpin] = useState('A011429519Z');
  const [branchCode, setBranchCode] = useState('NRB-HQ-01');
  const [deviceSerial, setDeviceSerial] = useState('FSC-KRA-10940C');
  const [isSyncingETIMS, setIsSyncingETIMS] = useState(false);
  const [syncTimestamp, setSyncTimestamp] = useState<string>('Never Synced');

  // Multi-Warehouse Active Outlet selection
  const [defaultOutlet, setDefaultOutlet] = useState('Nairobi HQ');
  const [markupTierA, setMarkupTierA] = useState(15);
  const [markupTierB, setMarkupTierB] = useState(22);

  // Business Profile States
  const [corpName, setCorpName] = useState('Masuma Autoparts East Africa Ltd');
  const [adminEmail, setAdminEmail] = useState('billing@masuma.co.ke');
  const [corpPhone, setCorpPhone] = useState('+254 712 345678');

  // Trigger eTIMS Mock Handshake Sync
  const handleEtimsHandshakeSync = () => {
    setIsSyncingETIMS(true);
    setTimeout(() => {
      setIsSyncingETIMS(false);
      const currentTime = new Date().toLocaleString();
      setSyncTimestamp(currentTime);
      alert(`🔄 KRA eTIMS SECURE HANDSHAKE SUCCESSFUL:\nTaxpayer PIN: ${taxpin}\nBranch Node: ${branchCode}\nSigned fiscal keys successfully synced with KRA Live servers.\nTimestamp: ${currentTime}`);
    }, 2000);
  };

  // Save Settings Trigger
  const handleSaveAllSettings = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`⚙️ ERP CONFIGURATIONS UPDATED:\nBusiness Profile, pricing markup ratios (Wholesale A: ${markupTierA}%, Wholesale B: ${markupTierB}%), and default outlet (${defaultOutlet}) committed securely.`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 pb-16 overflow-y-auto">
      <PageHeader title="Corporate ERP configurations" showSearch={false} />
      
      <div className="p-4 md:p-8 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Business Profile & Pricing Markups */}
        <div className="md:col-span-7 space-y-6">
          
          {/* Corporate Profile Card */}
          <Card className="border border-slate-200 dark:border-slate-700">
             <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">Business Profile</h3>
                <p className="text-xs text-slate-400">Official registered corporate taxpayer assets and contact desks.</p>
             </div>

             <div className="mt-4 space-y-4 text-xs font-sans">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label className="font-bold text-slate-600 dark:text-slate-400">Registered Entity Name</label>
                        <input 
                           type="text" 
                           value={corpName}
                           onChange={(e) => setCorpName(e.target.value)}
                           className="mt-1 w-full p-2.5 border border-slate-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white font-medium" 
                        />
                     </div>
                     <div>
                        <label className="font-bold text-slate-600 dark:text-slate-400">Distributor Hotline Code</label>
                        <input 
                           type="text" 
                           value={corpPhone}
                           onChange={(e) => setCorpPhone(e.target.value)}
                           className="mt-1 w-full p-2.5 border border-slate-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white font-medium" 
                        />
                     </div>
                 </div>

                 <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400">Executive Billing Mail Desk</label>
                    <input 
                       type="email" 
                       value={adminEmail}
                       onChange={(e) => setAdminEmail(e.target.value)}
                       className="mt-1 w-full p-2.5 border border-slate-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white font-medium" 
                    />
                 </div>
             </div>
          </Card>

          {/* Pricing Markups Policies Card */}
          <Card className="border border-slate-200 dark:border-slate-700">
             <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">B2B Wholesale Trade Markups</h3>
                <p className="text-xs text-slate-400">Configure safety margins and default markups automatically factored at POS checkouts.</p>
             </div>

             <div className="mt-4 grid grid-cols-2 gap-4 text-xs font-sans">
                 <div>
                    <label className="font-bold text-slate-655">Wholesale Tier A Markup (%)</label>
                    <input 
                       type="number"
                       value={markupTierA}
                       onChange={(e) => setMarkupTierA(Number(e.target.value) || 0)}
                       className="mt-1.5 w-full p-2.5 border border-slate-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white font-mono font-bold" 
                    />
                 </div>
                 <div>
                    <label className="font-bold text-slate-655">Wholesale Tier B Markup (%)</label>
                    <input 
                       type="number"
                       value={markupTierB}
                       onChange={(e) => setMarkupTierB(Number(e.target.value) || 0)}
                       className="mt-1.5 w-full p-2.5 border border-slate-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white font-mono font-bold" 
                    />
                 </div>
             </div>
          </Card>

          {/* Save trigger */}
          <div className="flex justify-end pt-2">
              <button 
                onClick={handleSaveAllSettings}
                className="py-3 px-8 bg-brand-orange hover:bg-brand-orange/95 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition hover:scale-105 shadow-md font-sans"
              >
                  Save ERP Configurations
              </button>
          </div>

        </div>

        {/* RIGHT COLUMN: KRA eTIMS Legislative hooks & Themes */}
        <div className="md:col-span-5 space-y-6">
          
          {/* KRA eTIMS Server compliance console */}
          <Card className="border border-slate-200 dark:border-slate-700">
             <div className="border-b pb-3 flex justify-between items-center">
                 <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">KRA eTIMS Sync Hook</h3>
                    <p className="text-[10px] text-slate-405">Digital Tax Compliance integration registry.</p>
                 </div>
                 <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
             </div>

             <div className="mt-4 space-y-4 text-xs font-mono">
                 <div>
                    <label className="font-bold text-slate-500 uppercase text-[9px]">Taxpayer PIN reference ID</label>
                    <input 
                       type="text" 
                       value={taxpin}
                       onChange={(e) => setTaxpin(e.target.value)}
                       className="mt-1 w-full p-2.5 border border-slate-150 dark:border-gray-650 rounded-lg bg-slate-50 dark:bg-gray-700 font-bold" 
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="font-bold text-slate-500 uppercase text-[9px]">Device Serial FSC</label>
                        <input 
                           type="text" 
                           value={deviceSerial}
                           onChange={(e) => setDeviceSerial(e.target.value)}
                           className="mt-1.5 w-full p-2.5 border border-slate-150 dark:border-gray-655 rounded-lg bg-slate-50 dark:bg-gray-700 font-bold" 
                        />
                     </div>
                     <div>
                        <label className="font-bold text-slate-500 uppercase text-[9px]">Branch HQ Code</label>
                        <input 
                           type="text" 
                           value={branchCode}
                           onChange={(e) => setBranchCode(e.target.value)}
                           className="mt-1.5 w-full p-2.5 border border-slate-150 dark:border-gray-655 rounded-lg bg-slate-50 dark:bg-gray-700 font-bold" 
                        />
                     </div>
                 </div>

                 <div className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg space-y-1">
                     <span className="text-[9px] font-bold text-slate-400 block uppercase">Gateway handshakes sync history</span>
                     <span className="font-bold text-slate-700 dark:text-slate-300 block">{syncTimestamp}</span>
                 </div>

                 <button 
                   onClick={handleEtimsHandshakeSync}
                   disabled={isSyncingETIMS}
                   className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500/50 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition"
                 >
                    {isSyncingETIMS ? (
                      <>
                        <span className="inline-block w-4.5 h-4.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                        Synchronizing general keys...
                      </>
                    ) : (
                      '🔄 Force Sync eTIMS Handshake'
                    )}
                 </button>
             </div>
          </Card>

          {/* Theme appearance card */}
          <Card className="border border-slate-200 dark:border-slate-700">
             <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">Appearance settings</h3>
                <p className="text-xs text-slate-400">Swap interface themes for visual ergonomics.</p>
             </div>
             <div className="mt-4 flex items-center justify-between text-xs">
                 <div>
                     <h4 className="font-bold text-slate-750 dark:text-slate-200 uppercase text-[10px]">Interface Theme</h4>
                     <p className="text-slate-450 mt-0.5">Active display selection: <span className="capitalize font-black font-mono text-brand-orange">{theme} mode</span></p>
                 </div>
                 <ThemeToggle />
             </div>
          </Card>

        </div>

      </div>

    </div>
  );
};

export default Settings;
