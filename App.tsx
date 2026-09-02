import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Purchasing from './pages/Purchasing';
import Contacts from './pages/Contacts';
import Reports from './pages/Reports';
import Accounting from './pages/Accounting';
import Settings from './pages/Settings';
import Integrations from './pages/Integrations';
import Shipping from './pages/Shipping';
import Garage from './pages/Garage';
import LoginScreen from './pages/LoginScreen';
import MfaScreen from './pages/MfaScreen';
import { TerminalLockModal } from './components/shared/TerminalLockModal';
import { X, Menu, Lock } from 'lucide-react';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

const MainLayout: React.FC<{ 
  children: React.ReactNode; 
  onLogout: () => void;
  onLockTerminal: () => void;
}> = ({ children, onLogout, onLockTerminal }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen bg-surface dark:bg-gray-900 text-ink dark:text-gray-50 overflow-hidden">
            {/* Desktop Sidebar (Permanent) */}
            <div className="hidden lg:block lg:w-64 lg:shrink-0 h-full">
                <Sidebar onLogout={onLogout} onLockTerminal={onLockTerminal} />
            </div>

            {/* Mobile/Tablet Sidebar Drawer */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    {/* Drawer panel */}
                    <div className="relative flex-1 flex flex-col max-w-[260px] w-full bg-white dark:bg-gray-800 shadow-2xl transition-transform duration-300 ease-in-out">
                        <div className="absolute top-4 right-4 z-10">
                            <button
                                type="button"
                                className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <X className="h-5 w-5 text-slate-500 dark:text-slate-350" />
                            </button>
                        </div>
                        <div className="flex-1 h-0 overflow-y-auto" onClick={() => setIsMobileMenuOpen(false)}>
                            <Sidebar onLogout={onLogout} onLockTerminal={onLockTerminal} />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Application Area */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Mobile Top Header */}
                <header className="lg:hidden h-14 bg-white dark:bg-gray-800 border-b border-surface-2 dark:border-gray-700 flex items-center justify-between px-4 shrink-0 select-none z-10">
                    <button
                        type="button"
                        className="p-2 -ml-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none hover:bg-slate-50 dark:hover:bg-slate-750"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    
                    <h1 className="text-base font-black text-ink dark:text-gray-50 tracking-tight">
                        Masuma<span className="text-brand-orange">POS</span>
                    </h1>

                    <button
                      onClick={onLockTerminal}
                      className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg"
                      title="Lock Terminal"
                    >
                      <Lock className="w-5 h-5" />
                    </button>
                </header>

                <main className="flex-1 flex flex-col overflow-y-auto relative">
                    {children}
                </main>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('masuma_auth_active') === 'true';
  });
  const [needsMfa, setNeedsMfa] = useState(false);
  const [isTerminalLocked, setIsTerminalLocked] = useState(false);

  const handleLogin = () => {
    setNeedsMfa(true);
  };

  const handleMfa = () => {
    setNeedsMfa(false);
    setIsAuthenticated(true);
    sessionStorage.setItem('masuma_auth_active', 'true');
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    setNeedsMfa(false);
    setIsTerminalLocked(false);
    sessionStorage.removeItem('masuma_auth_active');
  };

  const handleLockTerminal = () => {
    setIsTerminalLocked(true);
  };

  const handleUnlockTerminal = () => {
    setIsTerminalLocked(false);
  };

  // Idle Inactivity Detection
  useEffect(() => {
    if (!isAuthenticated || isTerminalLocked) return;

    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsTerminalLocked(true);
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    events.forEach(ev => window.addEventListener(ev, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach(ev => window.removeEventListener(ev, resetTimer));
    };
  }, [isAuthenticated, isTerminalLocked]);

  if (!isAuthenticated) {
    return (
        <Router>
            <Routes>
                {needsMfa 
                    ? <Route path="*" element={<MfaScreen onVerify={handleMfa} onCancel={() => setNeedsMfa(false)} />} />
                    : <Route path="*" element={<LoginScreen onLogin={handleLogin} />} />
                }
            </Routes>
        </Router>
    );
  }

  return (
    <Router>
        <MainLayout onLogout={handleLogout} onLockTerminal={handleLockTerminal}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/purchasing" element={<Purchasing />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/accounting" element={<Accounting />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/garage" element={<Garage />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </MainLayout>

        {/* Inactivity & Manual Terminal Lock Screen */}
        <TerminalLockModal
          isOpen={isTerminalLocked}
          onUnlock={handleUnlockTerminal}
          onLogout={handleLogout}
        />
    </Router>
  );
};

export default App;
