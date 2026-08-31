import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Cloudflare Web Analytics。
 *
 * 只在打包时注入，dev 不注入 —— 本地点来点去不该算进访问量。
 * 没配 VITE_CF_BEACON 就完全不注入，构建产物里一个字节都不多，
 * 所以别人 clone 下来跑不会莫名其妙给我发数据。
 *
 * 选它是因为：不用 cookie、不碰 localStorage、不采集任何能定位到人的东西，
 * 跟这站「图片不出设备、没有后端」的前提不冲突。
 */
function cloudflareAnalytics(token: string | undefined): Plugin {
  return {
    name: 'cloudflare-analytics',
    apply: 'build',
    transformIndexHtml() {
      if (!token) return [];
      return [
        {
          tag: 'script',
          attrs: {
            defer: true,
            src: 'https://static.cloudflareinsights.com/beacon.min.js',
            'data-cf-beacon': JSON.stringify({ token }),
          },
          injectTo: 'body',
        },
      ];
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), cloudflareAnalytics(env.VITE_CF_BEACON)],
    // dev 下禁用浏览器缓存：HMR 断连时（比如自动化浏览器里）避免拿到陈旧模块
    server: { host: true, port: 5173, headers: { 'Cache-Control': 'no-store' } },
  };
});
