import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Quotations from './pages/Quotations';
import Invoices from './pages/Invoices';
import VinPicker from './pages/VinPicker';
import Profile from './pages/Profile';
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
import { X } from 'lucide-react';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

const MainLayout: React.FC<{ 
  children: React.ReactNode; 
  onLogout: () => void;
  onLockTerminal: () => void;
}> = ({ children, onLogout, onLockTerminal }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex flex-col h-screen bg-[#0b1324] text-slate-100 overflow-hidden select-none">
            {/* Full-width Top Navigation Header as in Screenshot */}
            <Header 
              onLogout={onLogout} 
              onLockTerminal={onLockTerminal}
              onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />

            <div className="flex flex-1 overflow-hidden min-h-0">
                {/* Desktop Left Sidebar (Permanent) */}
                <div className="hidden lg:block lg:w-60 lg:shrink-0 h-full">
                    <Sidebar onLogout={onLogout} onLockTerminal={onLockTerminal} />
                </div>

                {/* Mobile/Tablet Sidebar Drawer */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden fixed inset-0 z-50 flex">
                        {/* Backdrop */}
                        <div 
                            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" 
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        {/* Drawer panel */}
                        <div className="relative flex-1 flex flex-col max-w-[260px] w-full bg-[#0b1324] shadow-2xl transition-transform duration-300 ease-in-out">
                            <div className="absolute top-4 right-4 z-10">
                                <button
                                    type="button"
                                    className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-800 text-slate-400 hover:text-white focus:outline-none cursor-pointer"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="flex-1 h-0 overflow-y-auto" onClick={() => setIsMobileMenuOpen(false)}>
                                <Sidebar onLogout={onLogout} onLockTerminal={onLockTerminal} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Application Content Area */}
                <main className="flex-1 flex flex-col overflow-y-auto relative bg-[#0b1324] min-w-0">
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
            {/* Streamlined Core Routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/sales-history" element={<Sales />} />
            <Route path="/quotations" element={<Quotations />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/vin-picker" element={<VinPicker />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/customers" element={<Contacts />} />

            {/* Enterprise & Financial Systems */}
            <Route path="/purchasing" element={<Purchasing />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/accounting" element={<Accounting />} />
            <Route path="/garage" element={<Garage />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/settings" element={<Settings />} />

            {/* Fallback */}
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
