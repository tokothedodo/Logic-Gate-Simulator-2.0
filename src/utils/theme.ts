export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'lgs.theme';
const DEFAULT_PREFERENCE: ThemePreference = 'light';

const isPreference = (value: unknown): value is ThemePreference =>
  value === 'system' || value === 'light' || value === 'dark';

export const readStoredPreference = (): ThemePreference => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (isPreference(raw)) return raw;
  } catch {
    // Storage can be unavailable; fall back to the default
  }
  return DEFAULT_PREFERENCE;
};

export const storePreference = (preference: ThemePreference): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Ignore, the preference just will not persist
  }
};

export const systemTheme = (): ResolvedTheme =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

/**
 * Runs before first paint so a stored dark preference never flashes light.
 * Kept in sync with applyTheme.
 */
export const applyTheme = (theme: ResolvedTheme): void => {
  document.documentElement.dataset.theme = theme;
};

export { DEFAULT_PREFERENCE };