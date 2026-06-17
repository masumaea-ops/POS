import React from 'react';
import { NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useSystemSettings } from '../../contexts/SettingsContext';
import { 
    GridIcon, ShoppingCartIcon, PackageIcon, ShoppingBagIcon, 
    TruckIcon, UsersGroupIcon, BarChartIcon, BookOpenIcon, SettingsIcon, LogOutIcon, CpuIcon 
} from '../shared/Icons';

const navigation = [
  { name: 'Dashboard', href: '/', icon: GridIcon },
  { name: 'POS', href: '/pos', icon: ShoppingCartIcon },
  { name: 'Inventory', href: '/inventory', icon: PackageIcon },
  { name: 'Sales', href: '/sales', icon: ShoppingBagIcon },
  { name: 'Purchasing', href: '/purchasing', icon: TruckIcon },
  { name: 'Contacts', href: '/contacts', icon: UsersGroupIcon },
  { name: 'Reports', href: '/reports', icon: BarChartIcon },
  { name: 'Accounting', href: '/accounting', icon: BookOpenIcon },
  { name: 'API Connectors', href: '/integrations', icon: CpuIcon },
];

const Sidebar: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { settings } = useSystemSettings();
  
  return (
    <aside className="w-64 flex flex-col bg-white dark:bg-gray-800 border-r border-surface-2 dark:border-gray-700">
      <div className="h-16 flex items-center justify-center border-b border-surface-2 dark:border-gray-700 shrink-0 select-none">
        <h1 className="text-xl font-black text-ink dark:text-gray-50 flex items-center">
          {settings.corpShortName || 'Masuma'}
          <span className="text-brand-orange ml-0.5">POS</span>
        </h1>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        <ul>
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
                <item.icon />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-surface-2 dark:border-gray-700">
        <div className="flex items-center justify-around">
            <NavLink to="/settings" className={({isActive}) => `flex items-center gap-3 p-2 rounded-lg ${isActive ? 'bg-surface dark:bg-gray-700' : ''} text-gray-600 dark:text-gray-300 hover:bg-surface dark:hover:bg-gray-700`}>
                <SettingsIcon/>
            </NavLink>
            <ThemeToggle />
            <button onClick={onLogout} className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-surface dark:hover:bg-gray-700">
                <LogOutIcon />
            </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
