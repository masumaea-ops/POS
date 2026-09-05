import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  ShoppingCart, 
  Wrench, 
  BarChart2, 
  Users, 
  FileText, 
  Receipt, 
  Truck, 
  Car,
  User, 
  LogOut,
  Settings as SettingsIcon,
  BookOpen,
  Boxes,
  LayoutDashboard
} from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
  onLockTerminal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const location = useLocation();

  const isQuotationsActive = location.pathname === '/quotations';
  const isSalesActive = location.pathname.startsWith('/sales') || location.pathname === '/sales-history';

  return (
    <aside className="w-full h-full flex flex-col bg-[#0b1324] border-r border-slate-800 text-slate-300 select-none">
      
      {/* NAVIGATION ITEMS */}
      <nav className="flex-1 overflow-y-auto py-5 px-3">
        <ul className="space-y-1.5 font-medium text-sm">
          
          {/* Point of Sale */}
          <li>
            <NavLink
              to="/pos"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-[#ff5000] text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <ShoppingCart className="w-5 h-5 shrink-0" />
              <span>Point of Sale</span>
            </NavLink>
          </li>

          {/* Inventory */}
          <li>
            <NavLink
              to="/inventory"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-[#ff5000] text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Wrench className="w-5 h-5 shrink-0" />
              <span>Inventory</span>
            </NavLink>
          </li>

          {/* Sales with Sales History sub-item */}
          <li>
            <NavLink
              to="/sales"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                  isActive && !isQuotationsActive
                    ? 'bg-[#ff5000] text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <BarChart2 className="w-5 h-5 shrink-0" />
              <span>Sales</span>
            </NavLink>

            {/* Sub-item: Sales History */}
            <div className="pl-9 pr-2 py-1">
              <NavLink
                to="/sales-history"
                className={({ isActive }) =>
                  `block text-xs py-1.5 px-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'text-[#ff5000] font-bold bg-[#ff5000]/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`
                }
              >
                Sales History
              </NavLink>
            </div>
          </li>

          {/* Customers */}
          <li>
            <NavLink
              to="/customers"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-[#ff5000] text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Users className="w-5 h-5 shrink-0" />
              <span>Customers</span>
            </NavLink>
          </li>

          {/* Quotations (Main highlighted item as seen in screenshot) */}
          <li>
            <NavLink
              to="/quotations"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-[#ff5000] text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <FileText className="w-5 h-5 shrink-0" />
              <span>Quotations</span>
            </NavLink>
          </li>

          {/* Invoices */}
          <li>
            <NavLink
              to="/invoices"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-[#ff5000] text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Receipt className="w-5 h-5 shrink-0" />
              <span>Invoices</span>
            </NavLink>
          </li>

          {/* Shipping */}
          <li>
            <NavLink
              to="/shipping"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-[#ff5000] text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Truck className="w-5 h-5 shrink-0" />
              <span>Shipping</span>
            </NavLink>
          </li>

          {/* VIN Picker */}
          <li>
            <NavLink
              to="/vin-picker"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-[#ff5000] text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Car className="w-5 h-5 shrink-0" />
              <span>VIN Picker</span>
            </NavLink>
          </li>

          {/* Divider */}
          <li className="pt-2 pb-1">
            <div className="h-px bg-slate-800/80 mx-2" />
          </li>

          {/* Enterprise Modules: Dashboard, Accounting, Settings */}
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs transition-colors ${
                  isActive
                    ? 'bg-[#ff5000]/15 text-[#ff5000] font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Executive Dashboard</span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/accounting"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs transition-colors ${
                  isActive
                    ? 'bg-[#ff5000]/15 text-[#ff5000] font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`
              }
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>Accounting & Ledger</span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs transition-colors ${
                  isActive
                    ? 'bg-[#ff5000]/15 text-[#ff5000] font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`
              }
            >
              <SettingsIcon className="w-4 h-4 shrink-0" />
              <span>System Settings</span>
            </NavLink>
          </li>

        </ul>
      </nav>

      {/* FOOTER NAVIGATION: Profile & Logout as in Screenshot */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`
          }
        >
          <User className="w-5 h-5 shrink-0" />
          <span>Profile</span>
        </NavLink>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800/50 transition cursor-pointer text-left"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;
