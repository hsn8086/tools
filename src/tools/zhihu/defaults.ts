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
    title: '半只烤鸭，男朋友把唯一的鸭腿自然而然吃了，完全不问我，好失落，不是在意鸭腿，只是觉得他很自私怎么办？',
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
      '如果不在乎鸭腿，你根本不会注意谁吃了，就像我问你，鸭子的肋骨，各吃了几块，你肯定记不住了。',
      '**因为你真的不在乎，也更不会在乎问没问你。**',
      '所以，真实的你，不但想要鸭腿，还不想自己主动拿，这样显得自己很自私，你希望男朋友主动问你吃不吃，再三谦让，最后还是给你。',
      '这样你就既有鸭腿吃，还不用自私了。',
      '真的是又虚伪，又自私。',
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
