import React from 'react';
import { NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useSystemSettings } from '../../contexts/SettingsContext';
import { 
    LayoutDashboard, ShoppingCart, Package, ShoppingBag, 
    Truck, Users, BarChart3, BookOpen, Settings, LogOut, Cpu, Wrench, Lock, ShieldCheck 
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'POS', href: '/pos', icon: ShoppingCart },
  { name: 'Garage Chain & Diag', href: '/garage', icon: Wrench },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Sales', href: '/sales', icon: ShoppingBag },
  { name: 'Purchasing', href: '/purchasing', icon: Truck },
  { name: 'Logistics & Shipping', href: '/shipping', icon: Truck },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Accounting', href: '/accounting', icon: BookOpen },
  { name: 'API Connectors', href: '/integrations', icon: Cpu },
];

interface SidebarProps {
  onLogout: () => void;
  onLockTerminal?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, onLockTerminal }) => {
  const { settings } = useSystemSettings();
  
  return (
    <aside className="w-full h-full flex flex-col bg-white dark:bg-gray-800 border-r border-surface-2 dark:border-gray-700">
      <div className="h-16 flex items-center justify-between px-4 border-b border-surface-2 dark:border-gray-700 shrink-0 select-none">
        <h1 className="text-xl font-black text-ink dark:text-gray-50 flex items-center">
          {settings.corpShortName || 'Masuma'}
          <span className="text-brand-orange ml-0.5">POS</span>
        </h1>
        <span className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold">
          <ShieldCheck className="w-3 h-3" />
          SECURE
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-brand-orange/10 text-brand-orange'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-surface dark:hover:bg-gray-700'
                  }`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-3 border-t border-surface-2 dark:border-gray-700 space-y-2">
        {onLockTerminal && (
          <button
            onClick={onLockTerminal}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition cursor-pointer"
            title="Lock screen against unauthorized physical access"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Terminal</span>
          </button>
        )}
        <div className="flex items-center justify-around pt-1">
            <NavLink 
              to="/settings" 
              title="System Settings & Security Center"
              className={({isActive}) => `flex items-center gap-3 p-2 rounded-lg ${isActive ? 'bg-surface dark:bg-gray-700 text-brand-orange' : 'text-gray-600 dark:text-gray-300 hover:bg-surface dark:hover:bg-gray-700'}`}
            >
                <Settings className="w-5 h-5 shrink-0" />
            </NavLink>
            <ThemeToggle />
            <button 
              onClick={onLogout} 
              title="Sign Out Session"
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-surface dark:hover:bg-gray-700 cursor-pointer"
            >
                <LogOut className="w-5 h-5 shrink-0" />
            </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
