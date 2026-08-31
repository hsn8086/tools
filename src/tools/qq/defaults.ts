import type { QQData } from './types';
import { faceUrl, FACES } from './faces';

export const WATERMARK_HOST = 'tools.hsn8086.com';

/** 没上传头像时用首字生成一个，省掉一张占位图，也天然没有跨域问题 */
export function letterAvatar(name: string): string {
  const ch = (name.trim()[0] ?? '?').toUpperCase();
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  const bg = `hsl(${h} 52% 62%)`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="${bg}"/><text x="40" y="41" font-family="-apple-system,PingFang SC,sans-serif" font-size="36" fill="#fff" text-anchor="middle" dominant-baseline="central">${ch.replace(/[<&>]/g, '')}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** 没指定头像时，按名字稳定地挑一张经典小黄脸 */
export function pickFace(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % FACES.length;
  return faceUrl(FACES[h].id);
}

export const defaultData = (): QQData => ({
  script: [
    '[20:14]',
    '土豆：下周三团建，报名的在群里冒个泡',
    '土豆：地点还没定，有想去的地方说一声',
    '芝麻糊：密室吧，上次那家评价挺好的',
    '我：+1，密室好',
    '[20:31]',
    '小鹿：我恐高，别选高空项目就行',
    '芝麻糊：密室不高，放心',
    '我：那就这么定了，我去问价',
  ].join('\n'),
  people: [
    { name: '土豆', avatar: pickFace('土豆'), self: false, title: '群主' },
    { name: '芝麻糊', avatar: pickFace('芝麻糊'), self: false, title: '管理员' },
    { name: '我', avatar: pickFace('我'), self: true, title: '' },
    { name: '小鹿', avatar: pickFace('小鹿'), self: false, title: '' },
  ],
  images: [],
  header: { show: true, title: '摸鱼交流中心(48)', unread: '12' },
  inputBar: true,
  statusBar: { show: false, time: '9:41', battery: 82, island: true },
  watermark: { show: true, text: `${WATERMARK_HOST}/qq` },
});
