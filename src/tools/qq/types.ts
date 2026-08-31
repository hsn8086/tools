export interface QQPerson {
  /** 用剧本里出现的昵称当 key */
  name: string;
  avatar: string;
  /** 标记成「我」：靠右、蓝气泡、不显示昵称 */
  self: boolean;
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
    title: string;
    /** 副标题，群聊人数之类 */
    subtitle: string;
  };

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
