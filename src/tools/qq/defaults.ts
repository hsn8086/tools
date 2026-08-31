import type { QQData } from './types';


export const WATERMARK_HOST = 'tools.hsn8086.com';

/**
 * QQ 的经典默认头像：那只企鹅。
 * 取自腾讯给「没设过头像的号」返回的那张图
 * （q.qlogo.cn/headimg_dl?dst_uin=0&spec=100），落到本地走同域，
 * 导出时不会因为跨域拿不到图。
 */
export const DEFAULT_AVATAR = '/assets/qq/default.png';

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
    { name: '土豆', avatar: DEFAULT_AVATAR, self: false, title: '群主' },
    { name: '芝麻糊', avatar: DEFAULT_AVATAR, self: false, title: '管理员' },
    { name: '我', avatar: DEFAULT_AVATAR, self: true, title: '' },
    { name: '小鹿', avatar: DEFAULT_AVATAR, self: false, title: '' },
  ],
  images: [],
  header: { show: true, title: '摸鱼交流中心(48)', unread: '12' },
  inputBar: true,
  statusBar: { show: false, time: '9:41', battery: 82, island: true },
  watermark: { show: true, text: `${WATERMARK_HOST}/qq` },
});
