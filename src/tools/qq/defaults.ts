import type { QQData } from './types';

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

export const defaultData = (): QQData => ({
  script: [
    '[21:18]',
    '海月：这题的状压 DP 我看了一晚上还是没懂',
    '茯茶：先把二进制枚举子集那块单独拎出来写一遍',
    '茯茶：把状态想成"哪些位置已经放好了"，转移就顺了',
    '海月：懂了一点',
    '海月：喵呜',
    '[21:27]',
    '猪猪哟：那你还挺厉害的，我连暴力都写不对',
    '蒟酱：建议先把背包和树形 DP 过一遍再碰状压',
    '海月：好的喵',
  ].join('\n'),
  people: [
    { name: '海月', avatar: letterAvatar('海月'), self: false },
    { name: '茯茶', avatar: letterAvatar('茯茶'), self: false },
    { name: '猪猪哟', avatar: letterAvatar('猪猪哟'), self: false },
    { name: '蒟酱', avatar: letterAvatar('蒟酱'), self: false },
  ],
  images: [],
  header: { show: true, title: '算法交流群', subtitle: '(48)' },
  statusBar: { show: false, time: '9:41', battery: 82, island: true },
  watermark: { show: true, text: `${WATERMARK_HOST}/qq` },
});
