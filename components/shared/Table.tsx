import React, { useState } from 'react';
import { MoreVertical, Eye, Copy, Printer, Check } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  renderActions?: (item: T) => React.ReactNode;
}

const Table = <T extends { id: any }>({ columns, data, onRowClick, renderActions }: TableProps<T>) => {
  const [openMenuId, setOpenMenuId] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<any | null>(null);

  const handleCopy = (e: React.MouseEvent, id: any) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
    setOpenMenuId(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-main overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface dark:bg-gray-700/50">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="p-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
              <th className="p-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-2 dark:divide-gray-700">
            {data.map((item) => (
              <tr 
                  key={item.id} 
                  className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-surface dark:hover:bg-gray-700' : ''}`}
                  onClick={() => onRowClick?.(item)}
              >
                {columns.map((col, index) => (
                  <td key={index} className="p-4 text-sm text-ink dark:text-gray-100 whitespace-nowrap">
                    {col.accessor(item)}
                  </td>
                ))}
                <td className="p-4 text-sm text-ink dark:text-gray-100 whitespace-nowrap relative" onClick={(e) => e.stopPropagation()}>
                  {renderActions ? (
                    renderActions(item)
                  ) : (
                    <div className="relative inline-block text-left">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === item.id ? null : item.id);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-ink dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                        title="Row Actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuId === item.id && (
                        <div 
                          className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1.5 z-30 animate-in fade-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {onRowClick && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                onRowClick(item);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-gray-400" />
                              <span>View Details</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleCopy(e, item.id)}
                            className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500 font-bold">Copied ID!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-gray-400" />
                                <span>Copy ID: {String(item.id).slice(0, 8)}...</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              window.print();
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-gray-400" />
                            <span>Print Record</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;