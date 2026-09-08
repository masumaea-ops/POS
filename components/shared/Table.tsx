import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Eye, Copy, Printer, Check, ExternalLink } from 'lucide-react';

export interface TableRowAction<T> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (item: T) => void;
  variant?: 'default' | 'danger' | 'success' | 'warning';
  hidden?: (item: T) => boolean;
}

export interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  renderActions?: (item: T, close: () => void) => React.ReactNode;
  rowActions?: TableRowAction<T>[];
}

interface ActiveMenuState<T> {
  item: T;
  top: number;
  left: number;
  openUpward: boolean;
}

const Table = <T extends { id: any }>({ columns, data, onRowClick, renderActions, rowActions }: TableProps<T>) => {
  const [activeMenu, setActiveMenu] = useState<ActiveMenuState<T> | null>(null);
  const [copiedId, setCopiedId] = useState<any | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menu on outside click, window scroll or Escape key
  useEffect(() => {
    if (!activeMenu) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenu(null);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };

    const handleScroll = (e: Event) => {
      // If scrolling inside the menu itself, do not close
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      setActiveMenu(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeMenu]);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, item: T) => {
    e.stopPropagation();

    // If clicking the same item's menu that is already open, toggle it off
    if (activeMenu && activeMenu.item.id === item.id) {
      setActiveMenu(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const menuEstimatedHeight = 240;
    const menuWidth = 210;

    // Check if there is enough space below the button in viewport
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < menuEstimatedHeight && rect.top > menuEstimatedHeight;

    const top = openUpward ? rect.top - 6 : rect.bottom + 6;
    // Align right edge of menu with right edge of button, clamped to screen bounds
    const left = Math.max(12, Math.min(window.innerWidth - menuWidth - 12, rect.right - menuWidth));

    setActiveMenu({
      item,
      top,
      left,
      openUpward
    });
  };

  const handleCopy = (e: React.MouseEvent, id: any) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const closeMenu = () => {
    setActiveMenu(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
      <div className="overflow-x-auto min-h-[220px]">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="p-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
              <th className="p-3.5 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-8 text-center text-xs text-slate-400">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const isMenuOpen = activeMenu?.item.id === item.id;

                return (
                  <tr 
                    key={item.id} 
                    className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50' : ''}`}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((col, index) => (
                      <td key={index} className="p-3.5 text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        {col.accessor(item)}
                      </td>
                    ))}
                    <td 
                      className="p-3.5 text-center text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button 
                        type="button"
                        onClick={(e) => handleOpenMenu(e, item)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center ${
                          isMenuOpen 
                            ? 'bg-brand-orange text-white shadow-xs' 
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title="Actions Menu"
                        aria-label="Actions Menu"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* UNCLIPPED FLOATING PORTAL ACTIONS MENU */}
      {activeMenu && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: activeMenu.openUpward ? undefined : `${activeMenu.top}px`,
            bottom: activeMenu.openUpward ? `${window.innerHeight - activeMenu.top}px` : undefined,
            left: `${activeMenu.left}px`,
            zIndex: 99999,
          }}
          className="w-52 bg-white dark:bg-[#0f172a] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100 select-none overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <span>Row Actions</span>
            <span className="font-mono text-[9px] text-slate-400">ID: {String(activeMenu.item.id).slice(0, 8)}</span>
          </div>

          <div className="py-1">
            {/* Custom renderActions prop if supplied */}
            {renderActions ? (
              renderActions(activeMenu.item, closeMenu)
            ) : rowActions && rowActions.length > 0 ? (
              /* Custom rowActions array if supplied */
              rowActions
                .filter(action => !action.hidden || !action.hidden(activeMenu.item))
                .map((action, idx) => {
                  const Icon = action.icon;
                  const isDanger = action.variant === 'danger';
                  const isSuccess = action.variant === 'success';

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeMenu();
                        action.onClick(activeMenu.item);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                        isDanger
                          ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                          : isSuccess
                          ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${isDanger ? 'text-rose-500' : isSuccess ? 'text-emerald-500' : 'text-slate-400'}`} />}
                      <span className="truncate">{action.label}</span>
                    </button>
                  );
                })
            ) : (
              /* Default actions fallback */
              <>
                {onRowClick && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeMenu();
                      onRowClick(activeMenu.item);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>View Record Details</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => handleCopy(e, activeMenu.item.id)}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                >
                  {copiedId === activeMenu.item.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-emerald-500 font-bold">Copied ID to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Copy Record ID</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeMenu();
                    window.print();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Print Document Sheet</span>
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Table;
