import React, { useState } from 'react';
import { Bell, ChevronDown, LogOut, Lock, ShieldCheck, Menu } from 'lucide-react';
import { useSystemSettings } from '../../contexts/SettingsContext';
import { NavLink } from 'react-router-dom';

interface HeaderProps {
  onLogout: () => void;
  onLockTerminal?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLogout,
  onLockTerminal,
  onToggleMobileMenu
}) => {
  const { settings, setSettings } = useSystemSettings();
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Active user profile details
  const userName = 'Titus Mbaru';
  const userRole = 'Sales Staff';
  const userInitials = 'TM';

  const branches = [
    'Masuma Autoparts EA Ltd',
    'Masuma Nairobi - Industrial Area HQ',
    'Masuma Mombasa - Nyali Road Depot',
    'Masuma Kisumu - Central Hub'
  ];

  const currencies = ['KES', 'USD', 'TZS', 'UGX'];

  return (
    <header className="h-16 bg-[#0b1324] border-b border-slate-800 text-white flex items-center justify-between px-4 sm:px-6 shrink-0 select-none z-30 sticky top-0">
      
      {/* LEFT: LOGO & WELCOME GREETING */}
      <div className="flex items-center gap-4 lg:gap-6 min-w-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Corporate Brand Identity */}
        <NavLink to="/" className="flex flex-col shrink-0 group focus:outline-none">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#ff5000] tracking-tighter leading-none group-hover:brightness-110 transition">
              MASUMA
            </span>
          </div>
          <span className="text-[8px] sm:text-[9px] font-bold text-slate-300 tracking-[0.2em] uppercase leading-tight mt-0.5">
            AUTOPARTS EAST AFRICA
          </span>
        </NavLink>

        {/* Vertical Divider */}
        <div className="hidden md:block h-6 w-px bg-slate-800 shrink-0" />

        {/* Welcome message */}
        <div className="hidden md:block truncate">
          <span className="text-sm font-medium text-slate-200 truncate">
            Welcome to {settings.corpName || 'Masuma Autoparts EA Ltd'}
          </span>
        </div>
      </div>

      {/* RIGHT: CONTROLS, PROFILE & ACTIONS */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">

        {/* Currency Switcher Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setCurrencyMenuOpen(!currencyMenuOpen);
              setBranchMenuOpen(false);
              setNotificationsOpen(false);
            }}
            className="h-9 px-3 rounded-lg bg-slate-900/90 border border-slate-750 hover:border-slate-600 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            title="Select Currency"
          >
            <span>{settings.currency || 'KES'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {currencyMenuOpen && (
            <div className="absolute right-0 mt-1 w-28 bg-[#111c33] border border-slate-700 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95">
              {currencies.map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => {
                    setSettings(prev => ({ ...prev, currency: curr }));
                    setCurrencyMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    (settings.currency || 'KES') === curr
                      ? 'bg-[#ff5000]/15 text-[#ff5000]'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span>{curr}</span>
                  {(settings.currency || 'KES') === curr && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff5000]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Branch / Entity Selector Dropdown */}
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => {
              setBranchMenuOpen(!branchMenuOpen);
              setCurrencyMenuOpen(false);
              setNotificationsOpen(false);
            }}
            className="h-9 px-3.5 rounded-lg bg-slate-900/90 border border-slate-750 hover:border-slate-600 text-xs font-semibold text-slate-200 flex items-center gap-2 transition cursor-pointer max-w-[210px]"
            title="Select Branch"
          >
            <span className="truncate">{settings.corpName || 'Masuma Autoparts EA Ltd'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {branchMenuOpen && (
            <div className="absolute right-0 mt-1 w-64 bg-[#111c33] border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-800">
                Operating Branch
              </div>
              {branches.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    setSettings(prev => ({ ...prev, corpName: b }));
                    setBranchMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition cursor-pointer ${
                    (settings.corpName || 'Masuma Autoparts EA Ltd') === b
                      ? 'bg-[#ff5000]/15 text-[#ff5000] font-bold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setCurrencyMenuOpen(false);
              setBranchMenuOpen(false);
            }}
            className="w-9 h-9 rounded-lg bg-slate-900/90 border border-slate-750 hover:border-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#ff5000]" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-1 w-80 bg-[#111c33] border border-slate-700 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-white">System Alerts</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                  Online
                </span>
              </div>
              <div className="space-y-2 mt-2">
                <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-750">
                  <p className="font-semibold text-slate-200">Quotation QUO-1787297966229</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Approved & converted to Tax Invoice for Lydia.</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-750">
                  <p className="font-semibold text-slate-200">KRA eTIMS Synchronized</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">FSC device ready for automated fiscal signature generation.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Chip */}
        <NavLink
          to="/profile"
          className="flex items-center gap-2.5 px-2 py-1 rounded-xl hover:bg-slate-800/70 transition cursor-pointer"
          title="View Staff Profile"
        >
          <div className="w-9 h-9 rounded-full bg-[#ff5000] text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0 tracking-wider">
            {userInitials}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-bold text-white leading-tight">{userName}</span>
            <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">{userRole}</span>
          </div>
        </NavLink>

        {/* Lock Terminal Action */}
        {onLockTerminal && (
          <button
            type="button"
            onClick={onLockTerminal}
            className="hidden sm:flex w-9 h-9 rounded-lg bg-slate-900/90 border border-slate-750 hover:border-amber-600/60 text-slate-400 hover:text-amber-400 items-center justify-center transition cursor-pointer"
            title="Lock Physical Terminal"
          >
            <Lock className="w-4 h-4" />
          </button>
        )}

        {/* Logout Action */}
        <button
          type="button"
          onClick={onLogout}
          className="w-9 h-9 rounded-lg bg-slate-900/90 border border-slate-750 hover:border-rose-600/60 text-slate-400 hover:text-rose-400 flex items-center justify-center transition cursor-pointer"
          title="Sign Out Session"
        >
          <LogOut className="w-4 h-4" />
        </button>

      </div>
    </header>
  );
};

export default Header;
