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
  await page.goto(`${base}/tg`);
  const card = page.locator('.preview-inner .tg');
  await card.waitFor();

  // 默认深色：macOS 窗口全套
  assert.equal(await card.locator('.wtitle').innerText(), 'Telegram @ hsn');
  assert.equal(await card.locator('.pname').innerText(), 'Serafina');
  assert.equal(await card.locator('.psub').innerText(), 'last seen today at 19:42');
  assert.ok((await card.locator('.dsep').count()) >= 2, 'date pills missing');
  assert.ok((await card.locator('.reply').count()) >= 2, 'reply quotes missing');
  assert.equal(await card.locator('.fwd').count(), 1);
  assert((await card.locator('.fwd').innerText()).includes('hsn.recipe'));
  assert.equal(await card.locator('.vbubble').count(), 1);
  assert.equal(await card.locator('.vdur').innerText(), '0:12');
  assert.equal(await card.locator('.pic').count(), 1);
  assert((await card.locator('.cap').innerText()).includes('小笼包'));
  assert.equal(await card.locator('.bemoji').count(), 1);
  assert.equal(await card.locator('.sysline').count(), 1);
  assert.ok((await card.locator('.react').count()) >= 2, 'reactions missing');
  assert.ok((await card.locator('.mt .tick').count()) > 0, 'read ticks missing');
  assert.equal(await card.locator('.inputbar').count(), 1);
  assert((await card.locator('.watermark').innerText()).includes('/tg'));
  // 消息时间自动排：第一条 20:52
  assert.equal(await card.locator('.mt').first().innerText(), '20:52');
  await card.screenshot({ path: '/tmp/tg-dark.png' });

  // 浅色主题
  await page.locator('.seg button').filter({ hasText: '浅色' }).click();
  assert.equal(await card.getAttribute('data-theme'), 'light');
  await card.screenshot({ path: '/tmp/tg-light.png' });

  // 群聊昵称：别人发的消息上方出彩色名字
  await page.locator('label.switch').filter({ hasText: '群聊昵称' }).click();
  assert.ok((await card.locator('.sender').count()) > 0, 'group sender names missing');
  await card.screenshot({ path: '/tmp/tg-group.png' });
  await page.locator('label.switch').filter({ hasText: '群聊昵称' }).click();

  // 在线：副标题变 online
  await page.locator('label.switch').filter({ hasText: '在线' }).click();
  assert.equal(await card.locator('.psub').innerText(), 'online');
  await page.locator('label.switch').filter({ hasText: '在线' }).click();

  // 双勾：每条自己发的消息两颗勾
  await page.locator('.seg button').filter({ hasText: '双勾' }).click();
  assert.ok((await card.locator('.mt .tick').count()) > 0);

  // 刷新后保持
  await page.waitForTimeout(600);
  await page.reload();
  await card.waitFor();
  assert.equal(await card.locator('.pname').innerText(), 'Serafina');
  assert.ok((await card.locator('.reply').count()) >= 2);

  assert.deepEqual(errors, []);
  console.log('tg checks passed');
} finally {
  await browser?.close();
  await new Promise((res, rej) => server.httpServer.close(e => e ? rej(e) : res()));
}
