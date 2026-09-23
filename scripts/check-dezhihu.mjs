import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { preview } from 'vite';

const server = await preview({ preview: { host: '127.0.0.1', port: 0, open: false } });
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
let browser;
try {
  browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${base}/zhihu`);
  const card = page.locator('.preview-inner .zh');
  await card.waitFor();

  // 默认：知乎元素齐全
  assert.equal(await card.locator('.q-title').count(), 1);
  assert.equal(await card.locator('.q-meta').count(), 1);
  assert.equal(await card.locator('.author').count(), 1);
  assert.equal(await card.locator('.vote').count(), 1);
  await card.screenshot({ path: '/tmp/zhihu-normal.png' });

  // 打开去知乎化：只剩问题标题 + 正文，知乎身份元素全部消失
  await page.locator('label.switch').filter({ hasText: '去知乎化' }).click();
  assert.equal(await card.locator('.q-title').count(), 1, 'question title should stay');
  assert.equal(await card.locator('.q-meta').count(), 0, 'zhihu meta still shown');
  assert.equal(await card.locator('.author').count(), 0, 'author row still shown');
  assert.equal(await card.locator('.avatar').count(), 0, 'anon avatar still shown');
  assert.equal(await card.locator('.vote').count(), 0, 'vote still shown');
  assert.equal(await card.locator('.follow').count(), 0);
  assert.equal(await card.locator('.share').count(), 0);
  assert.equal(await card.locator('.badge').count(), 0);
  assert.equal(await card.locator('.chevron-more').count(), 0);
  const footerText = await card.locator('.footer').innerText().catch(() => '');
  assert(!footerText.includes('发布于') && !footerText.includes('IP 属地') && !footerText.includes('禁止转载'), `footer: ${footerText}`);
  const cardText = await card.innerText();
  assert(!cardText.includes('知乎'), `card still mentions 知乎: ${cardText}`);
  assert(!cardText.includes('赞同'), `card still mentions 赞同: ${cardText}`);
  // 正文仍在
  assert.equal(await card.locator('.content p').count(), 4);
  // 编辑器里：问题分区还在（只留标题），答主/赞同分区隐藏
  assert.equal(await page.getByRole('heading', { name: '问题' }).count(), 1);
  assert.equal(await page.getByRole('textbox', { name: '标题' }).count(), 1);
  assert.equal(await page.getByRole('heading', { name: '答主' }).count(), 0);
  assert.equal(await page.getByRole('heading', { name: '赞同' }).count(), 0);
  await card.screenshot({ path: '/tmp/zhihu-dezhihu.png' });
  await page.screenshot({ path: '/tmp/zhihu-dezhihu-editor.png' });

  // 刷新后保持
  await page.waitForTimeout(600);
  await page.reload();
  await card.waitFor();
  assert.equal(await card.locator('.author').count(), 0);
  assert.equal(await card.locator('.q-title').count(), 1);

  // 关掉后全部回来
  await page.locator('label.switch').filter({ hasText: '去知乎化' }).click();
  assert.equal(await card.locator('.q-meta').count(), 1);
  assert.equal(await card.locator('.author').count(), 1);
  assert.equal(await card.locator('.vote').count(), 1);

  assert.deepEqual(errors, []);
  console.log('dezhihu checks passed');
} finally {
  await browser?.close();
  await new Promise((res, rej) => server.httpServer.close(e => e ? rej(e) : res()));
}
