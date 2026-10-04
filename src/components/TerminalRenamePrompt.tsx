import React, { useState } from 'react';
import { CustomCircuitDef } from '../engine/customCircuit';

interface TerminalRenamePromptProps {
  def: CustomCircuitDef;
  onCancel: () => void;
  onConfirm: (renames: { pinId: string; name: string }[]) => void;
}

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
  <div className="flex items-center gap-2">
    <span className="w-14 shrink-0 text-[10px] uppercase tracking-wide text-[var(--text-faint)]">
      {label}
    </span>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="name"
      className="flex-1 min-w-0 bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--accent)] outline-none rounded-lg px-2 py-1 text-[12px] text-[var(--text-strong)] placeholder:text-[var(--text-faint)]"
    />
  </div>
);

export const TerminalRenamePrompt: React.FC<TerminalRenamePromptProps> = ({
  def,
  onCancel,
  onConfirm,
}) => {
  const [names, setNames] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    [...def.inputs, ...def.outputs].forEach((pin) => {
      initial[pin.pinId] = pin.name;
    });
    return initial;
  });

  const submit = () => {
    onConfirm(
      [...def.inputs, ...def.outputs]
        .map((pin) => ({ pinId: pin.pinId, name: (names[pin.pinId] ?? '').trim() }))
        .filter((r) => r.name.length > 0)
    );
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
        <h2 className="text-sm font-semibold text-[var(--text-strong)]">
          Rename {def.name} terminals
        </h2>
        <p className="text-[11px] text-[var(--text-faint)] mt-1 mb-3">
          Shown next to each connector on every placed copy of this circuit.
        </p>

        <div className="flex flex-col gap-2 max-h-[46vh] overflow-y-auto pr-1">
          {def.inputs.map((pin) => (
            <Field
              key={pin.pinId}
              label={`In ${pin.name}`}
              value={names[pin.pinId] ?? ''}
              onChange={(v) => setNames((prev) => ({ ...prev, [pin.pinId]: v }))}
            />
          ))}
          {def.outputs.map((pin) => (
            <Field
              key={pin.pinId}
              label={`Out ${pin.name}`}
              value={names[pin.pinId] ?? ''}
              onChange={(v) => setNames((prev) => ({ ...prev, [pin.pinId]: v }))}
            />
          ))}
        </div>

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
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
