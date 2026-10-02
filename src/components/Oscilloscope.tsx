import React, { useEffect, useRef } from 'react';
import { ScopeChannel, ScopeFrame } from '../engine/oscilloscope';
import { CloseIcon } from './icons/AdwaitaIcons';

interface OscilloscopeProps {
  channels: ScopeChannel[];
  frame: ScopeFrame;
  isRunning: boolean;
  isPicking: boolean;
  hasPinnedChannels: boolean;
  onClose: () => void;
  onClear: () => void;
  onTogglePicking: () => void;
  onShowAll: () => void;
}

const LABEL_WIDTH = 150;
const PADDING = 10;

/** Digital (logic analyser) style oscilloscope, docked bottom-right. */
export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  channels,
  frame,
  isRunning,
  isPicking,
  hasPinnedChannels,
  onClose,
  onClear,
  onTogglePicking,
  onShowAll,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;

    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    // Background
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    const laneCount = Math.max(channels.length, 1);
    const laneHeight = (cssHeight - PADDING * 2) / laneCount;
    const plotWidth = Math.max(cssWidth - LABEL_WIDTH - PADDING, 10);

    // Time gridlines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    const columns = 10;
    for (let i = 0; i <= columns; i++) {
      const x = LABEL_WIDTH + (plotWidth / columns) * i;
      ctx.beginPath();
      ctx.moveTo(x, PADDING);
      ctx.lineTo(x, cssHeight - PADDING);
      ctx.stroke();
    }

    if (channels.length === 0 || frame.times.length < 2) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        channels.length === 0
          ? 'No wires to probe — draw a connection between components'
          : isRunning
          ? 'Collecting samples…'
          : 'Paused — press play to record',
        LABEL_WIDTH + plotWidth / 2,
        cssHeight / 2 + 4
      );
      return;
    }

    const sampleCount = frame.times.length;
    const stepX = plotWidth / Math.max(sampleCount - 1, 1);

    channels.forEach((channel, i) => {
      const values = frame.series[i] ?? [];
      const top = PADDING + i * laneHeight;
      const highY = top + 6;
      const lowY = top + laneHeight - 8;

      // Lane label
      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(truncate(channel.label, 22), 8, top + laneHeight / 2 + 3);

      // Lane separator
      if (i > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.moveTo(0, top);
        ctx.lineTo(cssWidth, top);
        ctx.stroke();
      }

      // Digital trace
      ctx.strokeStyle = channel.color;
      ctx.lineWidth = 1.75;
      ctx.lineJoin = 'round';
      ctx.beginPath();

      let prevY: number | null = null;
      values.forEach((value, idx) => {
        const x = LABEL_WIDTH + idx * stepX;
        const y = value === 1 ? highY : lowY;

        if (prevY === null) {
          ctx.moveTo(x, y);
        } else {
          // Vertical transition at the boundary, then hold the new level
          if (prevY !== y) ctx.lineTo(x, prevY);
          ctx.lineTo(x, y);
        }
        prevY = y;
      });

      ctx.stroke();

      // Current level marker
      const lastValue = values[values.length - 1] ?? 0;
      ctx.fillStyle = lastValue === 1 ? channel.color : '#4b5563';
      ctx.beginPath();
      ctx.arc(LABEL_WIDTH + plotWidth + 8, lastValue === 1 ? highY : lowY, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [channels, frame, isRunning]);

  return (
    <div
      className={`w-[440px] max-w-[92vw] bg-[#1b1b1b]/97 border rounded-xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden ${
        isPicking ? 'border-[#3584e4]' : 'border-white/10'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#dedede]">
            Oscilloscope
          </span>
          <span className="text-[10px] text-[#8b8b8b] truncate">
            {isPicking
              ? 'click parts, then press Enter'
              : channels.length === 0
              ? 'no channels'
              : `${channels.length} ch · ${hasPinnedChannels ? 'picked' : 'all'} · ${
                  isRunning ? 'rec' : 'paused'
                }`}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onTogglePicking}
            className={`px-2 py-0.5 rounded-md text-[11px] transition-colors ${
              isPicking
                ? 'bg-[#3584e4] text-white'
                : 'text-[#a1a1aa] hover:text-white hover:bg-white/10'
            }`}
            title="Pick which wires the scope records (Enter to apply)"
          >
            {isPicking ? 'Picking…' : 'Pick channels'}
          </button>
          {hasPinnedChannels && (
            <button
              onClick={onShowAll}
              className="px-2 py-0.5 rounded-md text-[11px] text-[#a1a1aa] hover:text-white hover:bg-white/10 transition-colors"
              title="Record every wire again"
            >
              All
            </button>
          )}
          <button
            onClick={onClear}
            className="px-2 py-0.5 rounded-md text-[11px] text-[#a1a1aa] hover:text-white hover:bg-white/10 transition-colors"
            title="Clear captured trace"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#a1a1aa] hover:text-white hover:bg-white/10 transition-colors"
            title="Close oscilloscope"
          >
            <CloseIcon size={12} />
          </button>
        </div>
      </div>

      <div className="px-2 py-1.5 h-[168px]">
        <canvas ref={canvasRef} className="w-full h-full rounded-md" />
      </div>
    </div>
  );
};

const truncate = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;