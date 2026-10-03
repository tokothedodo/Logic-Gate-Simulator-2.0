import React from 'react';
import { useTheme } from '../hooks/useTheme';
import type { ThemePreference } from '../utils/theme';
import { SunIcon, MoonIcon, SystemThemeIcon } from './icons/AdwaitaIcons';

const OPTIONS: { value: ThemePreference; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { value: 'system', label: 'System', Icon: SystemThemeIcon },
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
];

export const ThemePicker: React.FC = () => {
  const { preference, resolved, setPreference } = useTheme();

  return (
    <div>
      <label className="text-[11px] text-[var(--text-faint)] uppercase font-bold block mb-1.5">
        Appearance
      </label>
      <div className="grid grid-cols-3 gap-1 bg-[var(--bg-sunken)] p-1 rounded-lg border border-[var(--border)]">
        {OPTIONS.map(({ value, label, Icon }) => {
          const isActive = preference === value;
          return (
            <button
              key={value}
              onClick={() => setPreference(value)}
              aria-pressed={isActive}
              title={
                value === 'system' ? `Follow the system theme (now ${resolved})` : `${label} theme`
              }
              className={`py-1.5 rounded text-center transition-colors flex flex-col items-center gap-0.5 ${
                isActive
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-sm font-medium'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Icon size={13} />
              <span className="text-[10px]">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};