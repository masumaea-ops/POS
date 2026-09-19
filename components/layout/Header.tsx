import React, { useState } from 'react';
import { Bell, ChevronDown, LogOut, Lock, ShieldCheck, Menu, UserCheck, Sun, Moon, ShoppingBag, ShoppingCart } from 'lucide-react';
import { useSystemSettings } from '../../contexts/SettingsContext';
import { useAuth, getDefaultRoleHome } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { NavLink, useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const { settings, setSettings } = useSystemSettings();
  const { currentUser, primaryUser, userRole, isSimulating, exitSimulation, getRoleBadge, switchRole, allPersonas } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);

  const badge = getRoleBadge(userRole);

  const userInitials = (currentUser.fullName || currentUser.username || 'SU')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'SA';

  const branches = [
    'Masuma Autoparts EA Ltd',
    'Masuma Nairobi - Industrial Area HQ',
    'Masuma Mombasa - Nyali Road Depot',
    'Masuma Kisumu - Central Hub'
  ];

  const currencies = ['KES', 'USD', 'TZS', 'UGX'];

  return (
    <header className="h-15 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-between px-4 sm:px-6 shrink-0 select-none z-30 sticky top-0 transition-colors">
      
      {/* LEFT: LOGO & WELCOME GREETING */}
      <div className="flex items-center gap-3 lg:gap-5 min-w-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 -ml-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Corporate Brand Identity */}
        <NavLink to={getDefaultRoleHome(userRole)} className="flex items-center gap-2 group focus:outline-none shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-brand-orange tracking-tight leading-none group-hover:opacity-90 transition">
              MASUMA
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40">
              ERP
            </span>
          </div>
        </NavLink>

        {/* Subtle Divider */}
        <div className="hidden md:block h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

        {/* Operating Node Context */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
          <span className="truncate font-medium">
            {settings.corpName || 'Masuma Autoparts EA Ltd'}
          </span>
        </div>
      </div>

      {/* RIGHT: CONTROLS, THEME, PROFILE & ACTIONS */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

        {/* Quick Link to POS if accessible */}
        <NavLink
          to="/pos"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/40 text-brand-orange border border-orange-200 dark:border-orange-800/50 transition cursor-pointer"
          title="Open Quick POS Register"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Quick POS</span>
        </NavLink>

        {/* Currency Switcher Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setCurrencyMenuOpen(!currencyMenuOpen);
              setBranchMenuOpen(false);
              setNotificationsOpen(false);
              setPersonaMenuOpen(false);
            }}
            className="h-8.5 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition cursor-pointer"
            title="Select Currency"
          >
            <span>{settings.currency || 'KES'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {currencyMenuOpen && (
            <div className="absolute right-0 mt-1 w-28 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-50 animate-in fade-in zoom-in-95">
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
                      ? 'bg-orange-50 dark:bg-orange-950/40 text-brand-orange'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <span>{curr}</span>
                  {(settings.currency || 'KES') === curr && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Branch Selector Dropdown */}
        <div className="relative hidden lg:block">
          <button
            type="button"
            onClick={() => {
              setBranchMenuOpen(!branchMenuOpen);
              setCurrencyMenuOpen(false);
              setNotificationsOpen(false);
              setPersonaMenuOpen(false);
            }}
            className="h-8.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition cursor-pointer max-w-[200px]"
            title="Select Operating Branch"
          >
            <span className="truncate">{settings.corpName?.replace('Masuma ', '') || 'Nairobi HQ'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {branchMenuOpen && (
            <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700/80">
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
                      ? 'bg-orange-50 dark:bg-orange-950/40 text-brand-orange font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle (Light / Dark) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-8.5 h-8.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center transition cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setCurrencyMenuOpen(false);
              setBranchMenuOpen(false);
              setPersonaMenuOpen(false);
            }}
            className="w-8.5 h-8.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-slate-600 dark:text-slate-300 transition cursor-pointer relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-brand-orange" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-1.5 w-76 sm:w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-3 z-50 animate-in fade-in zoom-in-95 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white">System Alerts</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold">
                  Online
                </span>
              </div>
              <div className="space-y-2 mt-2">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200/80 dark:border-slate-700/60">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Quotation QUO-1787297966229</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Approved & ready for dispatch invoice.</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200/80 dark:border-slate-700/60">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">eTIMS Sync Verified</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">FSC device ready for automated fiscal validation.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Prominent Role Simulation Indicator (When Admin is testing other roles) */}
        {isSimulating && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="hidden md:inline font-medium">Simulating:</span>
            <span className="font-bold text-[11px] truncate max-w-[120px]">{badge.label}</span>
            <button
              type="button"
              onClick={() => {
                exitSimulation();
                navigate('/');
              }}
              className="ml-1 px-1.5 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold transition cursor-pointer"
              title="Exit Role Simulation and return to Super Admin"
            >
              Exit
            </button>
          </div>
        )}

        {/* User Avatar & Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setPersonaMenuOpen(!personaMenuOpen);
              setNotificationsOpen(false);
              setCurrencyMenuOpen(false);
              setBranchMenuOpen(false);
            }}
            className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition cursor-pointer"
            title="Active User Profile"
          >
            <div className={`w-8 h-8 rounded-full ${badge.bg} ${badge.color} border ${badge.border} font-bold text-xs flex items-center justify-center shrink-0`}>
              {userInitials}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[110px]">
                {currentUser.fullName || currentUser.username}
              </span>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${badge.color} leading-none mt-0.5`}>
                {badge.label}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown */}
          {personaMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl shadow-lg p-3 z-50 animate-in fade-in zoom-in-95 text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{currentUser.fullName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{currentUser.email || currentUser.username}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${badge.bg} ${badge.color} border ${badge.border}`}>
                  {userRole}
                </span>
              </div>

              {/* Outlet info */}
              <div className="p-2 bg-slate-50 dark:bg-slate-750 rounded-lg border border-slate-200/80 dark:border-slate-700/60 text-[11px] flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Branch Node:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currentUser.branch || 'Nairobi Central'}</span>
              </div>

              {/* Admin Persona Simulation (Available to authenticated Super Administrator) */}
              {primaryUser?.role === 'admin' && (
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1 text-brand-orange">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Role Simulation Mode</span>
                    </span>
                    {isSimulating && (
                      <button
                        type="button"
                        onClick={() => {
                          exitSimulation();
                          setPersonaMenuOpen(false);
                          navigate('/');
                        }}
                        className="text-[10px] text-rose-500 hover:text-rose-600 font-bold underline cursor-pointer"
                      >
                        Exit Simulation
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {allPersonas.map((persona) => {
                      const isSelected = persona.role === userRole;
                      const pBadge = getRoleBadge(persona.role);
                      return (
                        <button
                          key={persona.id}
                          type="button"
                          onClick={() => {
                            switchRole(persona.role);
                            setPersonaMenuOpen(false);
                            navigate(getDefaultRoleHome(persona.role));
                          }}
                          className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left transition cursor-pointer ${
                            isSelected
                              ? 'bg-orange-50 dark:bg-orange-950/40 border border-brand-orange/40 text-brand-orange font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="font-semibold text-[11px] truncate">{persona.fullName}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${pBadge.bg} ${pBadge.color} border ${pBadge.border} shrink-0`}>
                            {persona.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-2">
                <div className="flex gap-2">
                  <NavLink
                    to="/profile"
                    onClick={() => setPersonaMenuOpen(false)}
                    className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-center rounded-lg text-slate-700 dark:text-slate-200 font-bold transition"
                  >
                    My Profile
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => {
                      setPersonaMenuOpen(false);
                      onLogout();
                    }}
                    className="flex-1 py-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-center rounded-lg font-bold transition border border-rose-200 dark:border-rose-800/40 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lock Terminal Action */}
        {onLockTerminal && (
          <button
            type="button"
            onClick={onLockTerminal}
            className="hidden sm:flex w-8.5 h-8.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white items-center justify-center transition cursor-pointer"
            title="Lock Physical Terminal"
          >
            <Lock className="w-4 h-4" />
          </button>
        )}

        {/* Sign Out Action */}
        <button
          type="button"
          onClick={onLogout}
          className="w-8.5 h-8.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 flex items-center justify-center transition cursor-pointer"
          title="Sign Out Session"
        >
          <LogOut className="w-4 h-4" />
        </button>

      </div>
    </header>
  );
};

export default Header;
