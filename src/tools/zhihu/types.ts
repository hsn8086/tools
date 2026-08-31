export type ZhihuTheme = 'light' | 'dark';

export type BadgeKind = 'none' | 'blue' | 'gold' | 'org';

export type ImageFit = 'auto' | 'full';

export type Block =
  | { id: string; type: 'text'; text: string }
  | { id: string; type: 'image'; src: string; fit: ImageFit };

export interface ContentImage {
  id: string;
  src: string;
  fit: ImageFit;
}

/**
 * 正文就是一长条文本，换行分段。
 * 图片以单独一行的 `![id]` 标记占位，这样图文顺序由文本本身决定，
 * 不需要另一套拖拽排序的 UI。
 */
export interface ZhihuContent {
  text: string;
  images: ContentImage[];
}

export interface StatusBar {
  show: boolean;
  time: string;
  battery: number; // 0-100
  /** 灵动岛。截图里只会出现灵动岛，刘海是被系统裁掉的 */
  island: boolean;
}

export interface ZhihuData {
  theme: ZhihuTheme;

  question: {
    show: boolean;
    title: string;
    answerCount: string;
    followCount: string;
    showMeta: boolean;
    showArrow: boolean;
  };

  author: {
    avatar: string;
    name: string;
    badge: BadgeKind;
    headline: string;
    showFollow: boolean;
    showShare: boolean;
  };

  vote: {
    show: boolean;
    count: string;
    showArrow: boolean;
    showListened: boolean;
    listenedCount: string;
  };

  content: ZhihuContent;

  footer: {
    show: boolean;
    /** full: 发布于 x · IP 属地y · 禁止转载 ； plain: x · y */
    style: 'full' | 'plain';
    time: string;
    ip: string;
    noRepost: boolean;
  };

  statusBar: StatusBar;

  /** 尾部展开箭头（知乎折叠长答案时的 v 形） */
  showExpandChevron: boolean;

  watermark: {
    show: boolean;
    text: string;
  };
}
