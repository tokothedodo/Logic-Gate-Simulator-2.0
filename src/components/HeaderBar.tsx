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
import { ThemePicker } from './ThemePicker';
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
    <header className="h-12 bg-[var(--bg-header)] border-b border-[var(--border)] px-1.5 sm:px-3 flex items-center justify-between select-none text-[var(--text)] z-40 shrink-0 w-full min-w-0 gap-1 sm:gap-2">
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
          className={`p-1.5 rounded-lg border border-[var(--border)] transition-colors ${
            isSidebarOpen
              ? 'bg-[var(--press)] text-[var(--text-strong)]'
              : 'bg-[var(--bg-raised)] text-[var(--text-faint)] hover:text-[var(--text-strong)] hover:bg-[var(--hover)]'
          }`}
          title="Toggle Component Library (F9)"
        >
          <SidebarToggleIcon size={15} />
        </button>

        {/* Adwaita Linked Button Group: Open, Save, Export */}
        <div className="inline-flex rounded-lg bg-[var(--bg-raised)] border border-[var(--border)] p-0.5 shadow-sm">
          <button
            onClick={onOpenNative}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--text)] hover:text-[var(--text-strong)] hover:bg-[var(--hover)] active:bg-[var(--press)] rounded-md transition-colors"
            title="Open circuit (.json, .gcg, .circ)"
          >
            <FolderOpenIcon size={13} className="text-[var(--accent)]" />
            <span className="hidden lg:inline">Open</span>
          </button>

          <button
            onClick={onSave}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--text)] hover:text-[var(--text-strong)] hover:bg-[var(--hover)] active:bg-[var(--press)] rounded-md transition-colors"
            title="Save circuit (.json)"
          >
            <SaveIcon size={13} className="text-[var(--success)]" />
            <span className="hidden lg:inline">Save</span>
          </button>

          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--text)] hover:text-[var(--text-strong)] hover:bg-[var(--hover)] active:bg-[var(--press)] rounded-md transition-colors"
              title="Export circuit"
            >
              <ExportIcon size={13} className="text-[var(--warn)]" />
              <span className="hidden lg:inline">Export</span>
            </button>

            {/* Export Menu Dropdown */}
            {showExportMenu && (
              <div className="absolute left-0 top-full mt-1.5 w-44 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xl p-1 z-50 text-xs">
                <button
                  onClick={() => {
                    onExport('json');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--text-strong)] flex items-center justify-between"
                >
                  <span>Native JSON (.json)</span>
                </button>
                <button
                  onClick={() => {
                    onExport('png');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--text-strong)] flex items-center justify-between"
                >
                  <span>Export Image (.png)</span>
                </button>
                <button
                  onClick={() => {
                    onExport('circ');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--text-strong)] flex items-center justify-between"
                >
                  <span>Logisim (.circ)</span>
                </button>
                <button
                  onClick={() => {
                    onExport('gcg');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--text-strong)] flex items-center justify-between"
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
        <div className="inline-flex items-center rounded-lg bg-[var(--bg-raised)] border border-[var(--border)] p-0.5 shadow-sm">
          <button
            onClick={() => onChangeCanvasMode('select')}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
              canvasMode === 'select'
                ? 'bg-[var(--accent)] text-[var(--text-strong)] shadow-sm font-medium'
                : 'text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--hover)]'
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
                ? 'bg-[var(--accent)] text-[var(--text-strong)] shadow-sm font-medium'
                : 'text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--hover)]'
            }`}
            title="Drag / Pan Canvas Mode (H)"
          >
            <HandIcon size={12} />
            <span className="hidden xl:inline">Pan</span>
          </button>
        </div>

        {/* Linked Zoom Controls */}
        <div className="inline-flex items-center rounded-lg bg-[var(--bg-raised)] border border-[var(--border)] p-0.5 shadow-sm">
          <button
            onClick={onZoomOut}
            className="p-1 sm:p-1.5 text-xs text-[var(--text)] hover:text-[var(--text-strong)] hover:bg-[var(--hover)] active:bg-[var(--press)] rounded-md transition-colors"
            title="Zoom Out (Ctrl -)"
          >
            <ZoomOutIcon size={13} />
          </button>

          <button
            onClick={onResetZoom}
            className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[11px] font-mono font-medium text-[var(--text)] hover:text-[var(--text-strong)] hover:bg-[var(--hover)] active:bg-[var(--press)] rounded-md transition-colors"
            title="Reset Zoom to 100%"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            onClick={onZoomIn}
            className="p-1 sm:p-1.5 text-xs text-[var(--text)] hover:text-[var(--text-strong)] hover:bg-[var(--hover)] active:bg-[var(--press)] rounded-md transition-colors"
            title="Zoom In (Ctrl +)"
          >
            <ZoomInIcon size={13} />
          </button>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-4 w-[1px] bg-[var(--hover)]" />

        {/* GNOME Adwaita Simulation Switch & Controls */}
        <div className="flex items-center gap-1.5 bg-[var(--bg-raised)] border border-[var(--border)] rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 shadow-sm">
          {/* Status Indicator Dot */}
          <div
            className={`w-2 h-2 rounded-full transition-all shrink-0 ${
              isRunning ? 'bg-[var(--success)] shadow-[0_0_8px_var(--success)]' : 'bg-[var(--text-faint)]'
            }`}
          />

          <span className="text-[11px] font-medium text-[var(--text-strong)] pr-0.5 hidden lg:inline">
            {isRunning ? 'RUNNING' : 'PAUSED'}
          </span>

          {/* Genuine Libadwaita Toggle Switch (`adw-switch`) */}
          <div
            onClick={onToggleSimulation}
            className={`w-10 h-5.5 sm:w-11 sm:h-6 rounded-full p-0.5 transition-colors cursor-pointer relative shadow-inner shrink-0 ${
              isRunning ? 'bg-[var(--success)]' : 'bg-[var(--border-strong)]'
            }`}
            title={isRunning ? 'Pause simulation (Space)' : 'Start simulation (Space)'}
          >
            <div
              className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-out flex items-center justify-center ${
                isRunning ? 'translate-x-4.5 sm:translate-x-5 text-[var(--success)]' : 'translate-x-0 text-[var(--text-faint)]'
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
                ? 'opacity-25 cursor-not-allowed text-[var(--text-faint)]'
                : 'text-[var(--text)] hover:text-[var(--text-strong)] hover:bg-[var(--press)]'
            }`}
            title="Step simulation 1 cycle"
          >
            <StepIcon size={12} />
          </button>

          {/* Reset Engine Button */}
          <button
            onClick={onResetSimulation}
            className="p-1 rounded-full text-[var(--text)] hover:text-[var(--text-strong)] hover:bg-[var(--press)] transition-colors"
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
          className={`items-center gap-1.5 bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs shadow-sm ${
            hasClock ? 'hidden sm:flex' : 'hidden'
          }`}
        >
          <SpeedIcon size={13} className="text-[var(--accent)]" />
          <input
            type="range"
            min="1"
            max="10"
            value={simulationSpeed}
            onChange={(e) => onChangeSpeed(Number(e.target.value))}
            className="hidden md:block w-16 lg:w-20 accent-[var(--accent)] h-1.5 bg-[var(--border-input)] rounded-lg cursor-pointer"
            title={`Clock rate: ${simulationSpeed}x`}
          />
          <span className="hidden md:inline font-mono text-[10px] text-[var(--text-muted)] w-5 text-right">
            {simulationSpeed}x
          </span>
        </div>

        {/* Oscilloscope (logic analyser) toggle */}
        <button
          onClick={onToggleScope}
          className={`p-1.5 rounded-lg border transition-colors ${
            isScopeOpen
              ? 'bg-[var(--accent)] text-[var(--text-strong)] border-[var(--accent)]'
              : 'bg-[var(--bg-raised)] text-[var(--text)] border-[var(--border)] hover:text-[var(--text-strong)] hover:bg-[var(--hover)]'
          }`}
          title="Toggle oscilloscope (logic analyser)"
        >
          <ScopeIcon size={15} />
        </button>

        {/* Settings / Preferences Popover Button */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg border border-[var(--border)] transition-colors ${
              showSettings
                ? 'bg-[var(--accent)] text-[var(--text-strong)]'
                : 'bg-[var(--bg-raised)] text-[var(--text)] hover:text-[var(--text-strong)] hover:bg-[var(--hover)]'
            }`}
            title="Canvas & Wire Settings"
          >
            <SettingsIcon size={15} />
          </button>

          {/* Settings Popover */}
          {showSettings && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xl p-3 z-50 text-xs space-y-3">
              <div className="font-semibold text-[var(--text-strong)] border-b border-[var(--border)] pb-1.5">
                Canvas Preferences
              </div>

              {/* Wire Routing Style */}
              <div>
                <label className="text-[11px] text-[var(--text-faint)] uppercase font-bold block mb-1.5">
                  Wire Routing
                </label>
                <div className="grid grid-cols-2 gap-1 bg-[var(--bg-sunken)] p-1 rounded-lg border border-[var(--border)]">
                  <button
                    onClick={() => onChangeRoutingStyle('bezier')}
                    className={`py-1 rounded text-center font-medium transition-colors ${
                      routingStyle === 'bezier'
                        ? 'bg-[var(--accent)] text-[var(--text-strong)] shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'
                    }`}
                  >
                    Bézier Curve
                  </button>
                  <button
                    onClick={() => onChangeRoutingStyle('orthogonal')}
                    className={`py-1 rounded text-center font-medium transition-colors ${
                      routingStyle === 'orthogonal'
                        ? 'bg-[var(--accent)] text-[var(--text-strong)] shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'
                    }`}
                  >
                    90° Step
                  </button>
                </div>
              </div>

              {/* Grid Style */}
              <div>
                <label className="text-[11px] text-[var(--text-faint)] uppercase font-bold block mb-1.5">
                  Grid Style
                </label>
                <div className="grid grid-cols-2 gap-1 bg-[var(--bg-sunken)] p-1 rounded-lg border border-[var(--border)]">
                  <button
                    onClick={() => onChangeGridStyle('dots')}
                    className={`py-1 rounded text-center font-medium transition-colors ${
                      gridStyle === 'dots'
                        ? 'bg-[var(--accent)] text-[var(--text-strong)] shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'
                    }`}
                  >
                    Dot Matrix
                  </button>
                  <button
                    onClick={() => onChangeGridStyle('lines')}
                    className={`py-1 rounded text-center font-medium transition-colors ${
                      gridStyle === 'lines'
                        ? 'bg-[var(--accent)] text-[var(--text-strong)] shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'
                    }`}
                  >
                    Gridlines
                  </button>
                </div>
              </div>

              {/* Theme */}
              <ThemePicker />
            </div>
          )}
        </div>

        {/* Primary GNOME Menu Button (`adw-menu-button`) */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowPrimaryMenu(!showPrimaryMenu)}
            className={`p-1.5 rounded-lg border border-[var(--border)] transition-colors ${
              showPrimaryMenu
                ? 'bg-[var(--press)] text-[var(--text-strong)]'
                : 'bg-[var(--bg-raised)] text-[var(--text)] hover:text-[var(--text-strong)] hover:bg-[var(--hover)]'
            }`}
            title="Primary Menu"
          >
            <MenuIcon size={15} />
          </button>

          {/* Primary Menu Dropdown */}
          {showPrimaryMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xl p-1.5 z-50 text-xs divide-y divide-[var(--border)]">
              <div className="pb-1">
                <button
                  onClick={() => {
                    onNewCircuit();
                    setShowPrimaryMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--text-strong)] flex items-center justify-between"
                >
                  <span>New Circuit</span>
                  <span className="text-[10px] text-[var(--text-faint)]">Ctrl+N</span>
                </button>

                <div className="relative" ref={samplesRef}>
                  <button
                    onClick={() => setShowSamplesMenu(!showSamplesMenu)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--text-strong)] flex items-center justify-between"
                  >
                    <span>Sample Circuits</span>
                    <span className="text-[10px] text-[var(--accent)]">▸</span>
                  </button>

                  {/* Submenu for sample circuits */}
                  {showSamplesMenu && (
                    <div className="pl-3 py-1 space-y-1 bg-[var(--bg-sunken)] rounded-lg mt-1 border border-[var(--border)]">
                      {sampleCircuits.map((sample) => (
                        <button
                          key={sample.id}
                          onClick={() => {
                            onLoadSample(sample);
                            setShowPrimaryMenu(false);
                            setShowSamplesMenu(false);
                          }}
                          className="w-full text-left px-2 py-1 rounded hover:bg-[var(--hover)] text-[var(--text)] hover:text-[var(--text-strong)]"
                        >
                          <div className="font-medium">{sample.name}</div>
                          <div className="text-[10px] text-[var(--text-faint)] truncate">
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
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--text-strong)]"
                >
                  Take Canvas Screenshot
                </button>
                <button
                  onClick={() => {
                    onNewCircuit();
                    setShowPrimaryMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--danger-soft)] text-[var(--danger)] flex items-center gap-1.5"
                >
                  <TrashIcon size={12} />
                  <span>Clear Canvas</span>
                </button>
              </div>

              <div className="pt-1 text-[11px] text-[var(--text-faint)] px-2 py-1">
                <div>Version 2.0</div>
                <div className="text-[10px] text-[var(--text-faint)]">Libadwaita / Konva.js</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
