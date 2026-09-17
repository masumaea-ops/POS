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
import { AuthProvider, useAuth, getDefaultRoleHome } from './contexts/AuthContext';
import { RoleGuard } from './components/shared/RoleGuard';
import { X } from 'lucide-react';

const RoleAwareRoot: React.FC = () => {
  const { userRole } = useAuth();
  if (userRole === 'admin' || userRole === 'manager') {
    return <Dashboard />;
  }
  return <Navigate to={getDefaultRoleHome(userRole)} replace />;
};

const RoleAwareFallback: React.FC = () => {
  const { userRole } = useAuth();
  return <Navigate to={getDefaultRoleHome(userRole)} replace />;
};

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

const MainLayout: React.FC<{ 
  children: React.ReactNode; 
  onLogout: () => void;
  onLockTerminal: () => void;
}> = ({ children, onLogout, onLockTerminal }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
      return localStorage.getItem('masuma_sidebar_collapsed') === 'true';
    });

    const toggleSidebar = () => {
      setIsSidebarCollapsed(prev => {
        const next = !prev;
        localStorage.setItem('masuma_sidebar_collapsed', String(next));
        return next;
      });
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none transition-colors antialiased">
            {/* Full-width Top Navigation Header */}
            <Header 
              onLogout={onLogout} 
              onLockTerminal={onLockTerminal}
              onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />

            <div className="flex flex-1 overflow-hidden min-h-0">
                {/* Desktop Left Sidebar with Expand/Collapse Rail Mode */}
                <div className={`hidden lg:block ${isSidebarCollapsed ? 'lg:w-16' : 'lg:w-56'} lg:shrink-0 h-full transition-all duration-200 ease-in-out`}>
                    <Sidebar 
                      onLogout={onLogout} 
                      onLockTerminal={onLockTerminal}
                      isCollapsed={isSidebarCollapsed}
                      onToggleCollapse={toggleSidebar}
                    />
                </div>

                {/* Mobile/Tablet Sidebar Drawer */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden fixed inset-0 z-50 flex">
                        {/* Backdrop */}
                        <div 
                            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        {/* Drawer panel */}
                        <div className="relative flex-1 flex flex-col max-w-[260px] w-full bg-white dark:bg-slate-900 shadow-xl border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out">
                            <div className="absolute top-3 right-3 z-10">
                                <button
                                    type="button"
                                    className="flex items-center justify-center h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="flex-1 h-0 overflow-y-auto" onClick={() => setIsMobileMenuOpen(false)}>
                                <Sidebar onLogout={onLogout} onLockTerminal={onLockTerminal} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Application Content Area */}
                <main className="flex-1 flex flex-col overflow-y-auto relative bg-slate-50 dark:bg-slate-950 min-w-0 transition-colors">
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
    setIsAuthenticated(true);
    sessionStorage.setItem('masuma_auth_active', 'true');
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
      <AuthProvider onLogoutExternal={handleLogout}>
        <Router>
          <Routes>
            {needsMfa 
              ? <Route path="*" element={<MfaScreen onVerify={handleMfa} onCancel={() => setNeedsMfa(false)} />} />
              : <Route path="*" element={<LoginScreen onLogin={handleLogin} />} />
            }
          </Routes>
        </Router>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider onLogoutExternal={handleLogout}>
      <Router>
        <MainLayout onLogout={handleLogout} onLockTerminal={handleLockTerminal}>
          <Routes>
            {/* Streamlined Core Routes */}
            <Route path="/" element={<RoleAwareRoot />} />
            <Route path="/dashboard" element={<RoleAwareRoot />} />
            <Route path="/pos" element={<RoleGuard resource="pos"><POS /></RoleGuard>} />
            <Route path="/inventory" element={<RoleGuard resource="inventory"><Inventory /></RoleGuard>} />
            <Route path="/sales" element={<RoleGuard resource="sales"><Sales /></RoleGuard>} />
            <Route path="/sales-history" element={<RoleGuard resource="sales"><Sales /></RoleGuard>} />
            <Route path="/quotations" element={<RoleGuard resource="quotations"><Quotations /></RoleGuard>} />
            <Route path="/invoices" element={<RoleGuard resource="invoices"><Invoices /></RoleGuard>} />
            <Route path="/shipping" element={<RoleGuard resource="shipping"><Shipping /></RoleGuard>} />
            <Route path="/vin-picker" element={<RoleGuard resource="inventory"><VinPicker /></RoleGuard>} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/customers" element={<RoleGuard resource="contacts"><Contacts /></RoleGuard>} />

            {/* Enterprise & Restricted Operational Modules */}
            <Route path="/purchasing" element={<RoleGuard resource="purchasing"><Purchasing /></RoleGuard>} />
            <Route path="/contacts" element={<RoleGuard resource="contacts"><Contacts /></RoleGuard>} />
            <Route path="/reports" element={<RoleGuard resource="reports"><Reports /></RoleGuard>} />
            <Route path="/accounting" element={<RoleGuard resource="accounting"><Accounting /></RoleGuard>} />
            <Route path="/garage" element={<RoleGuard resource="garage"><Garage /></RoleGuard>} />
            <Route path="/integrations" element={<RoleGuard resource="integrations"><Integrations /></RoleGuard>} />
            <Route path="/settings" element={<RoleGuard resource="settings"><Settings /></RoleGuard>} />

            {/* Fallback */}
            <Route path="*" element={<RoleAwareFallback />} />
          </Routes>
        </MainLayout>

        {/* Inactivity & Manual Terminal Lock Screen */}
        <TerminalLockModal
          isOpen={isTerminalLocked}
          onUnlock={handleUnlockTerminal}
          onLogout={handleLogout}
        />
      </Router>
    </AuthProvider>
  );
};

export default App;
