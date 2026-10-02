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
        className="w-full max-w-[260px] bg-[#242424] border border-white/10 rounded-2xl shadow-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-[#ededed]">{title}</h2>
        {description && <p className="text-[11px] text-[#8b8b8b] mt-1 mb-3">{description}</p>}

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
          className="w-full bg-[#1b1b1b] border border-white/10 focus:border-[#3584e4] outline-none rounded-lg px-2.5 py-1.5 text-[13px] font-mono text-[#ededed]"
        />

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-[12px] text-[#a1a1aa] hover:text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={commit}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-[#3584e4] hover:bg-[#4a90e2] text-white transition-colors"
          >
            Set
          </button>
        </div>
      </div>
    </div>
  );
};