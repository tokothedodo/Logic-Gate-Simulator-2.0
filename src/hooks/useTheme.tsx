import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  applyTheme,
  readStoredPreference,
  storePreference,
  systemTheme,
  type ResolvedTheme,
  type ThemePreference,
} from '../utils/theme';

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
  const [system, setSystem] = useState<ResolvedTheme>(systemTheme);

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) =>
      setSystem(event.matches ? 'dark' : 'light');
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  const resolved: ResolvedTheme = preference === 'system' ? system : preference;

  // Written during render, not in an effect: descendants that read CSS custom
  // properties in a layout effect (the Konva palette) must already see it.
  applyTheme(resolved);

  const setPreference = useCallback((next: ThemePreference) => {
    storePreference(next);
    setPreferenceState(next);
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside a ThemeProvider');
  return context;
};