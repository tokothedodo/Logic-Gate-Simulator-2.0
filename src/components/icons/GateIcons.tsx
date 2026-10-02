import React from 'react';

interface GateIconProps {
  className?: string;
  size?: number;
  active?: boolean;
}

export const AndGateIcon: React.FC<GateIconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
    {/* Input pins */}
    <line x1="2" y1="10" x2="8" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="2" y1="22" x2="8" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* ANSI D-shape */}
    <path
      d="M8 6H16C21.5 6 25 9.5 25 16C25 22.5 21.5 26 16 26H8V6Z"
      stroke="currentColor"
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.08"
      strokeLinejoin="round"
    />
    {/* Output pin */}
    <line x1="25" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const OrGateIcon: React.FC<GateIconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
    {/* Input pins */}
    <line x1="2" y1="10" x2="10" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="2" y1="22" x2="10" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* ANSI Curved Shield shape */}
    <path
      d="M7 6C11 11 11 21 7 26C13 26 21 23 26 16C21 9 13 6 7 6Z"
      stroke="currentColor"
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.08"
      strokeLinejoin="round"
    />
    {/* Output pin */}
    <line x1="26" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const NotGateIcon: React.FC<GateIconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
    {/* Input pin */}
    <line x1="2" y1="16" x2="8" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Triangle */}
    <polygon
      points="8,7 22,16 8,25"
      stroke="currentColor"
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.08"
      strokeLinejoin="round"
    />
    {/* Inversion Bubble */}
    <circle cx="24.5" cy="16" r="2.5" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15" />
    {/* Output pin */}
    <line x1="27" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const NandGateIcon: React.FC<GateIconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
    <line x1="2" y1="10" x2="7" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="2" y1="22" x2="7" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M7 6H14C19 6 22 9.5 22 16C22 22.5 19 26 14 26H7V6Z"
      stroke="currentColor"
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.08"
      strokeLinejoin="round"
    />
    <circle cx="24.5" cy="16" r="2.5" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15" />
    <line x1="27" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const NorGateIcon: React.FC<GateIconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
    <line x1="2" y1="10" x2="9" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="2" y1="22" x2="9" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M6 6C10 11 10 21 6 26C12 26 18 23 23 16C18 9 12 6 6 6Z"
      stroke="currentColor"
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.08"
      strokeLinejoin="round"
    />
    <circle cx="25.5" cy="16" r="2.5" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15" />
    <line x1="28" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const XorGateIcon: React.FC<GateIconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
    <line x1="2" y1="10" x2="8" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="2" y1="22" x2="8" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Secondary back arc */}
    <path d="M4 6C8 11 8 21 4 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Shield */}
    <path
      d="M8 6C12 11 12 21 8 26C14 26 21 23 26 16C21 9 14 6 8 6Z"
      stroke="currentColor"
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.08"
      strokeLinejoin="round"
    />
    <line x1="26" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const XnorGateIcon: React.FC<GateIconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
    <line x1="2" y1="10" x2="7" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="2" y1="22" x2="7" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M3 6C7 11 7 21 3 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M7 6C11 11 11 21 7 26C13 26 19 23 23 16C19 9 13 6 7 6Z"
      stroke="currentColor"
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.08"
      strokeLinejoin="round"
    />
    <circle cx="25.5" cy="16" r="2.5" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15" />
    <line x1="28" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const BufferGateIcon: React.FC<GateIconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
    <line x1="2" y1="16" x2="8" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <polygon
      points="8,7 24,16 8,25"
      stroke="currentColor"
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.08"
      strokeLinejoin="round"
    />
    <line x1="24" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const ToggleSwitchIcon: React.FC<GateIconProps> = ({ className = 'w-6 h-6', size = 24, active = false }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
    <rect x="4" y="9" width="24" height="14" rx="7" fill={active ? '#26a269' : '#374151'} stroke="currentColor" strokeWidth="1.5" />
    <circle cx={active ? '21' : '11'} cy="16" r="5" fill="#ffffff" filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.4))" />
  </svg>
);

export const PushButtonIcon: React.FC<GateIconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
    <rect x="4" y="4" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.08" />
    <circle cx="16" cy="16" r="7" stroke="currentColor" strokeWidth="2" fill="#ef4444" fillOpacity="0.8" />
    <circle cx="16" cy="16" r="4" fill="#ffffff" fillOpacity="0.3" />
  </svg>
);

