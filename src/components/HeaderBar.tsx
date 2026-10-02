import React, { useState, useRef, useEffect } from 'react';
import {
  SidebarToggleIcon,
  CursorIcon,
  HandIcon,
  FolderOpenIcon,
  SaveIcon,
  ExportIcon,
  ZoomInIcon,
  ZoomOutIcon,
  PlayIcon,
  PauseIcon,
  StepIcon,
  ResetIcon,
  SpeedIcon,
  SettingsIcon,
  ScopeIcon,
  MenuIcon,
  TrashIcon,
} from './icons/AdwaitaIcons';
import { sampleCircuits, SampleCircuit } from './SampleCircuits';
import { WireRoutingStyle } from '../canvas/Wire';

interface HeaderBarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  isRunning: boolean;
  onToggleSimulation: () => void;
  onStepSimulation: () => void;
  onResetSimulation: () => void;
  simulationSpeed: number;
  onChangeSpeed: (speed: number) => void;
  hasClock: boolean;
  onOpen: (file: File) => void;
  onOpenNative: () => void;
  onSave: () => void;
  onExport: (format: 'json' | 'png' | 'circ' | 'gcg') => void;
  onNewCircuit: () => void;
  onLoadSample: (sample: SampleCircuit) => void;
  routingStyle: WireRoutingStyle;
  onChangeRoutingStyle: (style: WireRoutingStyle) => void;
  gridStyle: 'dots' | 'lines';
  onChangeGridStyle: (style: 'dots' | 'lines') => void;
  canvasMode: 'select' | 'pan';
  onChangeCanvasMode: (mode: 'select' | 'pan') => void;
  isScopeOpen: boolean;
  onToggleScope: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  isRunning,
  onToggleSimulation,
  onStepSimulation,
  onResetSimulation,
  simulationSpeed,
  onChangeSpeed,
  hasClock,
  onOpen,
  onOpenNative,
  onSave,
  onExport,
  onNewCircuit,
  onLoadSample,
  routingStyle,
  onChangeRoutingStyle,
  gridStyle,
  onChangeGridStyle,
  canvasMode,
  onChangeCanvasMode,
  isScopeOpen,
  onToggleScope,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showPrimaryMenu, setShowPrimaryMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSamplesMenu, setShowSamplesMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const samplesRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (settingsRef.current && !settingsRef.current.contains(target)) {
        setShowSettings(false);
      }
      if (menuRef.current && !menuRef.current.contains(target)) {
        setShowPrimaryMenu(false);
      }
      if (exportRef.current && !exportRef.current.contains(target)) {
        setShowExportMenu(false);
      }
      if (samplesRef.current && !samplesRef.current.contains(target)) {
        setShowSamplesMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOpen(file);
      e.target.value = '';
    }
  };

  return (
    <header className="h-12 bg-[#242424] border-b border-[#1c1c1c] px-1.5 sm:px-3 flex items-center justify-between select-none text-[#dedede] z-20 shrink-0 w-full min-w-0 gap-1 sm:gap-2 overflow-hidden">
      {/* Hidden file input for Open dialog */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.gcg,.circ"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* LEFT SECTION: Sidebar Toggle, Logo & File Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
        {/* Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className={`p-1.5 rounded-lg border border-white/10 transition-colors ${
            isSidebarOpen
              ? 'bg-white/15 text-white'
              : 'bg-[#2e2e2e] text-[#8a8a8e] hover:text-white hover:bg-white/10'
          }`}
          title="Toggle Component Library (F9)"
        >
          <SidebarToggleIcon size={15} />
        </button>

        {/* Adwaita Linked Button Group: Open, Save, Export */}
        <div className="inline-flex rounded-lg bg-[#2e2e2e] border border-white/10 p-0.5 shadow-sm">
          <button
            onClick={onOpenNative}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#dedede] hover:text-white hover:bg-white/10 active:bg-white/15 rounded-md transition-colors"
            title="Open circuit (.json, .gcg, .circ)"
          >
            <FolderOpenIcon size={13} className="text-[#3584e4]" />
            <span className="hidden lg:inline">Open</span>
          </button>

          <button
            onClick={onSave}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#dedede] hover:text-white hover:bg-white/10 active:bg-white/15 rounded-md transition-colors"
            title="Save circuit (.json)"
          >
            <SaveIcon size={13} className="text-[#26a269]" />
            <span className="hidden lg:inline">Save</span>
          </button>

          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#dedede] hover:text-white hover:bg-white/10 active:bg-white/15 rounded-md transition-colors"
              title="Export circuit"
            >
              <ExportIcon size={13} className="text-[#e5a50a]" />
              <span className="hidden lg:inline">Export</span>
            </button>

            {/* Export Menu Dropdown */}
            {showExportMenu && (
              <div className="absolute left-0 top-full mt-1.5 w-44 bg-[#2c2c2c] border border-white/10 rounded-xl shadow-2xl p-1 z-50 text-xs">
                <button
                  onClick={() => {
                    onExport('json');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 text-white flex items-center justify-between"
                >
                  <span>Native JSON (.json)</span>
                </button>
                <button
                  onClick={() => {
                    onExport('png');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 text-white flex items-center justify-between"
                >
                  <span>Export Image (.png)</span>
                </button>
                <button
                  onClick={() => {
                    onExport('circ');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 text-white flex items-center justify-between"
                >
                  <span>Logisim (.circ)</span>
                </button>
                <button
                  onClick={() => {
                    onExport('gcg');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 text-white flex items-center justify-between"
                >
                  <span>Gate Simulator (.gcg)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CENTER SECTION: Viewport Zoom Controls, Canvas Mode & GNOME Simulation Switch */}
      <div className="flex items-center gap-1 sm:gap-2.5 min-w-0 shrink overflow-hidden">
        {/* Canvas Mode Toggle: Select vs Pan */}
        <div className="inline-flex items-center rounded-lg bg-[#2e2e2e] border border-white/10 p-0.5 shadow-sm">
          <button
            onClick={() => onChangeCanvasMode('select')}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
              canvasMode === 'select'
                ? 'bg-[#3584e4] text-white shadow-sm font-medium'
                : 'text-[#a1a1aa] hover:text-white hover:bg-white/10'
            }`}
            title="Select & Marquee Mode (V)"
          >
            <CursorIcon size={12} />
            <span className="hidden xl:inline">Select</span>
          </button>

          <button
            onClick={() => onChangeCanvasMode('pan')}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
              canvasMode === 'pan'
                ? 'bg-[#3584e4] text-white shadow-sm font-medium'
                : 'text-[#a1a1aa] hover:text-white hover:bg-white/10'
            }`}
            title="Drag / Pan Canvas Mode (H)"
          >
            <HandIcon size={12} />
            <span className="hidden xl:inline">Pan</span>
          </button>
        </div>

        {/* Linked Zoom Controls */}
        <div className="inline-flex items-center rounded-lg bg-[#2e2e2e] border border-white/10 p-0.5 shadow-sm">
          <button
            onClick={onZoomOut}
            className="p-1 sm:p-1.5 text-xs text-[#dedede] hover:text-white hover:bg-white/10 active:bg-white/15 rounded-md transition-colors"
            title="Zoom Out (Ctrl -)"
          >
            <ZoomOutIcon size={13} />
          </button>

          <button
            onClick={onResetZoom}
            className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[11px] font-mono font-medium text-[#dedede] hover:text-white hover:bg-white/10 active:bg-white/15 rounded-md transition-colors"
            title="Reset Zoom to 100%"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            onClick={onZoomIn}
            className="p-1 sm:p-1.5 text-xs text-[#dedede] hover:text-white hover:bg-white/10 active:bg-white/15 rounded-md transition-colors"
            title="Zoom In (Ctrl +)"
          >
            <ZoomInIcon size={13} />
          </button>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-4 w-[1px] bg-white/10" />

        {/* GNOME Adwaita Simulation Switch & Controls */}
        <div className="flex items-center gap-1.5 bg-[#2e2e2e] border border-white/10 rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 shadow-sm">
          {/* Status Indicator Dot */}
          <div
            className={`w-2 h-2 rounded-full transition-all shrink-0 ${
              isRunning ? 'bg-[#26a269] shadow-[0_0_8px_#26a269]' : 'bg-[#666666]'
            }`}
          />

          <span className="text-[11px] font-medium text-[#f1f1f1] pr-0.5 hidden lg:inline">
            {isRunning ? 'RUNNING' : 'PAUSED'}
          </span>

          {/* Genuine Libadwaita Toggle Switch (`adw-switch`) */}
          <div
            onClick={onToggleSimulation}
            className={`w-10 h-5.5 sm:w-11 sm:h-6 rounded-full p-0.5 transition-colors cursor-pointer relative shadow-inner shrink-0 ${
              isRunning ? 'bg-[#26a269]' : 'bg-[#3e3e3e]'
            }`}
            title={isRunning ? 'Pause simulation (Space)' : 'Start simulation (Space)'}
          >
            <div
              className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-out flex items-center justify-center ${
                isRunning ? 'translate-x-4.5 sm:translate-x-5 text-[#26a269]' : 'translate-x-0 text-[#666666]'
              }`}
            >
              {isRunning ? <PlayIcon size={9} /> : <PauseIcon size={9} />}
            </div>
          </div>

          {/* Step Button (Single tick) */}
          <button
            onClick={onStepSimulation}
            disabled={isRunning}
            className={`p-1 rounded-full transition-colors ${
              isRunning
                ? 'opacity-25 cursor-not-allowed text-gray-500'
                : 'text-[#dedede] hover:text-white hover:bg-white/15'
            }`}
            title="Step simulation 1 cycle"
          >
            <StepIcon size={12} />
          </button>

          {/* Reset Engine Button */}
          <button
            onClick={onResetSimulation}
            className="p-1 rounded-full text-[#dedede] hover:text-white hover:bg-white/15 transition-colors"
            title="Reset circuit states"
          >
            <ResetIcon size={12} />
          </button>
        </div>
      </div>

      {/* RIGHT SECTION: Speed Slider, Theme/Settings, Primary Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Clock rate control, only while a clock part is on the canvas */}
        <div
          className={`items-center gap-1.5 bg-[#2e2e2e] border border-white/10 rounded-lg px-2 py-1 text-xs shadow-sm ${
            hasClock ? 'hidden sm:flex' : 'hidden'
          }`}
        >
          <SpeedIcon size={13} className="text-[#3584e4]" />
          <input
            type="range"
            min="1"
            max="10"
            value={simulationSpeed}
            onChange={(e) => onChangeSpeed(Number(e.target.value))}
            className="hidden md:block w-16 lg:w-20 accent-[#3584e4] h-1.5 bg-[#424242] rounded-lg cursor-pointer"
            title={`Clock rate: ${simulationSpeed}x`}
          />
          <span className="hidden md:inline font-mono text-[10px] text-[#a1a1aa] w-5 text-right">
            {simulationSpeed}x
          </span>
        </div>

        {/* Oscilloscope (logic analyser) toggle */}
        <button
          onClick={onToggleScope}
          className={`p-1.5 rounded-lg border transition-colors ${
            isScopeOpen
              ? 'bg-[#3584e4] text-white border-[#3584e4]'
              : 'bg-[#2e2e2e] text-[#dedede] border-white/10 hover:text-white hover:bg-white/10'
          }`}
          title="Toggle oscilloscope (logic analyser)"
        >
          <ScopeIcon size={15} />
        </button>

        {/* Settings / Preferences Popover Button */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg border border-white/10 transition-colors ${
              showSettings
                ? 'bg-[#3584e4] text-white'
                : 'bg-[#2e2e2e] text-[#dedede] hover:text-white hover:bg-white/10'
            }`}
            title="Canvas & Wire Settings"
          >
            <SettingsIcon size={15} />
          </button>

          {/* Settings Popover */}
          {showSettings && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[#282828] border border-white/10 rounded-xl shadow-2xl p-3 z-50 text-xs space-y-3">
              <div className="font-semibold text-white border-b border-white/10 pb-1.5">
                Canvas Preferences
              </div>

              {/* Wire Routing Style */}
              <div>
                <label className="text-[11px] text-[#8a8a8e] uppercase font-bold block mb-1.5">
                  Wire Routing
                </label>
                <div className="grid grid-cols-2 gap-1 bg-[#1e1e1e] p-1 rounded-lg border border-white/5">
                  <button
                    onClick={() => onChangeRoutingStyle('bezier')}
                    className={`py-1 rounded text-center font-medium transition-colors ${
                      routingStyle === 'bezier'
                        ? 'bg-[#3584e4] text-white shadow-sm'
                        : 'text-[#a1a1aa] hover:text-white'
                    }`}
                  >
                    Bézier Curve
                  </button>
                  <button
                    onClick={() => onChangeRoutingStyle('orthogonal')}
                    className={`py-1 rounded text-center font-medium transition-colors ${
                      routingStyle === 'orthogonal'
                        ? 'bg-[#3584e4] text-white shadow-sm'
                        : 'text-[#a1a1aa] hover:text-white'
                    }`}
                  >
                    90° Step
                  </button>
                </div>
              </div>

              {/* Grid Style */}
              <div>
                <label className="text-[11px] text-[#8a8a8e] uppercase font-bold block mb-1.5">
                  Grid Style
                </label>
                <div className="grid grid-cols-2 gap-1 bg-[#1e1e1e] p-1 rounded-lg border border-white/5">
                  <button
                    onClick={() => onChangeGridStyle('dots')}
                    className={`py-1 rounded text-center font-medium transition-colors ${
                      gridStyle === 'dots'
                        ? 'bg-[#3584e4] text-white shadow-sm'
                        : 'text-[#a1a1aa] hover:text-white'
                    }`}
                  >
                    Dot Matrix
                  </button>
                  <button
                    onClick={() => onChangeGridStyle('lines')}
                    className={`py-1 rounded text-center font-medium transition-colors ${
                      gridStyle === 'lines'
                        ? 'bg-[#3584e4] text-white shadow-sm'
                        : 'text-[#a1a1aa] hover:text-white'
                    }`}
                  >
                    Gridlines
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Primary GNOME Menu Button (`adw-menu-button`) */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowPrimaryMenu(!showPrimaryMenu)}
            className={`p-1.5 rounded-lg border border-white/10 transition-colors ${
              showPrimaryMenu
                ? 'bg-white/20 text-white'
                : 'bg-[#2e2e2e] text-[#dedede] hover:text-white hover:bg-white/10'
            }`}
            title="Primary Menu"
          >
            <MenuIcon size={15} />
          </button>

          {/* Primary Menu Dropdown */}
          {showPrimaryMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#282828] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 text-xs divide-y divide-white/5">
              <div className="pb-1">
                <button
                  onClick={() => {
                    onNewCircuit();
                    setShowPrimaryMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white flex items-center justify-between"
                >
                  <span>New Circuit</span>
                  <span className="text-[10px] text-[#8a8a8e]">Ctrl+N</span>
                </button>

                <div className="relative" ref={samplesRef}>
                  <button
                    onClick={() => setShowSamplesMenu(!showSamplesMenu)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white flex items-center justify-between"
                  >
                    <span>Sample Circuits</span>
                    <span className="text-[10px] text-[#3584e4]">▸</span>
                  </button>

                  {/* Submenu for sample circuits */}
                  {showSamplesMenu && (
                    <div className="pl-3 py-1 space-y-1 bg-[#1e1e1e] rounded-lg mt-1 border border-white/5">
                      {sampleCircuits.map((sample) => (
                        <button
                          key={sample.id}
                          onClick={() => {
                            onLoadSample(sample);
                            setShowPrimaryMenu(false);
                            setShowSamplesMenu(false);
                          }}
                          className="w-full text-left px-2 py-1 rounded hover:bg-white/10 text-slate-200 hover:text-white"
                        >
                          <div className="font-medium">{sample.name}</div>
                          <div className="text-[10px] text-[#8a8a8e] truncate">
                            {sample.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    onExport('png');
                    setShowPrimaryMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white"
                >
                  Take Canvas Screenshot
                </button>
                <button
                  onClick={() => {
                    onNewCircuit();
                    setShowPrimaryMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-400 flex items-center gap-1.5"
                >
                  <TrashIcon size={12} />
                  <span>Clear Canvas</span>
                </button>
              </div>

              <div className="pt-1 text-[11px] text-[#8a8a8e] px-2 py-1">
                <div>Version 2.0</div>
                <div className="text-[10px] text-[#666666]">Libadwaita / Konva.js</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
