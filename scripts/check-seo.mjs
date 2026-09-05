import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { preview } from 'vite';
import { chromium } from 'playwright';

const origin = 'https://tools.hsn8086.com';
const toolDirs = await readdir(new URL('../src/tools/', import.meta.url), { withFileTypes: true });
const routes = ['', ...toolDirs.filter((entry) => entry.isDirectory()).map((entry) => entry.name)];
const server = await preview({ preview: { host: '127.0.0.1', port: 0, open: false } });
let browser;
try {
  browser = await chromium.launch();
  const address = server.httpServer.address();
  const base = `http://127.0.0.1:${address.port}`;
  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await staticContext.newPage();
  const titles = new Set();
  const descriptions = new Set();
  for (const route of routes) {
    const html = await readFile(new URL(`../dist/${route || 'index'}.html`, import.meta.url), 'utf8');
    await staticPage.setContent(html);
    const title = await staticPage.title();
    const description = await staticPage.locator('meta[name="description"]').getAttribute('content');
    assert(title && description, `Missing metadata: /${route}`);
    titles.add(title);
    descriptions.add(description);
    assert.equal(await staticPage.locator('h1').count(), 1);
    assert.equal(await staticPage.locator('link[rel="canonical"]').getAttribute('href'), `${origin}/${route}`);
    assert.equal(await staticPage.locator('meta[property="og:title"]').getAttribute('content'), title);
    assert.equal(await staticPage.locator('meta[name="twitter:description"]').getAttribute('content'), description);
    const schema = JSON.parse(await staticPage.locator('#page-schema').textContent());
    assert.equal(schema['@type'], route ? 'WebApplication' : 'WebSite');
    assert.equal(schema.url, `${origin}/${route}`);
    for (const tool of routes.filter(Boolean)) {
      assert.equal(await staticPage.locator(`a[href="/${tool}"]`).count(), 1);
    }
    const response = await staticPage.goto(`${base}/${route}`);
    assert.equal(response.status(), 200);
    assert.equal(await staticPage.title(), title, `Incorrect route HTML: /${route}`);
  }
  assert.equal(titles.size, routes.length);
  assert.equal(descriptions.size, routes.length);
  await staticPage.setContent(await readFile(new URL('../dist/404.html', import.meta.url), 'utf8'));
  assert.equal(await staticPage.locator('meta[name="robots"]').getAttribute('content'), 'noindex,follow');
  assert.equal(await staticPage.locator('link[rel="canonical"]').count(), 0);

  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const sitemap = await (await page.request.get(`${base}/sitemap.xml`)).text();
  const urls = await page.evaluate((xml) => {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('Invalid sitemap XML');
    return [...doc.querySelectorAll('loc')].map((node) => node.textContent);
  }, sitemap);
  assert.deepEqual(urls.sort(), routes.map((route) => `${origin}/${route}`).sort());
  const robots = await (await page.request.get(`${base}/robots.txt`)).text();
  assert(robots.includes(`Sitemap: ${origin}/sitemap.xml`));

  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto(base);
    await page.locator('.tool-card').first().waitFor();
    assert.equal(await page.locator('h1').count(), 1);
    await page.screenshot({ path: `/tmp/tools-seo-home-${viewport.width}.png`, fullPage: true, animations: 'disabled' });
    for (const route of routes.filter(Boolean)) {
      await page.locator(`a.tool-card[href="/${route}"]`).click();
      await page.waitForFunction((url) => document.querySelector('link[rel="canonical"]')?.href === url, `${origin}/${route}`);
      assert.equal(await page.locator('meta[name="description"]').count(), 1);
      assert.equal(await page.locator('#page-schema').count(), 1);
      await page.waitForFunction(() => !document.querySelector('main > p.muted'));
      assert(await page.locator('main input, main textarea, main button').count(), `Editor missing: ${route}`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Horizontal overflow: ${route}`);
      if (route === 'qq') await page.screenshot({ path: `/tmp/tools-seo-qq-${viewport.width}.png`, fullPage: true, animations: 'disabled' });
      await page.goBack();
      await page.waitForFunction(() => document.querySelector('link[rel="canonical"]')?.href === 'https://tools.hsn8086.com/');
    }
    await page.goForward();
    await page.waitForFunction(() => location.pathname !== '/' && document.querySelector('link[rel="canonical"]')?.href === `https://tools.hsn8086.com${location.pathname}`);
    await page.goto(`${base}/#/qq`);
    await page.waitForFunction(() => location.pathname === '/qq' && !location.hash && document.querySelector('link[rel="canonical"]')?.href.endsWith('/qq'));
    await page.goto(`${base}/not-a-tool`);
    await page.waitForFunction(() => document.querySelector('meta[name="robots"]')?.content === 'noindex,follow');
    assert.equal(await page.locator('link[rel="canonical"]').count(), 0);
    await page.getByRole('link', { name: '返回首页' }).click();
    await page.waitForFunction(() => document.querySelector('meta[name="robots"]')?.content === 'index,follow');
  }
  assert.deepEqual(errors, []);
  console.log(`SEO checks passed: ${routes.length} static pages, sitemap, robots, 404 metadata, desktop/mobile navigation and editor rendering.`);
  console.log('Cloudflare Pages HTTP 404 behavior must also be checked after deployment.');
} finally {
  await browser?.close();
  await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()));
}
