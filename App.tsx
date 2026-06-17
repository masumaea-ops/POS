import React, { useState } from 'react';
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
import LoginScreen from './pages/LoginScreen';
import MfaScreen from './pages/MfaScreen';

const MainLayout: React.FC<{ children: React.ReactNode; onLogout: () => void; }> = ({ children, onLogout }) => {
    return (
        <div className="flex h-screen bg-surface dark:bg-gray-900 text-ink dark:text-gray-50">
            <Sidebar onLogout={onLogout}/>
            <main className="flex-1 flex flex-col overflow-hidden">
                {children}
            </main>
        </div>
    );
};


const App: React.FC = () => {
  // Simple auth state for demonstration
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsMfa, setNeedsMfa] = useState(false);

  const handleLogin = () => {
    // In a real app, you'd verify credentials
    setNeedsMfa(true);
  };

  const handleMfa = () => {
    // In a real app, you'd verify the MFA code
    setNeedsMfa(false);
    setIsAuthenticated(true);
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    setNeedsMfa(false);
  }

  if (!isAuthenticated) {
    return (
        <Router>
            <Routes>
                {needsMfa 
                    ? <Route path="*" element={<MfaScreen onVerify={handleMfa} />} />
                    : <Route path="*" element={<LoginScreen onLogin={handleLogin} />} />
                }
            </Routes>
        </Router>
    )
  }

  return (
    <Router>
        <MainLayout onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/purchasing" element={<Purchasing />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/accounting" element={<Accounting />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </MainLayout>
    </Router>
  );
};

export default App;
