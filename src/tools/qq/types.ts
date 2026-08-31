export interface QQPerson {
  /** 用剧本里出现的昵称当 key */
  name: string;
  avatar: string;
  /** 标记成「我」：靠右、蓝气泡，昵称照常显示在气泡上方 */
  self: boolean;
  /** 头衔，昵称前面那个小标签。「群主」是琥珀色，其余按管理员的青色 */
  title: string;
}

export type QQItem =
  | { kind: 'time'; id: string; text: string }
  | { kind: 'msg'; id: string; name: string; text: string; imageId?: string };

export interface QQData {
  /** 剧本原文，`昵称：内容` 一行一条，见 script.ts */
  script: string;
  people: QQPerson[];
  images: { id: string; src: string }[];

  header: {
    show: boolean;
    /** 群名，人数就直接写进去：hsn的神秘巨大猫窝(229) */
    title: string;
    /** 返回箭头右边那颗未读数气泡，留空就不画 */
    unread: string;
  };

  /** 底部输入栏，真实截图里一般都带着 */
  inputBar: boolean;

  statusBar: {
    show: boolean;
    time: string;
    battery: number;
    island: boolean;
  };

  watermark: {
    show: boolean;
    text: string;
  };
}
