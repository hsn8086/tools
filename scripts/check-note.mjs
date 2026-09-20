import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { preview } from 'vite';
import { createRequire } from 'node:module';

const server = await preview({ preview: { host: '127.0.0.1', port: 0, open: false } });
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
let browser;
try {
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
  await context.addInitScript({ path: createRequire(import.meta.url).resolve('jsqr') });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${base}/note`);
  const card = page.locator('.preview-inner .note');
  await card.waitFor();
  const styles = ['poster', 'index', 'ticket', 'editorial', 'terminal', 'postcard'];
  const names = ['色块海报', '索引便签', '灵感票据', '独立刊物', '像素终端', '湖畔来信'];
  const fit = async () => {
    assert(await card.evaluate(el => {
      const box = el.querySelector('.note-body');
      const text = el.querySelector('.note-text');
      return text.scrollWidth <= box.clientWidth + 1 && text.scrollHeight <= box.clientHeight + 1;
    }), `Text overflow: ${JSON.stringify(await card.evaluate(el => ({ template: el.dataset.template, h: el.offsetHeight, box: el.querySelector('.note-body').clientHeight, text: el.querySelector('.note-text').scrollHeight, size: el.querySelector('.note-text').style.fontSize })))}`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Page overflow');
  };
  for (const [i, style] of styles.entries()) {
    await page.getByRole('button', { name: names[i], exact: true }).click();
    assert.equal(await card.getAttribute('data-template'), style);
    for (const ratio of ['1:1', '4:5', '3:4']) {
      await page.getByRole('button', { name: ratio, exact: true }).click();
      await page.getByRole('textbox', { name: '正文', exact: true }).fill('留一点时间，给自己。\n不必急着把每一天填满。');
      await fit();
      await page.getByRole('textbox', { name: '正文', exact: true }).fill('这是长文本排版测试。'.repeat(28));
      await page.getByRole('textbox', { name: '标签', exact: true }).fill('这是一条很长的标签'.repeat(3));
      await page.getByRole('textbox', { name: '署名', exact: true }).fill('署名文字'.repeat(10));
      await fit();
    }
    await page.getByRole('textbox', { name: '正文', exact: true }).fill('多出的一小时，\n你想留给什么？');
    await page.getByRole('textbox', { name: '标签', exact: true }).fill('今日一问');
    await page.getByRole('textbox', { name: '署名', exact: true }).fill('');
    await card.screenshot({ path: `/tmp/note-${style}.png` });
    await page.locator('.preview-actions').getByRole('button', { name: '导出图片' }).click();
    await page.locator('.sheet button:enabled').filter({ hasText: '下载' }).waitFor();
    await page.locator('.out-preview').waitFor();
    await page.waitForFunction(() => {
      const img = document.querySelector('.out-preview');
      return img?.complete && img.naturalWidth === 750;
    });
    assert.deepEqual(await page.locator('.out-preview').evaluate(img => [img.naturalWidth, img.naturalHeight]), [750, 1000]);
    const pixels = await page.locator('.out-preview').evaluate(img => {
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
      return new Set(Array.from(ctx.getImageData(0, 0, c.width, c.height).data).filter((_, i) => i % 4 !== 3)).size;
    });
    assert(pixels > 40, `Blank export: ${style}`);
    for (const width of [750, 560]) {
      const decoded = await page.locator('.out-preview').evaluate(async (img, width) => {
        const c = document.createElement('canvas'); c.width = width; c.height = Math.round(img.naturalHeight * width / img.naturalWidth);
        const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, c.width, c.height);
        // Simulate a resized, JPEG-compressed shared image, not just the source SVG.
        const compressed = new Image(); compressed.src = c.toDataURL('image/jpeg', 0.8); await compressed.decode();
        ctx.drawImage(compressed, 0, 0);
        return window.jsQR(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height)?.data;
      }, width);
      assert.equal(decoded, `https://tools.hsn8086.com/note?s=${i}`, `QR decode failed: ${style} at ${width}px`);
    }
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: '下载', exact: true }).click();
    await (await download).saveAs(`/tmp/note-export-${style}.png`);
    await page.keyboard.press('Escape');
    await page.locator('.sheet').waitFor({ state: 'detached' });
  }
  await page.getByRole('button', { name: '复制模板链接' }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  const shared = new URL(link);
  assert.equal(shared.searchParams.get('style'), 'postcard');
  assert(!link.includes('text=') && !link.includes('signature='));
  await page.getByRole('textbox', { name: '正文', exact: true }).fill('本地草稿，不应被模板链接覆盖');
  await page.waitForTimeout(500);
  await page.goto(`${base}/note${shared.search}`);
  assert.equal(await page.getByRole('textbox', { name: '正文', exact: true }).inputValue(), '本地草稿，不应被模板链接覆盖');
  assert.equal(await card.locator('.note-qr').count(), 1);
  await page.locator('label.switch').filter({ hasText: '加入二维码' }).click();
  assert.equal(await card.locator('.note-qr').count(), 0);
  await page.waitForTimeout(500);
  await page.reload();
  await card.waitFor();
  assert.equal(await card.locator('.note-qr').count(), 0);
  await page.locator('label.switch').filter({ hasText: '加入二维码' }).click();
  await page.getByRole('button', { name: '简洁', exact: true }).click();
  assert.equal(await card.locator('.note-qr').count(), 1);
  assert.equal(await card.locator('.note-credit').evaluate(el => getComputedStyle(el).opacity), '1');
  await page.locator('label.switch').filter({ hasText: '保留出处' }).click();
  assert.equal(await card.locator('.note-credit').count(), 0);
  await page.waitForTimeout(500);
  await page.reload();
  await card.waitFor();
  assert.equal(await card.locator('.note-credit').count(), 0);

  for (const viewport of [{width:390,height:844}, {width:320,height:640}]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({path:`/tmp/note-mobile-${viewport.width}.png`});
    await fit();
    await page.evaluate(() => scrollTo(0, 500));
    await page.waitForTimeout(100);
    assert.equal(await page.locator('.preview-frame').getAttribute('data-clipped'), 'false');
    await page.locator('.bottom-bar').getByRole('button',{name:'导出图片'}).click();
    await page.locator('.sheet button:enabled').filter({ hasText: '下载' }).waitFor();
    await page.locator('.out-preview').waitFor();
    await page.waitForTimeout(400);
    await page.screenshot({path:`/tmp/note-export-mobile-${viewport.width}.png`});
    await page.keyboard.press('Escape');
    await page.locator('.sheet').waitFor({ state: 'detached' });
  }
  assert.deepEqual(errors, []);
  console.log('Note checks passed: six templates, three ratios, text fitting, PNG exports, QR decoding from resized JPEGs, QR toggle persistence, nonblank pixels, template privacy, draft persistence, watermark toggle, desktop and mobile.');
} finally {
  await browser?.close();
  await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
}
