export interface CfPoint {
  /** 第几场（合并之后重新编号） */
  n: number;
  contestId: number;
  contestName: string;
  /** 这一场是哪个号打的 */
  handle: string;
  rank: number;
  /** YYYY-MM-DD */
  date: string;
  delta: number;
  /** 这一场之后的显示分 */
  rating: number;
}

export interface CfResult {
  handles: string[];
  points: CfPoint[];
  fetchedAt: number;
}

export interface CfData {
  /** 输入框里的原文，一行或逗号分隔一个号 */
  handlesInput: string;
  title: string;
  theme: 'light' | 'dark';
  /** 卡片底部的最近场次列表 */
  showRecent: boolean;
  /** 图上标出每场是哪个号打的 */
  showSources: boolean;
  watermark: { show: boolean };
  result: CfResult | null;
}
