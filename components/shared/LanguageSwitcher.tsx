import React from 'react';
import { useLanguage, SupportedLanguage } from '../../contexts/LanguageContext';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'badge' | 'full';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'compact',
  className = ''
}) => {
  const { language, setLanguage, t } = useLanguage();

  const handleToggle = () => {
    setLanguage(language === 'en' ? 'sw' : 'en');
  };

  if (variant === 'badge') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer ${
          language === 'sw'
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
        } ${className}`}
        title="Toggle English / Kiswahili"
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="font-mono">{language === 'sw' ? '🇰🇪 SWA' : '🇬🇧 ENG'}</span>
      </button>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 ${className}`}>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            language === 'en'
              ? 'bg-white dark:bg-slate-700 text-brand-orange shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🇬🇧</span>
          <span>English</span>
        </button>
        <button
          type="button"
          onClick={() => setLanguage('sw')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            language === 'sw'
              ? 'bg-white dark:bg-slate-700 text-brand-orange shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🇰🇪</span>
          <span>Kiswahili</span>
        </button>
      </div>
    );
  }

  // Default compact button
  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-surface dark:hover:bg-gray-700 flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${className}`}
      title={language === 'en' ? 'Badilisha hadi Kiswahili' : 'Switch to English'}
    >
      <Globe className="w-4 h-4 text-brand-orange" />
      <span className="font-mono text-[11px] uppercase">
        {language === 'en' ? 'EN' : 'SW'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
