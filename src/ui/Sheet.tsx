import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * 底部 sheet。进出走同一条路径（从下方来、回下方去），
 * 用 transition 而不是 keyframes —— 快速开关时能中途改向而不是从头播。
 *
 * 进场不用 requestAnimationFrame 翻状态：页面在后台（或者被浏览器判定不可见）时
 * rAF 根本不回调，sheet 就会永远停在关闭态，表现出来就是"点了没反应"。
 * 改成挂载后在 layout effect 里强制读一次布局，再翻状态 —— 同步、必然执行。
 */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(open);
  const [state, setState] = useState<'open' | 'closed'>('closed');
  const ref = useRef<HTMLDivElement>(null);
  const openedAt = useRef(0);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    setState('closed');
    const t = setTimeout(() => setMounted(false), 400);
    return () => clearTimeout(t);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !mounted || !ref.current) return;
    // 读一次布局，逼浏览器先按关闭态排版，下一行改状态才会产生过渡
    void ref.current.getBoundingClientRect();
    openedAt.current = performance.now();
    setState('open');
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* 用 pointerdown 而不是 click：触屏上打开 sheet 的那一下，
          合成的 click 会落在刚挂上来的遮罩上，把它当场关掉。
          再加一道时间门限兼顾不发 pointer 事件的情况 */}
      <div
        className="scrim"
        data-state={state}
        onPointerDown={() => {
          if (performance.now() - openedAt.current > 250) onClose();
        }}
      />
      <div className="sheet" data-state={state} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="handle-bar" />
        <h3>{title}</h3>
        {children}
      </div>
    </>,
    document.body,
  );
}
