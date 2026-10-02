import React, { useState, useMemo } from 'react';
import { componentLibrary, LibraryItem } from './library';
import { getComponentIcon } from './icons/GateIcons';
import { SearchIcon, ClearIcon, HelpIcon } from './icons/AdwaitaIcons';
import { getComponentInfo } from './componentInfo';
import { CustomCircuitDef, customTypeFor } from '../engine/customCircuit';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDrag: (type: string, clientX: number, clientY: number) => void;
  customCircuits: CustomCircuitDef[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onStartDrag,
  customCircuits,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [infoFor, setInfoFor] = useState<string | null>(null);

  const filteredLibrary = useMemo(() => {
    if (!searchQuery.trim()) return componentLibrary;
    const q = searchQuery.toLowerCase();
    return componentLibrary.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const categories: Array<{ id: 'inputs' | 'gates' | 'outputs'; title: string }> = [
    { id: 'inputs', title: 'Inputs' },
    { id: 'gates', title: 'Logic Gates' },
    { id: 'outputs', title: 'Outputs' },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop for small viewports */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-xs"
      />

      <aside className="fixed md:static inset-y-12 left-0 w-72 md:w-68 lg:w-72 bg-[#1e1e1e] border-r border-[#2c2c2c] flex flex-col h-[calc(100vh-48px)] md:h-full select-none text-[#dedede] z-30 shrink-0 shadow-2xl md:shadow-none transition-all duration-200">
        {/* Search Header */}
        <div className="p-2.5 border-b border-[#2c2c2c] flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <div className="absolute left-2.5 text-[#8a8a8e] pointer-events-none">
              <SearchIcon size={13} />
            </div>
            <input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#2a2a2a] hover:bg-[#303030] focus:bg-[#282828] text-xs text-[#ffffff] placeholder-[#8a8a8e] rounded-lg pl-7 pr-6 py-1.5 border border-[#383838] focus:border-[#3584e4] focus:outline-none focus:ring-1 focus:ring-[#3584e4] transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-[#8a8a8e] hover:text-[#ffffff] p-0.5 rounded transition-colors"
                title="Clear search"
              >
                <ClearIcon size={11} />
              </button>
            )}
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-[#8a8a8e] hover:text-white hover:bg-white/10"
            title="Close sidebar"
          >
            <ClearIcon size={14} />
          </button>
        </div>

        {/* Component Library List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3.5 scrollbar-thin">
          {categories.map((cat) => {
            const items = filteredLibrary.filter((item) => item.category === cat.id);
            if (items.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-1">
                <div className="flex items-center justify-between px-2 pt-1 pb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a8a8e]">
                    {cat.title}
                  </span>
                  <span className="text-[10px] font-semibold text-[#666666] bg-[#282828] px-1.5 py-0.2 rounded-full border border-white/5">
                    {items.length}
                  </span>
                </div>

                <div className="space-y-1">
                  {items.map((item: LibraryItem) => (
                    <div
                      key={item.type}
                      onPointerDown={(e) => {
                        if (e.button === 0) {
                          e.preventDefault();
                          onStartDrag(item.type, e.clientX, e.clientY);
                        }
                      }}
                      className="w-full group flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-transparent hover:bg-white/[0.06] active:bg-white/[0.1] border border-transparent hover:border-white/5 cursor-grab active:cursor-grabbing transition-all text-left select-none"
                      title={`Drag into workplace or click to place ${item.label}`}
                    >
                      {/* ANSI / Vector Logic Gate Icon */}
                      <div className="w-7 h-7 rounded-md bg-[#282828] border border-white/5 flex items-center justify-center text-[#9ca3af] group-hover:text-[#38bdf8] group-hover:border-[#38bdf8]/30 group-hover:bg-[#2d3748] transition-all shadow-sm shrink-0">
                        {getComponentIcon(item.type, { size: 20 })}
                      </div>

                      {/* Label and description */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium text-[#f1f1f1] group-hover:text-white truncate leading-tight">
                          {item.label}
                        </div>
                        {item.description && (
                          <div className="text-[10px] text-[#8a8a8e] truncate group-hover:text-[#a1a1aa] leading-tight">
                            {item.description}
                          </div>
                        )}
                      </div>

                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setInfoFor(infoFor === item.type ? null : item.type);
                        }}
                        title={`About the ${item.label}`}
                        className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                          infoFor === item.type
                            ? 'bg-[#3584e4]/20 text-[#7cb7f5]'
                            : 'text-[#6b6b70] hover:text-[#dcdcdc] hover:bg-white/10 opacity-0 group-hover:opacity-100 focus:opacity-100'
                        }`}
                      >
                        <HelpIcon size={13} />
                      </button>
                    </div>
                  ))}

                  {infoFor &&
                    (() => {
                      const item = items.find((i) => i.type === infoFor);
                      if (!item) return null;
                      const info = getComponentInfo(item.type, item.label);
                      return (
                        <div className="ml-9 mb-1.5 px-2.5 py-2 rounded-lg bg-[#242424] border border-white/10 space-y-1">
                          <div className="text-[11px] font-semibold text-[#e6e6e6]">{info.title}</div>
                          <div className="text-[11px] leading-snug text-[#a1a1aa]">{info.summary}</div>
                          {info.detail && (
                            <div className="text-[10px] font-mono leading-snug text-[#7cb7f5]">
                              {info.detail}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                </div>
              </div>
            );
          })}

          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 pt-1 pb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a8a8e]">
                Custom
              </span>
              <span className="text-[10px] font-semibold text-[#666666] bg-[#282828] px-1.5 py-0.2 rounded-full border border-white/5">
                {customCircuits.length}
              </span>
            </div>

            {customCircuits.length === 0 ? (
              <p className="px-2 py-1 text-[10px] leading-snug text-[#6b6b70]">
                Select parts on the canvas, right-click, then choose Create Custom
                Circuit to save them here for reuse.
              </p>
            ) : (
              <div className="space-y-1">
                {customCircuits.map((def) => (
                  <div key={def.slug} className="space-y-1">
                  <div
                    onPointerDown={(e) => {
                      if (e.button === 0) {
                        e.preventDefault();
                        onStartDrag(customTypeFor(def.slug), e.clientX, e.clientY);
                      }
                    }}
                    className="w-full group flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-transparent hover:bg-white/[0.06] active:bg-white/[0.1] border border-transparent hover:border-white/5 cursor-grab active:cursor-grabbing transition-all text-left select-none"
                    title={`Drag ${def.name} onto the canvas`}
                  >
                    <div className="w-7 h-7 rounded-md bg-[#282828] border border-white/5 flex items-center justify-center text-[#9ca3af] group-hover:text-[#38bdf8] group-hover:border-[#38bdf8]/30 group-hover:bg-[#2d3748] transition-all shadow-sm shrink-0 text-[10px] font-bold">
                      CC
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-[#f1f1f1] group-hover:text-white truncate leading-tight">
                        {def.name}
                      </div>
                      <div className="text-[10px] text-[#8a8a8e] truncate leading-tight">
                        {def.components.length} parts · {def.inputs.length} in ·{' '}
                        {def.outputs.length} out
                      </div>
                    </div>

                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoFor(infoFor === customTypeFor(def.slug) ? null : customTypeFor(def.slug));
                      }}
                      title={`About ${def.name}`}
                      className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                        infoFor === customTypeFor(def.slug)
                          ? 'bg-[#3584e4]/20 text-[#7cb7f5]'
                          : 'text-[#6b6b70] hover:text-[#dcdcdc] hover:bg-white/10 opacity-0 group-hover:opacity-100 focus:opacity-100'
                      }`}
                    >
                      <HelpIcon size={13} />
                    </button>
                  </div>

                  {infoFor === customTypeFor(def.slug) && (
                    <div className="ml-9 mb-1.5 px-2.5 py-2 rounded-lg bg-[#242424] border border-white/10 space-y-1">
                      <div className="text-[11px] font-semibold text-[#e6e6e6]">
                        {def.name}
                      </div>
                      <div className="text-[11px] leading-snug text-[#a1a1aa]">
                        A circuit you grouped into one part. It behaves like the parts inside it.
                      </div>
                      <div className="text-[10px] font-mono leading-snug text-[#7cb7f5]">
                        {def.components.length} parts · {def.inputs.length} in ·{' '}
                        {def.outputs.length} out
                      </div>
                    </div>
                  )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {filteredLibrary.length === 0 && (
            <div className="py-12 text-center text-xs text-[#8a8a8e]">
              No components found for "{searchQuery}"
            </div>
          )}
        </div>

        {/* Libadwaita Sidebar Footer Tip */}
        <div className="p-2 border-t border-[#2c2c2c] bg-[#1a1a1a]/60 text-[10px] text-[#8a8a8e] flex items-center justify-between">
          <span>Drag into workplace or click</span>
          <span className="font-mono text-[9px] bg-[#2a2a2a] px-1.5 py-0.5 rounded border border-white/5 text-[#a1a1aa]">
            Grid 20px
          </span>
        </div>
      </aside>
    </>
  );
};
