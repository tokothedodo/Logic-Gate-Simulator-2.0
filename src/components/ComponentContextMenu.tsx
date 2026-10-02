import React, { useEffect, useRef } from 'react';
import { Point } from '../types';

export interface ContextMenuAction {
  id: string;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onSelect: () => void;
}

export interface ContextMenuSection {
  actions: ContextMenuAction[];
}

interface ComponentContextMenuProps {
  position: Point;
  title: string;
  sections: ContextMenuSection[];
  onClose: () => void;
}

export const ComponentContextMenu: React.FC<ComponentContextMenuProps> = ({
  position,
  title,
  sections,
  onClose,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKey);
    window.addEventListener('resize', onClose);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  const style: React.CSSProperties = {
    left: position.x,
    top: position.y,
    visibility: 'hidden',
  };

  return (
    <div
      ref={(node) => {
        ref.current = node;
        if (node) {
          const { innerWidth, innerHeight } = window;
          const rect = node.getBoundingClientRect();
          const x = position.x + rect.width > innerWidth - 8 ? position.x - rect.width : position.x;
          const y = position.y + rect.height > innerHeight - 8 ? position.y - rect.height : position.y;
          node.style.left = `${Math.max(8, x)}px`;
          node.style.top = `${Math.max(8, y)}px`;
          node.style.visibility = 'visible';
        }
      }}
      style={style}
      className="fixed z-[100] min-w-[196px] rounded-xl bg-[#2c2c2c]/98 border border-white/10 shadow-2xl backdrop-blur-md py-1 text-xs text-[#dedede] select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="px-3 py-1.5 text-[10px] uppercase tracking-wide font-semibold text-[#8b8b8b] border-b border-white/10 mb-1">
        {title}
      </div>

      {sections.map((section, i) => (
        <div key={i} className={i > 0 ? 'border-t border-white/10 mt-1 pt-1' : ''}>
          {section.actions.map((action) => (
            <button
              key={action.id}
              disabled={action.disabled}
              onClick={() => {
                if (action.disabled) return;
                action.onSelect();
                onClose();
              }}
              className={`w-full text-left px-3 py-1.5 flex items-center justify-between gap-6 transition-colors ${
                action.disabled
                  ? 'text-[#5a5a5a] cursor-not-allowed'
                  : action.danger
                  ? 'text-red-400 hover:bg-red-500/15'
                  : 'hover:bg-white/10 text-white'
              }`}
            >
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};