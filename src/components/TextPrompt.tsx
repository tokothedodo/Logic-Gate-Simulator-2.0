import React, { useEffect, useRef, useState } from 'react';

interface TextPromptProps {
  title: string;
  description?: string;
  initial?: string;
  placeholder?: string;
  /** Rejects an empty result, e.g. to keep a terminal name mandatory. */
  requireText?: boolean;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const TextPrompt: React.FC<TextPromptProps> = ({
  title,
  description,
  initial = '',
  placeholder,
  requireText = false,
  confirmLabel = 'Save',
  onConfirm,
  onCancel,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initial);
  const [error, setError] = useState('');

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const submit = () => {
    if (requireText && !value.trim()) {
      setError('Enter a name');
      return;
    }
    onConfirm(value.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-[var(--text-strong)]">{title}</h2>
        {description && (
          <p className="text-[11px] text-[var(--text-faint)] mt-1 mb-3">{description}</p>
        )}

        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setError('');
            setValue(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') onCancel();
          }}
          placeholder={placeholder}
          className="w-full bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--accent)] outline-none rounded-lg px-2.5 py-1.5 text-[13px] text-[var(--text-strong)] placeholder:text-[var(--text-faint)]"
        />
        {error && <p className="text-[11px] text-[var(--danger)] mt-1.5">{error}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-[12px] text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--hover)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-strong)] transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
