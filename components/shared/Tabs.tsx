import React, { useState } from 'react';

interface TabsProps {
  tabs: string[];
  children: (activeTab: string) => React.ReactNode;
}

const Tabs: React.FC<TabsProps> = ({ tabs, children }) => {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <div>
      <div className="border-b border-surface-2 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-brand-orange text-brand-orange'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      {children(activeTab)}
    </div>
  );
};

export default Tabs;