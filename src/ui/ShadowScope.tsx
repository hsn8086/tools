import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * 把 children 渲染进一个 shadow root，并注入独立 CSS。
 * 用途：让生成器的卡片与站点设计系统（MD3E）完全隔离，导出时截到的是一份干净 DOM。
 */
export function ShadowScope({
  css,
  children,
  ref,
  ...rest
}: { css: string; children: ReactNode; ref?: React.Ref<HTMLDivElement> } & React.HTMLAttributes<HTMLDivElement>) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [root, setRoot] = useState<ShadowRoot | null>(null);

  useEffect(() => {
    const host = hostRef.current!;
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    setRoot(shadow);
  }, []);

  useEffect(() => {
    if (!root) return;
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    root.adoptedStyleSheets = [sheet];
  }, [root, css]);

  return (
    <div
      ref={(n) => {
        hostRef.current = n;
        if (typeof ref === 'function') ref(n);
        else if (ref) (ref as React.RefObject<HTMLDivElement | null>).current = n;
      }}
      {...rest}
    >
      {root && createPortal(children, root as unknown as Element)}
    </div>
  );
}
