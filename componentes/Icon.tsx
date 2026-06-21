'use client';

import React from 'react';

export type IconName =
  | 'home' | 'calendar' | 'chat' | 'heart' | 'gear'
  | 'plus' | 'chevronL' | 'chevronR' | 'chevronD'
  | 'x' | 'check' | 'trash' | 'mic' | 'camera'
  | 'clip' | 'send' | 'play' | 'clock' | 'bell'
  | 'reply' | 'logout' | 'sparkle' | 'list';

const PATHS: Record<IconName, React.ReactNode> = {
  home: (
    <>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </>
  ),
  chat: (
    <path d="M5 4.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4.5 3.5V6.5a2 2 0 0 1 .5-2Z" />
  ),
  heart: (
    <path d="M12 20s-7-4.6-9.2-9.1C1.3 7.8 2.9 4.5 6.2 4.5c2 0 3.2 1.1 3.8 2.2.6-1.1 1.8-2.2 3.8-2.2 3.3 0 4.9 3.3 3.4 6.4C19 15.4 12 20 12 20Z" />
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  chevronL: <path d="M15 5l-7 7 7 7" />,
  chevronR: <path d="M9 5l7 7-7 7" />,
  chevronD: <path d="M5 9l7 7 7-7" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 6.5" />,
  trash: (
    <>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5h3l1.5-2.5h7L18 8.5h2a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18v-8A1.5 1.5 0 0 1 4 8.5Z" />
      <circle cx="12" cy="13.5" r="3.2" />
    </>
  ),
  clip: (
    <path d="M20 11.5 12.5 19a4.5 4.5 0 0 1-6.4-6.4l7.6-7.6a3 3 0 0 1 4.3 4.3l-7.6 7.6a1.5 1.5 0 0 1-2.2-2.1l6.9-6.9" />
  ),
  send: <path d="M5 12h13M12 5l7 7-7 7" />,
  play: <path d="M7 4.5v15l13-7.5z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  bell: (
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0" />
  ),
  reply: <path d="M9 7 4 12l5 5M4 12h9a6 6 0 0 1 6 6v1" />,
  logout: (
    <>
      <path d="M14 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 12H3M6 8l-4 4 4 4" />
    </>
  ),
  sparkle: (
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
  ),
  list: (
    <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
  ),
};

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: string;
  style?: React.CSSProperties;
  className?: string;
}

export default function Icon({ name, size = 22, stroke, style, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke || 'currentColor'}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}
