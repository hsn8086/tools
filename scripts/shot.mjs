/**
 * 本地截图工具：MCP 那个浏览器时不时卡住，自己起一个更省事。
 *   node scripts/shot.mjs <url> <out.png> [宽] [高] [--full] [--clear]
 */
import { chromium } from 'playwright';

const [url, out, w = '460', h = '1000', ...flags] = process.argv.slice(2);
if (!url || !out) {
  console.error('用法: node scripts/shot.mjs <url> <out.png> [宽] [高] [--full] [--clear]');
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2 });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(url, { waitUntil: 'networkidle' });
if (flags.includes('--clear')) {
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
}
await page.waitForTimeout(600);
await page.screenshot({ path: out, fullPage: flags.includes('--full') });
await browser.close();

console.log(`已保存 ${out}`);
if (errors.length) console.log('页面报错:\n' + errors.join('\n'));
