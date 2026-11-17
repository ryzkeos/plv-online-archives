import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Settings {
  appName: string;
  tagline: string;
  logoUrl: string;
  maintenance_mode: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  footer_text: string;
  brand_primary: string;
  brand_secondary: string;
}

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const applyColors = (s: Settings) => {
    if (s.brand_primary) {
      document.documentElement.style.setProperty('--brand-primary', s.brand_primary);
    }
    if (s.brand_secondary) {
      document.documentElement.style.setProperty('--brand-secondary', s.brand_secondary);
    }
  };

  const refreshSettings = async () => {
    try {
      const data = await api.getConfig();
      setSettings(data);
      applyColors(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
