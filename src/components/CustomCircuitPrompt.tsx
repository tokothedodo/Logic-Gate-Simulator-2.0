import React, { useEffect, useRef, useState } from 'react';
import { CustomCircuitInspection } from '../engine/customCircuit';

interface CustomCircuitPromptProps {
  name: string;
  itemCount: number;
  inspection: CustomCircuitInspection;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export const CustomCircuitPrompt: React.FC<CustomCircuitPromptProps> = ({
  name,
  itemCount,
  inspection,
  onChange,
  onCancel,
  onConfirm,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const submit = () => {
    if (!inspection.ok) return;
    if (!name.trim()) {
      setError('Give the circuit a name');
      return;
    }
    onConfirm();
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
        <h2 className="text-sm font-semibold text-[var(--text-strong)]">Create custom circuit</h2>
        <p className="text-[11px] text-[var(--text-faint)] mt-1 mb-3">
          Bundles {itemCount} selected items into one part and adds it to the Custom
          section of the sidebar.
        </p>

        <div
          className={`text-[11px] rounded-lg border px-2.5 py-2 mb-3 ${
            inspection.ok
              ? 'border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-muted)]'
              : 'border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)]'
          }`}
        >
          {inspection.message}
        </div>

        <input
          ref={inputRef}
          value={name}
          disabled={!inspection.ok}
          onChange={(e) => {
            setError('');
            onChange(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') onCancel();
          }}
          placeholder="Circuit name"
          className="w-full bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--accent)] outline-none rounded-lg px-2.5 py-1.5 text-[13px] text-[var(--text-strong)] placeholder:text-[var(--text-faint)] disabled:opacity-50"
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
            disabled={!inspection.ok}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-strong)] transition-colors disabled:opacity-50 disabled:hover:bg-[var(--accent)]"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};
