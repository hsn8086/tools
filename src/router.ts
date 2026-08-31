import { useEffect, useState } from 'react';

const path = () => location.pathname.replace(/^\/+|\/+$/g, '');

/**
 * 真实路径路由，不用 hash —— 这样分享出去的地址是 /zhihu，
 * 水印里印的也就是能直接打开的那一个。
 * 静态托管靠 `_redirects` 把所有路径回落到 index.html。
 */
export function useRoute() {
  const [route, setRoute] = useState(() => {
    // 迁移老的 #/zhihu 链接
    const legacy = location.hash.match(/^#\/?(.*)$/)?.[1];
    if (legacy) {
      history.replaceState(null, '', `/${legacy}`);
      return legacy;
    }
    return path();
  });

  useEffect(() => {
    const on = () => setRoute(path());
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []);

  return route;
}

export function navigate(to: string) {
  history.pushState(null, '', to || '/');
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}

/** 给 <a> 用：保留中键 / Cmd 点击开新标签的原生行为 */
export function onNavClick(to: string) {
  return (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(to);
  };
}
