import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '../utils/format';

const STORAGE_KEY = 'expense-tracker-settings';
const DEFAULTS = { currency: 'INR', themeMode: 'light', rowsPerPage: 10 };

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt / unavailable storage */
  }
  return DEFAULTS;
}

const SettingsContext = createContext(undefined);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const formatMoney = useCallback((value) => formatCurrency(value, settings.currency), [settings.currency]);

  const value = useMemo(() => ({ ...settings, updateSettings, formatMoney }), [settings, updateSettings, formatMoney]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