export const ClockIcon: React.FC<GateIconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
    <rect x="4" y="5" width="24" height="22" rx="4" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.06" />
    <path
      d="M7 20V12H13V20H19V12H25V20"
      stroke="#38bdf8"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
  </svg>
);

export const Constant0Icon: React.FC<GateIconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
    <rect x="5" y="5" width="22" height="22" rx="6" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.08" />
    <text x="16" y="21" textAnchor="middle" fill="#9ca3af" fontSize="15" fontWeight="bold" fontFamily="monospace">0</text>
  </svg>
);

export const Constant1Icon: React.FC<GateIconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
    <rect x="5" y="5" width="22" height="22" rx="6" stroke="#22c55e" strokeWidth="2" fill="#22c55e" fillOpacity="0.1" />
    <text x="16" y="21" textAnchor="middle" fill="#22c55e" fontSize="15" fontWeight="bold" fontFamily="monospace">1</text>
  </svg>
);

export const LedLightIcon: React.FC<GateIconProps> = ({ className = 'w-6 h-6', size = 24, active = false }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
    <circle
      cx="16"
      cy="16"
      r="9"
      fill={active ? '#22c55e' : '#1e293b'}
      stroke={active ? '#4ade80' : '#475569'}
      strokeWidth="2"
    />
    <circle cx="13" cy="13" r="3" fill="#ffffff" fillOpacity={active ? 0.8 : 0.2} />
    {/* Radiating rays */}
    <line x1="16" y1="3" x2="16" y2="5" stroke={active ? '#22c55e' : '#64748b'} strokeWidth="2" strokeLinecap="round" />
    <line x1="25.2" y1="6.8" x2="23.8" y2="8.2" stroke={active ? '#22c55e' : '#64748b'} strokeWidth="2" strokeLinecap="round" />
    <line x1="29" y1="16" x2="27" y2="16" stroke={active ? '#22c55e' : '#64748b'} strokeWidth="2" strokeLinecap="round" />
    <line x1="6.8" y1="6.8" x2="8.2" y2="8.2" stroke={active ? '#22c55e' : '#64748b'} strokeWidth="2" strokeLinecap="round" />
    <line x1="3" y1="16" x2="5" y2="16" stroke={active ? '#22c55e' : '#64748b'} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const SevenSegIcon: React.FC<GateIconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
    <rect x="5" y="4" width="22" height="24" rx="4" stroke="currentColor" strokeWidth="2" fill="#090d16" />
    {/* Figure-8 segments */}
    <line x1="11" y1="8" x2="21" y2="8" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="10" y1="10" x2="10" y2="14" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="22" y1="10" x2="22" y2="14" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="11" y1="16" x2="21" y2="16" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="10" y1="18" x2="10" y2="22" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="22" y1="18" x2="22" y2="22" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="11" y1="24" x2="21" y2="24" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export const ProbeIcon: React.FC<GateIconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
    <rect x="4" y="7" width="24" height="18" rx="4" stroke="currentColor" strokeWidth="2" fill="#1e293b" />
    <circle cx="10" cy="16" r="3" fill="#22c55e" />
    <text x="18" y="19" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">HI</text>
  </svg>
);

export const getComponentIcon = (type: string, props: GateIconProps = {}) => {
  switch (type.toLowerCase()) {
    case 'and':
      return <AndGateIcon {...props} />;
    case 'or':
      return <OrGateIcon {...props} />;
    case 'not':
      return <NotGateIcon {...props} />;
    case 'nand':
      return <NandGateIcon {...props} />;
    case 'nor':
      return <NorGateIcon {...props} />;
    case 'xor':
      return <XorGateIcon {...props} />;
    case 'xnor':
      return <XnorGateIcon {...props} />;
    case 'buffer':
      return <BufferGateIcon {...props} />;
    case 'toggle':
      return <ToggleSwitchIcon {...props} />;
    case 'pushbutton':
      return <PushButtonIcon {...props} />;
    case 'clock':
      return <ClockIcon {...props} />;
    case 'constant0':
      return <Constant0Icon {...props} />;
    case 'constant1':
      return <Constant1Icon {...props} />;
    case 'led':
      return <LedLightIcon {...props} />;
    case 'sevenseg':
      return <SevenSegIcon {...props} />;
    case 'probe':
      return <ProbeIcon {...props} />;
    default:
      return <AndGateIcon {...props} />;
  }
};
