import React, { useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  MapPin, 
  Mail, 
  Phone, 
  KeyRound, 
  CheckCircle2, 
  Clock, 
  Award,
  Lock,
  Building
} from 'lucide-react';
import { useSystemSettings } from '../contexts/SettingsContext';

export const Profile: React.FC = () => {
  const { settings, formatPrice } = useSystemSettings();
  const [pinNotice, setPinNotice] = useState(false);

  const profile = {
    fullName: 'Titus Mbaru',
    role: 'Sales Staff & POS Operator',
    email: 'titus.mbaru@masuma-ea.com',
    phone: '+254 712 345 678',
    branch: 'Masuma Autoparts EA Ltd - Nairobi HQ',
    terminalId: 'POS-TERM-01',
    shift: 'Morning Shift (07:30 - 16:30)',
    dailyTarget: 250000,
    dailyAchieved: 184500,
    quotationsIssued: 14,
    invoicesCompleted: 11
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinNotice(true);
    setTimeout(() => setPinNotice(false), 4000);
  };

  return (
    <div className="flex-1 bg-[#0b1324] text-white p-6 lg:p-8 overflow-y-auto">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white tracking-tight">
          Staff Profile & Authorization
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Active operator identity, terminal permissions, and shift metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Identity */}
        <div className="bg-[#111c33] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-[#ff5000] text-white font-black text-2xl flex items-center justify-center shadow-lg mb-4">
            TM
          </div>
          
          <h2 className="text-xl font-black text-white">{profile.fullName}</h2>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#ff5000]/15 text-[#ff5000] mt-1 mb-4 border border-[#ff5000]/30">
            {profile.role}
          </span>

          <div className="w-full space-y-3 text-left text-xs border-t border-slate-800 pt-4 font-mono">
            <div className="flex items-center gap-2.5 text-slate-300">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{profile.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{profile.phone}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <Building className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{profile.branch}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{profile.shift}</span>
            </div>
          </div>

          <div className="w-full mt-6 p-3 rounded-xl bg-[#0b1324] border border-slate-800 text-left">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Terminal Authorized</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Assigned to Station <strong className="text-white font-mono">{profile.terminalId}</strong> with Level 2 cashier, quoting, and eTIMS fiscal signing permissions.
            </p>
          </div>
        </div>

        {/* Right Section: Targets & Security PIN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Shift Performance */}
          <div className="bg-[#111c33] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4">
              Today's Performance Metrics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-[#0b1324] rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Gross Sales</span>
                <span className="text-xl font-black text-white font-mono mt-1 block">
                  {formatPrice(profile.dailyAchieved)}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold mt-1 block">
                  73.8% of daily target
                </span>
              </div>

              <div className="p-4 bg-[#0b1324] rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Quotations Issued</span>
                <span className="text-xl font-black text-white font-mono mt-1 block">
                  {profile.quotationsIssued}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  3 awaiting customer approval
                </span>
              </div>

              <div className="p-4 bg-[#0b1324] rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Invoices Cleared</span>
                <span className="text-xl font-black text-white font-mono mt-1 block">
                  {profile.invoicesCompleted}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold mt-1 block">
                  100% eTIMS validated
                </span>
              </div>
            </div>

            {/* Target Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300 font-mono">
                <span>Daily Sales Progress ({formatPrice(profile.dailyAchieved)})</span>
                <span>Target: {formatPrice(profile.dailyTarget)}</span>
              </div>
              <div className="w-full h-3 bg-[#0b1324] rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-[#ff5000] to-amber-500 rounded-full transition-all duration-500" 
                  style={{ width: `${(profile.dailyAchieved / profile.dailyTarget) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Terminal Security PIN Reset */}
          <div className="bg-[#111c33] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="w-5 h-5 text-[#ff5000]" />
              <h3 className="text-base font-bold text-white">
                Quick Terminal Unlock PIN
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Set a 4-digit PIN for rapid physical terminal unlocking after inactivity without re-entering master password.
            </p>

            <form onSubmit={handleUpdatePin} className="flex flex-col sm:flex-row gap-3">
              <input
                type="password"
                maxLength={4}
                defaultValue="1234"
                placeholder="4-digit PIN"
                className="w-full sm:w-40 h-10 px-3.5 bg-[#0b1324] border border-slate-750 focus:border-[#ff5000] rounded-xl text-center font-mono text-sm tracking-widest text-white focus:outline-none"
              />
              <button
                type="submit"
                className="h-10 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer transition"
              >
                Update Terminal PIN
              </button>
            </form>

            {pinNotice && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-955/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Security PIN updated successfully for Titus Mbaru.</span>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default Profile;
