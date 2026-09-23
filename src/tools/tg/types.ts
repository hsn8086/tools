/** 一个人的设定。名字不在里面——名字是剧本里的那个 key */
export interface PersonAttrs {
  /** 标记成「我」：靠右、蓝色气泡、带已读勾 */
  self: boolean;
}

export interface TGPerson extends PersonAttrs {
  name: string;
}

/** 贴在某条消息下面的表情回应 */
export interface Reaction {
  emoji: string;
  count: number;
}

export type TGItem =
  /** 居中日历药丸：「September 4」「9月4日」 */
  | { kind: 'date'; id: string; text: string }
  /** 灰色居中系统行：置顶、入群、改群名 */
  | { kind: 'sys'; id: string; text: string }
  /** 不渲染，只把后面消息的时间拨到这里：[时刻] 21:30 */
  | { kind: 'clock'; id: string; text: string }
  | {
      kind: 'msg';
      id: string;
      name: string;
      text: string;
      /** 被引用的那条：绿色竖条 + 人名 + 原文 */
      replyTo?: { name: string; text: string };
      /** 「Forwarded from: xxx」挂在气泡最上面 */
      forward?: string;
      /** 语音条时长，如 0:12 */
      voice?: string;
      imageId?: string;
      reactions?: Reaction[];
    };

export interface TGData {
  /** 剧本原文，`昵称：内容` 一行一条，见 script.ts */
  script: string;
  /** 谁是不是「我」，按昵称存。设定一直留着，改错字不丢 */
  roster: Record<string, PersonAttrs>;
  images: { id: string; src: string }[];

  /** macOS 窗口顶部：红绿灯 + 「Telegram @ hsn」 */
  chrome: {
    show: boolean;
    title: string;
  };

  /** 聊天页头部：头像、名字、副标题（last seen / online） */
  peer: {
    show: boolean;
    /** 没传图就用名字首字母画渐变圆，跟 TG 默认头像一样 */
    avatar: string;
    name: string;
    subtitle: string;
    /** 在线：副标题变蓝 */
    online: boolean;
  };

  /** 群聊模式：别人发的消息上方显示彩色昵称 */
  group: boolean;

  /** 底部输入栏，真实截图里一般都带着 */
  inputBar: boolean;

  /** 自己发的消息右下角的对勾：不显示 / 单勾（已送达）/ 双勾（已读） */
  readState: 'none' | 'sent' | 'read';

  /** 每条消息右下角的时间从这个点开始，每条自动 +1 分钟 */
  clock: string;

  watermark: {
    show: boolean;
    text: string;
  };
}
