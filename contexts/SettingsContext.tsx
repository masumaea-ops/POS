import React, { createContext, useContext, useState, useEffect } from 'react';

export interface SystemSettings {
  corpName: string;
  corpShortName: string;
  currency: string;
  vatRate: number;
  corpPhone: string;
  adminEmail: string;
  taxpin: string;
  branchCode: string;
  deviceSerial: string;
  defaultOutlet: string;
  markupTierA: number;
  markupTierB: number;
  dunningSmsTemplate: string;
  syncTimestamp: string;
  brandColor?: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
  corpName: 'Masuma Autoparts East Africa Ltd',
  corpShortName: 'Masuma',
  currency: 'KES',
  vatRate: 16,
  corpPhone: '+254 712 345678',
  adminEmail: 'admin@masuma.co.ke',
  taxpin: 'A011429519Z',
  branchCode: 'NRB-HQ-01',
  deviceSerial: 'FSC-KRA-10940C',
  defaultOutlet: 'Nairobi HQ',
  markupTierA: 15,
  markupTierB: 22,
  dunningSmsTemplate: 'Dear {customerName}, this is a friendly payment reminder from {companyName}. Your account currently has an outstanding overdue balance of {currency} {totalDue} (with {currency} {over60} past 60 days). Please settle promptly to prevent trade credit holds. Thank you.',
  syncTimestamp: 'Never Synced',
  brandColor: '#F97316',
};

interface SettingsContextType {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  formatPrice: (amount: number) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettingsState] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem('system_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error loading settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    const color = settings.brandColor || '#F97316';
    document.documentElement.style.setProperty('--brand-color', color);
  }, [settings.brandColor]);

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettingsState((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('system_settings', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving settings to localStorage', e);
      }
      return updated;
    });
  };

  const formatPrice = (amount: number) => {
    return `${settings.currency} ${(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, formatPrice }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSystemSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSystemSettings must be used within a SettingsProvider');
  }
  return context;
};

export const useSettings = useSystemSettings;
