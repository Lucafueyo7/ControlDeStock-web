'use client';
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { CheckIcon, InfoIcon, AlertIcon, XIcon } from './icons';
import type { DaySales } from '../lib/data';

// ── Toast ────────────────────────────────────────────────────

export type ToastKind = 'success' | 'info' | 'warning' | 'error';

export interface ToastData {
  kind?: ToastKind;
  title: string;
  desc?: string;
  duration?: number;
}

interface ToastItem extends ToastData {
  id: number;
}

const ToastCtx = createContext<((t: ToastData) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((t: ToastData) => {
    const id = ++idRef.current;
    setToasts(ts => [...ts, { ...t, id }]);
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), t.duration || 4200);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-container">
        {toasts.map(t => <ToastItem key={t.id} {...t} />)}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({ kind = 'success', title, desc }: ToastItem) {
  const icons: Record<ToastKind, ReactNode> = {
    success: <CheckIcon style={{ width: 14, height: 14 }} />,
    info:    <InfoIcon  style={{ width: 14, height: 14 }} />,
    warning: <AlertIcon style={{ width: 14, height: 14 }} />,
    error:   <XIcon     style={{ width: 14, height: 14 }} />,
  };
  return (
    <div className={`toast ${kind}`}>
      <div className="toast-icon">{icons[kind]}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="toast-title">{title}</div>
        {desc && <div className="toast-desc">{desc}</div>}
      </div>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}

// ── Sheet (mobile bottom sheet) ──────────────────────────────

interface SheetProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
  full?: boolean;
  grab?: boolean;
}

export function Sheet({ open, onClose, title, subtitle, children, footer, full, grab = true }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className={`sheet ${full ? 'full' : ''}`}>
        {grab && !full && <div className="sheet-grabber" />}
        <div className="sheet-head">
          <div>
            <div className="sheet-title">{title}</div>
            {subtitle && <div className="sheet-sub">{subtitle}</div>}
          </div>
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={onClose}>
            <XIcon style={{ width: 14, height: 14 }} />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </>
  );
}

// ── Modal (desktop centered modal) ──────────────────────────

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
  width?: number;
}

export function Modal({ open, onClose, title, subtitle, children, footer, width }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={width ? { width } : undefined} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title">{title}</div>
            {subtitle && <div className="modal-sub">{subtitle}</div>}
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose} aria-label="Cerrar">
            <XIcon style={{ width: 14, height: 14 }} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────────

export function Badge({ kind, children }: { kind?: string; children: ReactNode }) {
  return <span className={`badge ${kind || ''}`}>{children}</span>;
}

// ── SparkBars ────────────────────────────────────────────────

export function SparkBars({ data, height = 180 }: { data: DaySales[]; height?: number }) {
  const max = Math.max(...data.map(d => d.t), 1);
  return (
    <div>
      <div className="bars" style={{ height }}>
        {data.map((d, i) => (
          <div key={i}
               className={`bar ${d.t === 0 ? 'muted' : ''}`}
               style={{ height: `${Math.max((d.t / max) * 100, 4)}%` }}
               title={`${d.d}: ${d.t}`} />
        ))}
      </div>
      <div className="bar-labels">
        {data.map((d, i) => <span key={i}>{i % 2 === 0 ? d.d : ''}</span>)}
      </div>
    </div>
  );
}
