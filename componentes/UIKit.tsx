'use client';

import React from 'react';
import Icon from './Icon';

/* ---- Avatar ---- */
interface AvatarProps {
  who: 'marcos' | 'ana' | string;
  size?: '' | 'sm' | 'lg';
  label?: string;
}

export function Avatar({ who, size = '', label }: AvatarProps) {
  const displayLabel = label ?? (who === 'marcos' ? 'Marcos' : who === 'ana' ? 'Ana' : who);
  const initial = displayLabel.slice(0, 1).toUpperCase();
  const cls = ['avatar', who, size].filter(Boolean).join(' ');
  return (
    <div className={cls} title={displayLabel}>
      {initial}
    </div>
  );
}

/* ---- Heart (beat animation) ---- */
interface HeartProps {
  size?: number;
  color?: string;
  beat?: boolean;
}

export function Heart({ size = 16, color = 'var(--romance)', beat = false }: HeartProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      style={beat ? { animation: 'heart-beat 1.6s var(--ease-ui) infinite' } : undefined}
    >
      <path d="M12 20s-7-4.6-9.2-9.1C1.3 7.8 2.9 4.5 6.2 4.5c2 0 3.2 1.1 3.8 2.2.6-1.1 1.8-2.2 3.8-2.2 3.3 0 4.9 3.3 3.4 6.4C19 15.4 12 20 12 20Z" />
    </svg>
  );
}

/* ---- Sheet (bottom sheet modal) ---- */
interface SheetProps {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string | number;
}

export function Sheet({ title, onClose, children, maxWidth }: SheetProps) {
  return (
    <div className="scrim" onClick={onClose}>
      <div
        className="sheet"
        style={maxWidth ? { maxWidth } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grab" />
        {title && (
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="sheet-title">{title}</div>
            <button className="icon-btn" onClick={onClose} aria-label="Fechar">
              <Icon name="x" size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ---- ProgressRing ---- */
interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
}

export function ProgressRing({ value, max, size = 72, stroke = 6, color = 'var(--romance)', children }: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, (value % (max || 1)) / (max || 1));
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.8s var(--ease-ui)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
      }}>
        {children}
      </div>
    </div>
  );
}

/* ---- ImgSlot (placeholder) ---- */
interface ImgSlotProps {
  label?: string;
  ratio?: string;
  radius?: string;
}

export function ImgSlot({ label = 'foto', ratio = '4 / 3', radius = 'var(--radius-2xl)' }: ImgSlotProps) {
  return (
    <div style={{
      aspectRatio: ratio, borderRadius: radius, overflow: 'hidden',
      background: 'repeating-linear-gradient(135deg, rgba(120,109,100,0.16) 0 11px, rgba(120,109,100,0.05) 11px 22px), #e8e1d6',
      border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.06em', color: 'var(--soft)', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  );
}
