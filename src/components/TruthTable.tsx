import React, { useMemo } from 'react';
import { TruthTableResult } from '../engine/truthTable';
import { CloseIcon } from './icons/AdwaitaIcons';

interface TruthTablePanelProps {
  table: TruthTableResult | null;
  reason?: string;
  isPicking: boolean;
  targetCount: number;
  onClose: () => void;
  onTogglePicking: () => void;
  onShowAll: () => void;
}

export const TruthTablePanel: React.FC<TruthTablePanelProps> = ({
  table,
  reason,
  isPicking,
  targetCount,
  onClose,
  onTogglePicking,
  onShowAll,
}) => {
  const highlightCol = useMemo(() => {
    if (!table) return -1;
    return table.inputs.length;
  }, [table]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[80vh] bg-[var(--bg-surface)]/98 border border-[var(--border)] rounded-2xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wide text-[var(--text)]">
              Truth Table
            </span>
            {table && (
              <span className="text-[11px] text-[var(--text-faint)] truncate">
                {targetCount === 0 ? 'Whole circuit' : `${targetCount} part${targetCount === 1 ? '' : 's'}`}{' '}
                · {table.rows.length} rows
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onTogglePicking}
              title="Click parts on the canvas to choose which ones to tabulate, then press Enter"
              className={`px-2 py-1 rounded-md text-[11px] transition-colors ${
                isPicking
                  ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--hover)]'
              }`}
            >
              {isPicking ? 'Keep these (Enter)' : 'Pick parts'}
            </button>
            <button
              onClick={onShowAll}
              title="Tabulate every part in the circuit"
              className="px-2 py-1 rounded-md text-[11px] text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--hover)] transition-colors"
            >
              All
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--hover)] transition-colors"
              title="Close truth table"
            >
              <CloseIcon size={13} />
            </button>
          </div>
        </div>

        {isPicking && (
          <div className="px-4 py-2 text-[11px] text-[var(--accent-text)] bg-[var(--accent-soft)] border-b border-[var(--border)] shrink-0">
            Click parts on the canvas to add or remove them, Enter to keep them, Escape to cancel.
          </div>
        )}

        <div className="overflow-auto p-3">
          {!table && (
            <p className="text-xs text-[var(--text-muted)] py-6 text-center">
              {reason ?? 'Nothing to tabulate yet. Add a gate or a part to the circuit.'}
            </p>
          )}

          {table && (
            <>
              <table className="w-full border-collapse text-xs font-mono">
                <thead>
                  <tr>
                    {table.inputs.map((col) => (
                      <th
                        key={col.key}
                        className="px-2.5 py-1.5 text-left font-sans font-semibold text-[var(--text-faint)] border-b border-[var(--border)] whitespace-nowrap"
                      >
                        {col.label}
                      </th>
                    ))}
                    {table.outputs.map((col) => (
                      <th
                        key={col.key}
                        className="px-2.5 py-1.5 text-left font-sans font-bold text-[var(--success-text)] border-b border-[var(--border)] whitespace-nowrap"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={rowIndex % 2 === 0 ? 'bg-[var(--bg-stripe)]' : ''}
                    >
                      {row.map((value, colIndex) => (
                        <td
                          key={colIndex}
                          className={`px-2.5 py-1 ${
                            colIndex === highlightCol
                              ? 'text-[var(--success-text)] font-semibold'
                              : value === 1
                              ? 'text-[var(--text)]'
                              : 'text-[var(--text-faint)]'
                          }`}
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-3 text-[10px] text-[var(--text-faint)] space-y-0.5">
                {table.freeInputCount > 0 && (
                  <p>
                    Unconnected inputs are treated as free variables (
                    {table.freeInputCount}).
                  </p>
                )}
                {table.truncated && (
                  <p className="text-amber-500/80">
                    More than 8 variables detected — only the first 8 are enumerated.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};