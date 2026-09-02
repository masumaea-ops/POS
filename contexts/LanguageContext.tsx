import React, { createContext, useContext, useState, useEffect } from 'react';
import { en, TranslationKeys } from '../locales/en';
import { sw } from '../locales/sw';

export type SupportedLanguage = 'en' | 'sw';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (keyPath: string, fallback?: string) => string;
  interpolate: (keyPath: string, params?: Record<string, string | number>, fallback?: string) => string;
  translations: TranslationKeys;
}

const translationsMap: Record<SupportedLanguage, TranslationKeys> = {
  en,
  sw
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('masuma_language') as SupportedLanguage;
      if (saved === 'en' || saved === 'sw') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('masuma_language', lang);
      document.documentElement.lang = lang;
    } catch (e) {
      console.error('Failed to save language preference', e);
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const getNestedValue = (obj: any, path: string): string | undefined => {
    if (!obj || !path) return undefined;
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    return typeof current === 'string' ? current : undefined;
  };

  const t = (keyPath: string, fallback?: string): string => {
    const activeDict = translationsMap[language];
    const val = getNestedValue(activeDict, keyPath);
    if (val !== undefined) return val;

    // Fallback to English dictionary if key missing in current language
    if (language !== 'en') {
      const enVal = getNestedValue(en, keyPath);
      if (enVal !== undefined) return enVal;
    }

    return fallback || keyPath;
  };

  const interpolate = (
    keyPath: string,
    params?: Record<string, string | number>,
    fallback?: string
  ): string => {
    let text = t(keyPath, fallback);
    if (!params) return text;
    for (const [key, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`{${key}}`, 'g'), String(value));
    }
    return text;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        interpolate,
        translations: translationsMap[language]
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const useTranslation = useLanguage;
