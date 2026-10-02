import React, { useEffect, useRef, useState } from 'react';

interface CustomCircuitPromptProps {
  name: string;
  itemCount: number;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export const CustomCircuitPrompt: React.FC<CustomCircuitPromptProps> = ({
  name,
  itemCount,
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
        className="w-full max-w-sm bg-[#242424] border border-white/10 rounded-2xl shadow-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-[#ededed]">Create custom circuit</h2>
        <p className="text-[11px] text-[#8b8b8b] mt-1 mb-3">
          Bundles {itemCount} selected items into one part and adds it to the Custom
          section of the sidebar.
        </p>

        <input
          ref={inputRef}
          value={name}
          onChange={(e) => {
            setError('');
            onChange(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') onCancel();
          }}
          placeholder="Circuit name"
          className="w-full bg-[#1b1b1b] border border-white/10 focus:border-[#3584e4] outline-none rounded-lg px-2.5 py-1.5 text-[13px] text-[#ededed] placeholder:text-[#5f5f63]"
        />
        {error && <p className="text-[11px] text-red-400 mt-1.5">{error}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-[12px] text-[#a1a1aa] hover:text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-[#3584e4] hover:bg-[#4a90e2] text-white transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};