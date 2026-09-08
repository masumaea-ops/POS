import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard,
  TrendingUp,
  ShoppingCart, 
  CreditCard,
  Receipt,
  Wrench, 
  ClipboardCheck,
  Activity,
  History,
  Star,
  Boxes,
  Package,
  Car,
  AlertTriangle,
  BarChart2, 
  ShoppingBag,
  FileText,
  ClipboardList,
  FileSpreadsheet,
  PackageCheck,
  Truck, 
  Send,
  MapPin,
  Users, 
  UserCheck,
  Building2,
  FileBarChart,
  LineChart,
  ShieldCheck,
  Layers,
  BookOpen, 
  Calculator,
  Coins,
  Code2,
  Terminal,
  Zap,
  Play,
  User, 
  LogOut,
  Settings as SettingsIcon,
  ChevronDown,
  ChevronRight,
  LucideIcon,
  ShieldAlert
} from 'lucide-react';

interface SubMenuItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

interface NavSectionItem {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  children?: SubMenuItem[];
}

interface SidebarProps {
  onLogout: () => void;
  onLockTerminal?: () => void;
}

const NAV_SECTIONS: NavSectionItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    to: '/',
    icon: LayoutDashboard,
    children: [
      { label: 'Executive Overview', to: '/', icon: LayoutDashboard },
      { label: 'Analytics & Performance', to: '/?tab=analytics', icon: TrendingUp },
    ],
  },
  {
    id: 'pos',
    label: 'POS',
    to: '/pos',
    icon: ShoppingCart,
    children: [
      { label: 'Counter Register', to: '/pos', icon: CreditCard },
      { label: 'Held Carts & Orders', to: '/pos?view=held', icon: Receipt },
    ],
  },
  {
    id: 'garage',
    label: 'Garage Chain & Diag',
    to: '/garage',
    icon: Wrench,
    children: [
      { label: 'Job Cards & Work Orders', to: '/garage?tab=job_cards', icon: ClipboardCheck },
      { label: 'OBD-II Diagnostics', to: '/garage?tab=diagnostics', icon: Activity },
      { label: 'Service History', to: '/garage?tab=service_history', icon: History },
      { label: 'Customer Satisfaction', to: '/garage?tab=customer_satisfaction', icon: Star },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    to: '/inventory',
    icon: Boxes,
    children: [
      { label: 'Parts Catalog', to: '/inventory', icon: Package },
      { label: 'VIN & Chassis Picker', to: '/vin-picker', icon: Car },
      { label: 'Stock Alerts & Reorder', to: '/inventory?tab=alerts', icon: AlertTriangle },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    to: '/sales',
    icon: BarChart2,
    children: [
      { label: 'Sales Orders', to: '/sales', icon: ShoppingBag },
      { label: 'Sales History', to: '/sales-history', icon: History },
      { label: 'Quotations', to: '/quotations', icon: FileText },
      { label: 'Invoices & eTIMS', to: '/invoices', icon: Receipt },
    ],
  },
  {
    id: 'purchasing',
    label: 'Purchasing',
    to: '/purchasing',
    icon: ClipboardList,
    children: [
      { label: 'Purchase Orders', to: '/purchasing', icon: FileSpreadsheet },
      { label: 'Supplier Deliveries (GRN)', to: '/purchasing?tab=grn', icon: PackageCheck },
    ],
  },
  {
    id: 'shipping',
    label: 'Logistics & Shipping',
    to: '/shipping',
    icon: Truck,
    children: [
      { label: 'Delivery Dispatch', to: '/shipping', icon: Send },
      { label: 'Couriers & Tracking', to: '/shipping?tab=tracking', icon: MapPin },
    ],
  },
  {
    id: 'contacts',
    label: 'Contacts',
    to: '/contacts',
    icon: Users,
    children: [
      { label: 'Corporate Customers', to: '/customers', icon: UserCheck },
      { label: 'Parts Suppliers', to: '/contacts?tab=Suppliers', icon: Building2 },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    to: '/reports',
    icon: FileBarChart,
    children: [
      { label: 'Sales & Revenue', to: '/reports?tab=sales', icon: LineChart },
      { label: 'KRA eTIMS Tax Audit', to: '/reports?tab=vat', icon: ShieldCheck },
      { label: 'Inventory Valuation', to: '/reports?tab=inventory', icon: Layers },
    ],
  },
  {
    id: 'accounting',
    label: 'Accounting',
    to: '/accounting',
    icon: BookOpen,
    children: [
      { label: 'General Ledger & COA', to: '/accounting?tab=coa', icon: Calculator },
      { label: 'Cash Flow & Balances', to: '/accounting?tab=reconciliation', icon: Coins },
    ],
  },
  {
    id: 'api',
    label: 'API',
    to: '/integrations',
    icon: Code2,
    children: [
      { label: 'Endpoints & Docs', to: '/integrations?tab=overview', icon: Terminal },
      { label: 'Webhooks & Logs', to: '/integrations?tab=webhooks', icon: Zap },
      { label: 'Sandbox Playground', to: '/integrations?tab=playground', icon: Play },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccessRoute, userRole, getRoleBadge, currentUser } = useAuth();
  const badge = getRoleBadge(userRole);

  // Dynamically filter sections based on granular role authorization
  const allowedSections = useMemo(() => {
    return NAV_SECTIONS.filter(section => {
      // Dashboard is strictly reserved for management only (Admin & Regional Manager)
      if (section.id === 'dashboard' && userRole !== 'admin' && userRole !== 'manager') {
        return false;
      }
      const canAccessParent = canAccessRoute(section.to);
      const hasAllowedChildren = section.children?.some(c => canAccessRoute(c.to));
      return canAccessParent || hasAllowedChildren;
    }).map(section => {
      if (!section.children) return section;
      return {
        ...section,
        children: section.children.filter(c => canAccessRoute(c.to))
      };
    });
  }, [canAccessRoute, userRole]);

  // Determine which sections should be expanded initially
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const section of NAV_SECTIONS) {
      const isParentMatch = location.pathname === section.to;
      const isChildMatch = section.children?.some(c => {
        const [childBase] = c.to.split('?');
        return location.pathname === childBase;
      });
      if (isParentMatch || isChildMatch) {
        initial[section.id] = true;
      }
    }
    return initial;
  });

  // Keep active section expanded when location changes
  useEffect(() => {
    for (const section of NAV_SECTIONS) {
      const isParentMatch = location.pathname === section.to;
      const isChildMatch = section.children?.some(c => {
        const [childBase] = c.to.split('?');
        return location.pathname === childBase;
      });
      if (isParentMatch || isChildMatch) {
        setExpandedSections(prev => ({ ...prev, [section.id]: true }));
      }
    }
  }, [location.pathname]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const isChildActive = (targetTo: string, isFirstChild: boolean = false) => {
    const [targetBase, targetQuery] = targetTo.split('?');
    
    if (location.pathname !== targetBase) {
      return false;
    }

    if (targetQuery) {
      if (location.search === `?${targetQuery}`) {
        return true;
      }
      // If user is on the base route without query, activate the default first tab
      if ((!location.search || location.search === '') && isFirstChild) {
        return true;
      }
      return false;
    }

    // Target has no query string
    return !location.search || location.search === '';
  };

  const hasActiveSubItem = (section: NavSectionItem) => {
    if (!section.children) return false;
    return section.children.some((c, idx) => isChildActive(c.to, idx === 0));
  };

  const isParentDirectlyActive = (section: NavSectionItem) => {
    if (section.to === '/') {
      return location.pathname === '/' && (!location.search || location.search === '');
    }
    return location.pathname === section.to && !hasActiveSubItem(section);
  };

  return (
    <aside className="w-full h-full flex flex-col bg-[#0b1324] border-r border-slate-800 text-slate-300 select-none">
      
      {/* SCROLLABLE NAVIGATION LIST */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 custom-scrollbar">
        <ul className="space-y-1.5 font-medium text-sm">
          {allowedSections.map((section) => {
            const isExpanded = !!expandedSections[section.id];
            const SectionIcon = section.icon;
            const isDirectActive = isParentDirectlyActive(section);
            const hasSubActive = hasActiveSubItem(section);

            return (
              <li key={section.id} className="space-y-1">
                {/* Main Menu Item */}
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      const targetRoute = canAccessRoute(section.to) 
                        ? section.to 
                        : (section.children && section.children[0]?.to) || section.to;
                      navigate(targetRoute);
                      setExpandedSections(prev => ({ ...prev, [section.id]: true }));
                    }}
                    className={`flex-1 flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-sm font-medium text-left cursor-pointer ${
                      isDirectActive
                        ? 'bg-[#ff5000] text-white font-semibold shadow-sm'
                        : hasSubActive
                        ? 'text-white bg-slate-800/80 font-medium'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <SectionIcon className="w-5 h-5 shrink-0" />
                    <span className="flex-1 truncate">{section.label}</span>
                  </button>

                  {/* Accordion toggle if section has children */}
                  {section.children && section.children.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection(section.id);
                      }}
                      title={isExpanded ? `Collapse ${section.label}` : `Expand ${section.label}`}
                      className="p-2 ml-1 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 shrink-0 transition-transform" />
                      ) : (
                        <ChevronRight className="w-4 h-4 shrink-0 transition-transform" />
                      )}
                    </button>
                  )}
                </div>

                {/* Nested Submenu Items */}
                {section.children && section.children.length > 0 && isExpanded && (
                  <div className="pl-3.5 pt-0.5 pb-1 space-y-1 ml-3 border-l border-slate-800/80">
                    {section.children.map((subItem, idx) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = isChildActive(subItem.to, idx === 0);

                      return (
                        <NavLink
                          key={`${section.id}-${subItem.label}`}
                          to={subItem.to}
                          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-sm font-medium ${
                            isSubActive
                              ? 'bg-[#ff5000] text-white font-semibold shadow-sm'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                          }`}
                        >
                          <SubIcon className="w-5 h-5 shrink-0" />
                          <span className="truncate">{subItem.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* FOOTER NAVIGATION: System Settings, Profile & Role Badge */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        {/* Active Role Indicator Badge */}
        <div className={`p-2 rounded-xl ${badge.bg} border ${badge.border} flex items-center justify-between mb-1 text-xs`}>
          <div className="flex flex-col min-w-0 pr-1">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Role Access</span>
            <span className={`font-bold truncate text-[11px] ${badge.color}`}>{badge.label}</span>
          </div>
          <span className={`w-2 h-2 rounded-full ${userRole === 'admin' ? 'bg-indigo-400' : userRole === 'manager' ? 'bg-amber-400' : userRole === 'cashier' ? 'bg-emerald-400' : userRole === 'workshop' ? 'bg-cyan-400' : 'bg-purple-400'} animate-pulse`} />
        </div>

        {canAccessRoute('/settings') && (
          <>
            <NavLink
              to="/settings?tab=users"
              className={() =>
                `flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  location.pathname === '/settings' && location.search.includes('tab=users')
                    ? 'bg-[#ff5000] text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Users className="w-5 h-5 shrink-0 text-amber-400" />
              <span>Users & Staff</span>
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive && !location.search.includes('tab=users')
                    ? 'bg-[#ff5000] text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <SettingsIcon className="w-5 h-5 shrink-0" />
              <span>System Settings</span>
            </NavLink>
          </>
        )}

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? 'bg-[#ff5000] text-white font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`
          }
        >
          <User className="w-5 h-5 shrink-0" />
          <span>Profile</span>
        </NavLink>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-rose-400 hover:bg-slate-800/60 transition cursor-pointer text-left"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;
