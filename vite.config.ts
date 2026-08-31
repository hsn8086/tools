import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // dev 下禁用浏览器缓存：HMR 断连时（比如自动化浏览器里）避免拿到陈旧模块
  server: { host: true, port: 5173, headers: { 'Cache-Control': 'no-store' } },
});
