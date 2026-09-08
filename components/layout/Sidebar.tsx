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
  ChevronLeft,
  LucideIcon
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const NAV_SECTIONS: NavSectionItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    to: '/',
    icon: LayoutDashboard,
    children: [
      { label: 'Executive Overview', to: '/', icon: LayoutDashboard },
      { label: 'Analytics & Trends', to: '/?tab=analytics', icon: TrendingUp },
    ],
  },
  {
    id: 'pos',
    label: 'POS Register',
    to: '/pos',
    icon: ShoppingCart,
    children: [
      { label: 'Counter Register', to: '/pos', icon: CreditCard },
      { label: 'Held Orders', to: '/pos?view=held', icon: Receipt },
    ],
  },
  {
    id: 'garage',
    label: 'Garage & OBD-II',
    to: '/garage',
    icon: Wrench,
    children: [
      { label: 'Job Cards', to: '/garage?tab=job_cards', icon: ClipboardCheck },
      { label: 'Diagnostics', to: '/garage?tab=diagnostics', icon: Activity },
      { label: 'Service History', to: '/garage?tab=service_history', icon: History },
      { label: 'Customer CSAT', to: '/garage?tab=customer_satisfaction', icon: Star },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory & Parts',
    to: '/inventory',
    icon: Boxes,
    children: [
      { label: 'Parts Catalog', to: '/inventory', icon: Package },
      { label: 'VIN & Chassis Picker', to: '/vin-picker', icon: Car },
      { label: 'Stock Alerts', to: '/inventory?tab=alerts', icon: AlertTriangle },
    ],
  },
  {
    id: 'sales',
    label: 'Sales & Orders',
    to: '/sales',
    icon: BarChart2,
    children: [
      { label: 'Sales Orders', to: '/sales', icon: ShoppingBag },
      { label: 'Sales History', to: '/sales-history', icon: History },
      { label: 'Quotations', to: '/quotations', icon: FileText },
      { label: 'Tax Invoices', to: '/invoices', icon: Receipt },
    ],
  },
  {
    id: 'purchasing',
    label: 'Purchasing (PO/GRN)',
    to: '/purchasing',
    icon: ClipboardList,
    children: [
      { label: 'Purchase Orders', to: '/purchasing', icon: FileSpreadsheet },
      { label: 'Deliveries (GRN)', to: '/purchasing?tab=grn', icon: PackageCheck },
    ],
  },
  {
    id: 'shipping',
    label: 'Dispatch & Shipping',
    to: '/shipping',
    icon: Truck,
    children: [
      { label: 'Dispatch', to: '/shipping', icon: Send },
      { label: 'Tracking & Couriers', to: '/shipping?tab=tracking', icon: MapPin },
    ],
  },
  {
    id: 'contacts',
    label: 'Contacts & B2B',
    to: '/contacts',
    icon: Users,
    children: [
      { label: 'Corporate Clients', to: '/customers', icon: UserCheck },
      { label: 'Parts Suppliers', to: '/contacts?tab=Suppliers', icon: Building2 },
    ],
  },
  {
    id: 'reports',
    label: 'Reports & Audit',
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
      { label: 'General Ledger', to: '/accounting?tab=coa', icon: Calculator },
      { label: 'Cash Flow', to: '/accounting?tab=reconciliation', icon: Coins },
    ],
  },
  {
    id: 'api',
    label: 'Developer API',
    to: '/integrations',
    icon: Code2,
    children: [
      { label: 'Documentation', to: '/integrations?tab=overview', icon: Terminal },
      { label: 'Webhooks', to: '/integrations?tab=webhooks', icon: Zap },
      { label: 'Sandbox', to: '/integrations?tab=playground', icon: Play },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  onLogout,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccessRoute, userRole, getRoleBadge } = useAuth();
  const badge = getRoleBadge(userRole);

  // Dynamically filter sections based on granular role authorization
  const allowedSections = useMemo(() => {
    return NAV_SECTIONS.filter(section => {
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
      if ((!location.search || location.search === '') && isFirstChild) {
        return true;
      }
      return false;
    }

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
    <aside className="w-full h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 select-none transition-colors">
      
      {/* SCROLLABLE NAVIGATION LIST */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 custom-scrollbar">
        <ul className="space-y-1 text-xs">
          {allowedSections.map((section) => {
            const isExpanded = !!expandedSections[section.id];
            const SectionIcon = section.icon;
            const isDirectActive = isParentDirectlyActive(section);
            const hasSubActive = hasActiveSubItem(section);

            // Collapsed Rail View
            if (isCollapsed) {
              const isActive = isDirectActive || hasSubActive;
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => {
                      const targetRoute = canAccessRoute(section.to) 
                        ? section.to 
                        : (section.children && section.children[0]?.to) || section.to;
                      navigate(targetRoute);
                    }}
                    title={section.label}
                    className={`w-full flex items-center justify-center p-2.5 rounded-lg transition cursor-pointer ${
                      isActive
                        ? 'bg-brand-orange text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <SectionIcon className="w-4 h-4" />
                  </button>
                </li>
              );
            }

            // Expanded Standard View
            return (
              <li key={section.id} className="space-y-0.5">
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
                    className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-xs font-medium text-left cursor-pointer ${
                      isDirectActive
                        ? 'bg-brand-orange text-white font-semibold shadow-xs'
                        : hasSubActive
                        ? 'text-brand-orange bg-orange-50 dark:bg-orange-950/40 font-semibold border border-orange-200/70 dark:border-orange-800/40'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <SectionIcon className="w-4 h-4 shrink-0" />
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
                      className="p-1.5 ml-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                      )}
                    </button>
                  )}
                </div>

                {/* Nested Submenu Items */}
                {section.children && section.children.length > 0 && isExpanded && (
                  <div className="pl-3 py-0.5 space-y-0.5 ml-3 border-l border-slate-200 dark:border-slate-800">
                    {section.children.map((subItem, idx) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = isChildActive(subItem.to, idx === 0);

                      return (
                        <NavLink
                          key={`${section.id}-${subItem.label}`}
                          to={subItem.to}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors text-[11px] font-medium ${
                            isSubActive
                              ? 'bg-brand-orange text-white font-semibold shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <SubIcon className="w-3.5 h-3.5 shrink-0" />
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

      {/* FOOTER: Settings, Profile, Collapse Toggle, & Logout */}
      <div className="p-2 border-t border-slate-200/80 dark:border-slate-800 space-y-1 text-xs">
        
        {/* Collapse Rail Toggle */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full hidden lg:flex items-center justify-center gap-2 py-1.5 px-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-xs"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar to Compact Rail"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Compact View</span>
              </>
            )}
          </button>
        )}

        {/* Role Badge if expanded */}
        {!isCollapsed && (
          <div className={`p-2 rounded-lg ${badge.bg} border ${badge.border} flex items-center justify-between text-xs`}>
            <div className="flex flex-col min-w-0 pr-1">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Role</span>
              <span className={`font-bold truncate text-[11px] ${badge.color}`}>{badge.label}</span>
            </div>
            <span className={`w-2 h-2 rounded-full ${userRole === 'admin' ? 'bg-indigo-500' : userRole === 'manager' ? 'bg-amber-500' : userRole === 'cashier' ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
          </div>
        )}

        {canAccessRoute('/settings') && (
          <>
            {userRole === 'admin' && (
              <NavLink
                to="/settings?tab=users"
                title="Users & Staff"
                className={() =>
                  `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    location.pathname === '/settings' && location.search.includes('tab=users')
                      ? 'bg-brand-orange text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`
                }
              >
                <Users className="w-4 h-4 shrink-0 text-amber-500" />
                {!isCollapsed && <span>Users & Staff</span>}
              </NavLink>
            )}

            <NavLink
              to="/settings"
              title="System Settings"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive && !location.search.includes('tab=users')
                    ? 'bg-brand-orange text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                } ${isCollapsed ? 'justify-center px-0' : ''}`
              }
            >
              <SettingsIcon className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Settings</span>}
            </NavLink>
          </>
        )}

        <NavLink
          to="/profile"
          title="User Profile"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isActive
                ? 'bg-brand-orange text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            } ${isCollapsed ? 'justify-center px-0' : ''}`
          }
        >
          <User className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Profile</span>}
        </NavLink>

        <button
          type="button"
          onClick={onLogout}
          title="Sign Out Session"
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;
