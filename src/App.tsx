import { Suspense, useEffect, useState } from 'react';
import { findTool, tools } from './registry';
import { applyTheme, watchSystem, DEFAULT_SEED, type Mode } from './design/theme';
import { IconButton, Segmented } from './ui/controls';
import { IconBack, IconForward } from './ui/icons';
import { SnackbarProvider } from './ui/Snackbar';
import { navigate, onNavClick, useRoute } from './router';

const MODE_KEY = 'tools.mode';

export function App() {
  const route = useRoute();
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
          <IconButton label="返回" onClick={() => navigate('/')}>
            <IconBack />
          </IconButton>
        )}
        {/* 首页的大标题已经写在内容里了，顶栏不再重复一遍 */}
        <h1>{tool?.name ?? ''}</h1>
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
      </div>
      <div className="grid">
        {tools.map((t, i) => (
          <a
            key={t.id}
            className="tool-card"
            href={`/${t.id}`}
            style={{ animationDelay: `${i * 40}ms` }}
            onClick={onNavClick(`/${t.id}`)}
          >
            <span className="tool-icon">{t.emoji}</span>
            <h3>{t.name}</h3>
            <p>{t.desc}</p>
            <span className="tool-go">
              <IconForward />
            </span>
          </a>
        ))}
      </div>
    </>
  );
}
