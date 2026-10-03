import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HelpIcon } from './icons/AdwaitaIcons';

const HOVER_DELAY_MS = 1000;
const EDGE_MARGIN = 8;
const ANCHOR_GAP = 10;

interface InfoTooltipProps {
  title: string;
  summary: string;
  detail?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ title, summary, detail }) => {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const close = useCallback(() => {
    clearTimer();
    setAnchor(null);
  }, [clearTimer]);

  useEffect(() => close, [close]);

  // The popover is viewport-fixed, so a scroll would leave it detached from its icon
  useEffect(() => {
    if (!anchor) return;
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [anchor, close]);

  useLayoutEffect(() => {
    const el = popoverRef.current;
    if (!anchor || !el) return;

    const { offsetWidth: width, offsetHeight: height } = el;
    const toRight = anchor.right + ANCHOR_GAP;
    const left =
      toRight + width > window.innerWidth - EDGE_MARGIN
        ? anchor.left - ANCHOR_GAP - width
        : toRight;
    const centered = anchor.top + anchor.height / 2 - height / 2;

    setPos({
      left: Math.max(EDGE_MARGIN, Math.min(left, window.innerWidth - width - EDGE_MARGIN)),
      top: Math.max(EDGE_MARGIN, Math.min(centered, window.innerHeight - height - EDGE_MARGIN)),
    });
  }, [anchor]);

  const isOpen = anchor !== null;

  const scheduleOpen = (rect: DOMRect) => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setAnchor(rect);
    }, HOVER_DELAY_MS);
  };

  return (
    <>
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onPointerEnter={(e) => {
          if (e.pointerType !== 'touch') scheduleOpen(e.currentTarget.getBoundingClientRect());
        }}
        onPointerLeave={close}
        onPointerCancel={close}
        onClick={(e) => {
          e.stopPropagation();
          if (anchor) {
            close();
            return;
          }
          clearTimer();
          setAnchor(e.currentTarget.getBoundingClientRect());
        }}
        aria-expanded={isOpen}
        aria-label={`About ${title}`}
        className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-colors cursor-help ${
          isOpen
            ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]'
            : 'text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-[var(--hover)] opacity-0 group-hover:opacity-100 focus:opacity-100'
        }`}
      >
        <HelpIcon size={13} />
      </button>

      {anchor &&
        createPortal(
          <div
            ref={popoverRef}
            role="tooltip"
            style={{
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              visibility: pos ? 'visible' : 'hidden',
            }}
            className="fixed z-50 w-64 pointer-events-none bg-[var(--bg-surface)]/98 border border-[var(--border)] rounded-xl shadow-2xl backdrop-blur-md px-3 py-2.5 space-y-1"
          >
            <div className="text-[11px] font-semibold text-[var(--text-strong)]">{title}</div>
            <div className="text-[11px] leading-snug text-[var(--text-muted)]">{summary}</div>
            {detail && (
              <div className="text-[10px] font-mono leading-snug text-[var(--accent-text)]">{detail}</div>
            )}
          </div>,
          document.body
        )}
    </>
  );
};