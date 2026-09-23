import type { TGData } from './types';

export const WATERMARK_HOST = 'tools.hsn8086.com';

/** 默认演示用图，跟便签那张湖景同一份，走同域导出不跨域 */
export const DEMO_PHOTO = '/assets/note/lake.jpg';

export const defaultData = (): TGData => ({
  script: [
    '[9月4日]',
    'Serafina：scoop salad',
    '[引用] Serafina：scoop salad',
    'Serafina：这是什么，看起来很好吃',
    '我：![demo] 小笼包!',
    '我：😏',
    'Serafina：What did you have for dinner last night?',
    '[引用] Serafina：What did you have for dinner last night?',
    '我：烤冷面和鸡架，还买了俩蛋挞，明天带去公司当早饭',
    '我：[语音] 0:12',
    '[9月5日]',
    '[转发] hsn.recipe',
    '我：他们家的红烧肉真的好吃，给你留了一份',
    '+❤️2 👍1',
    'Serafina：那我明天中午过来拿',
    '[系统] Serafina 置顶了一条消息',
  ].join('\n'),
  roster: {
    Serafina: { self: false },
    我: { self: true },
  },
  images: [{ id: 'demo', src: DEMO_PHOTO }],
  chrome: { show: true, title: 'Telegram @ hsn' },
  peer: { show: true, avatar: '', name: 'Serafina', subtitle: 'last seen today at 19:42', online: false },
  group: false,
  inputBar: true,
  readState: 'sent',
  clock: '20:52',
  watermark: { show: true, text: `${WATERMARK_HOST}/tg` },
});
