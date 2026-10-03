import React, { useEffect, useRef, useState } from 'react';

interface NumberPromptProps {
  title: string;
  description?: string;
  min: number;
  max: number;
  initial: number;
  onConfirm: (value: number) => void;
  onCancel: () => void;
}

export const NumberPrompt: React.FC<NumberPromptProps> = ({
  title,
  description,
  min,
  max,
  initial,
  onConfirm,
  onCancel,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(String(initial));

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const commit = () => {
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed)) onConfirm(Math.max(min, Math.min(max, parsed)));
    onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[260px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-[var(--text-strong)]">{title}</h2>
        {description && <p className="text-[11px] text-[var(--text-faint)] mt-1 mb-3">{description}</p>}

        <input
          ref={inputRef}
          type="number"
          min={min}
          max={max}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') onCancel();
          }}
          className="w-full bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--accent)] outline-none rounded-lg px-2.5 py-1.5 text-[13px] font-mono text-[var(--text-strong)]"
        />

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-[12px] text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--hover)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={commit}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-strong)] transition-colors"
          >
            Set
          </button>
        </div>
      </div>
    </div>
  );
};