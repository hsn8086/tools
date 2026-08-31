import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Toast {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
}

const Ctx = createContext<(text: string, action?: Toast['action']) => void>(() => {});

export const useSnackbar = () => useContext(Ctx);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [state, setState] = useState<'open' | 'closed'>('closed');
  const timer = useRef<number>(0);

  const show = useCallback((text: string, action?: Toast['action']) => {
    setToast({ id: Date.now(), text, action });
    setState('open');
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('closed'), 4000);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <Ctx.Provider value={show}>
      {children}
      {toast &&
        createPortal(
          <div className="snackbar" data-state={state} role="status">
            <span className="grow">{toast.text}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action!.run();
                  setState('closed');
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>,
          document.body,
        )}
    </Ctx.Provider>
  );
}
