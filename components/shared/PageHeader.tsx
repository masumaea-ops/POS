import React from 'react';
import { Plus, Search, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

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
    searchPlaceholder?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
    title, 
    primaryAction, 
    secondaryActions, 
    showSearch = true, 
    onSearch,
    searchPlaceholder 
}) => {
    const { t } = useLanguage();

    return (
        <header className="bg-white dark:bg-slate-900 px-4 py-3.5 md:px-6 border-b border-slate-200/80 dark:border-slate-800 shrink-0 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
                <div className="flex items-center gap-2 sm:gap-3">
                    {showSearch && (
                        <div className="relative flex-1 sm:w-64">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                <Search className="w-3.5 h-3.5" />
                            </span>
                            <input
                                type="text"
                                placeholder={searchPlaceholder || t('common.search', 'Search catalog, records...')}
                                onChange={(e) => onSearch && onSearch(e.target.value)}
                                className="w-full pl-9 pr-3.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-orange text-xs"
                            />
                        </div>
                    )}
                    {secondaryActions && secondaryActions.length > 0 && (
                         <div className="relative group">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer">
                                {t('common.more', 'Options')} <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20 hidden group-hover:block animate-in fade-in zoom-in-95">
                                {secondaryActions.map(action => (
                                    <button
                                        type="button"
                                        key={action.label}
                                        onClick={action.onClick}
                                        className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition cursor-pointer"
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {primaryAction && (
                        <button
                            onClick={primaryAction.onClick}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-orange text-white font-semibold text-xs rounded-lg hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{primaryAction.label}</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default PageHeader;