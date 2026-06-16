import React from 'react';
import { MoreVerticalIcon } from './Icons';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
}

const Table = <T extends { id: any }>({ columns, data, onRowClick }: TableProps<T>) => {
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
                <td className="p-4 text-sm text-ink dark:text-gray-100 whitespace-nowrap">
                    <button className="text-gray-400 hover:text-ink dark:hover:text-white"><MoreVerticalIcon/></button>
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