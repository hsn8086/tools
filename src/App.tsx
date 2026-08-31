import { Suspense, useEffect, useState } from 'react';
import { findTool, tools } from './registry';
import { applyTheme, watchSystem, DEFAULT_SEED, type Mode } from './design/theme';
import { IconButton, Segmented } from './ui/controls';
import { IconBack } from './ui/icons';
import { SnackbarProvider } from './ui/Snackbar';

const MODE_KEY = 'tools.mode';

function useHashRoute() {
  const [hash, setHash] = useState(() => location.hash.replace(/^#\/?/, ''));
  useEffect(() => {
    const on = () => setHash(location.hash.replace(/^#\/?/, ''));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash;
}

export function App() {
  const route = useHashRoute();
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem(MODE_KEY) as Mode) || 'system');
  const tool = findTool(route);

  useEffect(() => {
    applyTheme(DEFAULT_SEED, mode);
    localStorage.setItem(MODE_KEY, mode);
    if (mode !== 'system') return;
    return watchSystem(() => applyTheme(DEFAULT_SEED, 'system'));
  }, [mode]);

  useEffect(() => {
    document.title = tool ? `${tool.name} · 小工具` : '小工具 · tools.hsn8086.com';
  }, [tool]);

  return (
    <SnackbarProvider>
      <header className="app-bar">
        {tool && (
          <IconButton label="返回" onClick={() => (location.hash = '')}>
            <IconBack />
          </IconButton>
        )}
        <h1>{tool ? tool.name : '小工具'}</h1>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'light' as const, label: '浅' },
            { value: 'dark' as const, label: '深' },
            { value: 'system' as const, label: '跟随' },
          ]}
        />
      </header>

      <main className="wrap">
        {tool ? (
          <Suspense fallback={<p className="muted">加载中…</p>}>
            <tool.Component />
          </Suspense>
        ) : (
          <Home />
        )}
      </main>
    </SnackbarProvider>
  );
}

function Home() {
  return (
    <>
      <div className="hero">
        <h2>小工具</h2>
        <p>一些自己要用的小东西。全部在浏览器里跑，图片不上传。</p>
      </div>
      <div className="grid">
        {tools.map((t, i) => (
          <button
            key={t.id}
            className="tool-card"
            style={{ animationDelay: `${i * 40}ms` }}
            onClick={() => (location.hash = `/${t.id}`)}
          >
            <span className="emoji">{t.emoji}</span>
            <h3>{t.name}</h3>
            <p>{t.desc}</p>
          </button>
        ))}
      </div>
    </>
  );
}
