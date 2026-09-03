/** 一个人的设定。名字不在里面——名字是剧本里的那个 key */
export interface PersonAttrs {
  avatar: string;
  /** 标记成「我」：靠右、蓝气泡 */
  self: boolean;
  /** 头衔，昵称前面那个小标签。「群主」是琥珀色，其余按管理员的青色 */
  title: string;
}

export interface QQPerson extends PersonAttrs {
  name: string;
}

/** 贴在某条消息下面的表情回应 */
export interface Reaction {
  emoji: string;
  count: number;
  /** 谁贴的。写了名字才能生成「XXX回应了你的消息」 */
  who: string[];
}

export type QQItem =
  | { kind: 'time'; id: string; text: string }
  /** 灰色居中系统行：戳一戳、回应了你的消息，@名字 会变蓝 */
  | { kind: 'sys'; id: string; text: string }
  /** 「XXX撤回了一条消息 ⊗」 */
  | { kind: 'recall'; id: string; name: string }
  | { kind: 'msg'; id: string; name: string; text: string; imageId?: string; reactions?: Reaction[] };

export interface QQData {
  /** 剧本原文，`昵称：内容` 一行一条，见 script.ts */
  script: string;
  /**
   * 谁长什么样，按昵称存。
   * 成员列表只列剧本里眼下有的人，但设定一直留着：
   * 打字打到一半的半截名字不会堆成一堆人，改个错字也不至于把头像弄丢。
   */
  roster: Record<string, PersonAttrs>;
  images: {
    id: string;
    src: string;
    /** GIF 才有：总帧数、选中的帧，以及定格出来的那张 PNG */
    frames?: number;
    frame?: number;
    still?: string;
  }[];

  header: {
    show: boolean;
    /** 群名，人数就直接写进去：hsn的神秘巨大猫窝(229) */
    title: string;
    /** 返回箭头右边那颗未读数气泡，留空就不画 */
    unread: string;
  };

  /** 底部输入栏，真实截图里一般都带着 */
  inputBar: boolean;

  /**
   * 自动补「XXX回应了你的消息」。
   * QQ 只有在被贴的是你自己的消息时才推这行，所以它跟着
   * 贴表情走，不用单独再写一遍。
   */
  showReactionNotice: boolean;

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
