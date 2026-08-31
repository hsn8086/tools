import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * 底部 sheet。进出走同一条路径（从下方来、回下方去），
 * 用 transition 而不是 keyframes —— 快速开关时能中途改向而不是从头播。
 */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(open);
  const [state, setState] = useState<'open' | 'closed'>('closed');

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => setState('open'));
      return () => cancelAnimationFrame(id);
    }
    setState('closed');
    const t = setTimeout(() => setMounted(false), 400);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <>
      <div className="scrim" data-state={state} onClick={onClose} />
      <div className="sheet" data-state={state} role="dialog" aria-modal="true" aria-label={title}>
        <div className="handle-bar" />
        <h3>{title}</h3>
        {children}
      </div>
    </>,
    document.body,
  );
}
