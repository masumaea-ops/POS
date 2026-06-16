import React from 'react';
import { PlusIcon, SearchIcon, ChevronDownIcon } from './Icons';

interface Action {
    label: string;
    onClick: () => void;
}

interface PageHeaderProps {
    title: string;
    primaryAction?: Action;
    secondaryActions?: Action[];
    showSearch?: boolean;
    onSearch?: (term: string) => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, primaryAction, secondaryActions, showSearch = true, onSearch }) => {
    return (
        <header className="bg-white dark:bg-gray-800 p-4 md:px-8 border-b border-surface-2 dark:border-gray-700 shrink-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-2xl font-bold text-ink dark:text-gray-50">{title}</h2>
                <div className="flex items-center gap-2 md:gap-4">
                    {showSearch && (
                        <div className="relative flex-1">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                <SearchIcon />
                            </span>
                            <input
                                type="text"
                                placeholder="Search..."
                                onChange={(e) => onSearch && onSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-surface-2 dark:border-gray-600 bg-white dark:bg-gray-700 text-ink dark:text-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange"
                            />
                        </div>
                    )}
                    {secondaryActions && secondaryActions.length > 0 && (
                         <div className="relative group">
                            <button className="flex items-center gap-2 px-3 py-2 border border-surface-2 dark:border-gray-600 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-surface dark:hover:bg-gray-700">
                                More <ChevronDownIcon/>
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg py-1 z-10 hidden group-hover:block">
                                {secondaryActions.map(action => (
                                    <a href="#" key={action.label} onClick={(e) => {e.preventDefault(); action.onClick();}} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-surface dark:hover:bg-gray-600">
                                        {action.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                    {primaryAction && (
                        <button
                            onClick={primaryAction.onClick}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white font-bold rounded-lg hover:bg-orange-600 transition-colors shadow-md"
                        >
                            <span className="hidden sm:inline"><PlusIcon /></span>
                            <span className="text-sm">{primaryAction.label}</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default PageHeader;