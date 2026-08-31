import type { ZhihuData } from './types';

export const WATERMARK_HOST = 'tools.hsn8086.com';
export const ANON_AVATAR = '/assets/avatar-anon.jpg';
export const ANON_NAME = '匿名用户';

let seq = 0;
export const uid = () => `b${Date.now().toString(36)}${(seq++).toString(36)}`;

export const defaultData = (): ZhihuData => ({
  theme: 'light',
  question: {
    show: true,
    title: '有什么让房间变整洁的方法，真的能坚持下去？',
    answerCount: '1,020',
    followCount: '1076',
    showMeta: true,
    showArrow: true,
  },
  author: {
    avatar: ANON_AVATAR,
    name: ANON_NAME,
    badge: 'none',
    headline: '',
    showFollow: false,
    showShare: false,
  },
  vote: {
    show: true,
    count: '2749',
    showArrow: false,
    showListened: false,
    listenedCount: '1',
  },
  content: {
    text: [
      '先把桌面清空，只留下每天都会用到的三样东西。',
      '**多余的东西不是收起来，是拿走。**',
      '收纳盒买得越多房间越乱，因为你只是把混乱装进了盒子，东西一样都没少。',
      '不要定周末大扫除，那个定了也不会做。从一个抽屉开始，二十分钟，今天就能做完。',
    ].join('\n'),
    images: [],
  },
  footer: {
    show: true,
    style: 'full',
    time: '2023-10-15 19:08',
    ip: '广东',
    noRepost: true,
  },
  statusBar: { show: false, time: '9:41', battery: 82, island: true },
  showExpandChevron: false,
  // 带上具体工具的路径，看到图的人能直接找到这个生成器
  watermark: { show: true, text: `${WATERMARK_HOST}/zhihu` },
});
