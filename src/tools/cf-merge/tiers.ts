import { Hct, hexFromArgb } from '@material/material-color-utilities';

/**
 * Codeforces 的段位色是 2010 年那套网页安全色，直接搬到 MD3E 的面上会脏：
 * 纯 #AA00AA 落在深色面上刺眼，灰色段位又糊进背景里。
 *
 * 所以这里只保留段位的**色相**，明度和彩度交给 HCT 按深浅模式重新定，
 * 跟站点其它颜色一样走 tonal palette 的规则：容器取 tone 90 / 30，
 * 内容取 tone 30 / 90，实心色取 tone 40 / 80。
 */
export interface Tier {
  min: number;
  name: string;
  cn: string;
  hue: number;
  chroma: number;
}

export const TIERS: Tier[] = [
  { min: -Infinity, name: 'Newbie', cn: '新手', hue: 265, chroma: 8 },
  { min: 1200, name: 'Pupil', cn: '初学者', hue: 145, chroma: 44 },
  { min: 1400, name: 'Specialist', cn: '专家', hue: 192, chroma: 40 },
  { min: 1600, name: 'Expert', cn: '专业', hue: 258, chroma: 44 },
  { min: 1900, name: 'Candidate Master', cn: '候选大师', hue: 305, chroma: 48 },
  { min: 2100, name: 'Master', cn: '大师', hue: 75, chroma: 52 },
  { min: 2300, name: 'Intl. Master', cn: '国际大师', hue: 60, chroma: 56 },
  { min: 2400, name: 'Grandmaster', cn: '特级大师', hue: 25, chroma: 56 },
  { min: 2600, name: 'Intl. Grandmaster', cn: '国际特级大师', hue: 15, chroma: 60 },
  { min: 3000, name: 'Legendary', cn: '传奇大师', hue: 5, chroma: 64 },
];

export const tierOf = (rating: number): Tier =>
  [...TIERS].reverse().find((t) => rating >= t.min) ?? TIERS[0];

const hex = (hue: number, chroma: number, tone: number) => hexFromArgb(Hct.from(hue, chroma, tone).toInt());

export interface TierColors {
  solid: string;
  container: string;
  onContainer: string;
}

export function tierColors(tier: Tier, dark: boolean): TierColors {
  return {
    solid: hex(tier.hue, tier.chroma, dark ? 80 : 40),
    container: hex(tier.hue, tier.chroma, dark ? 30 : 90),
    onContainer: hex(tier.hue, tier.chroma, dark ? 90 : 30),
  };
}

/**
 * 当前所在档位的背景色。
 *
 * 只比图区底色深（浅色）或浅（深色）一点点，彩度压到个位数：
 * 它是参照系，不是内容，不能跟曲线抢视线。
 */
export const tierBand = (tier: Tier, dark: boolean) => hex(tier.hue, dark ? 10 : 12, dark ? 20 : 95);

/**
 * 发丝线。
 *
 * 不能直接拿 surface-container-high：它跟图区底色只差两个色阶，在浅色下根本看不见，
 * 段位名就成了没有参照物的浮字。
 */
export const hairline = (dark: boolean) => hex(280, 4, dark ? 34 : 86);

/**
 * 涨跌色。
 *
 * 故意不跟段位色联动：段位是蓝的时候，“涨了”也跟着变蓝，涨跌这层语义就没了。
 */
export const deltaColors = (up: boolean, dark: boolean) => ({
  fg: hex(up ? 150 : 22, 44, dark ? 84 : 32),
  bg: hex(up ? 150 : 22, 44, dark ? 24 : 94),
});

/**
 * 每个号一种色。
 *
 * 不用 primary / secondary / tertiary 那三个角色：同一个种子色派生出来的三个色
 * 在一条两像素宽的折线上几乎分不出来。这里直接锁色相，明度和彩度还是走 HCT。
 */
const SOURCE_HUES = [265, 150, 25, 200, 320, 95, 60, 180];

export const sourceColor = (index: number, dark: boolean) =>
  hex(SOURCE_HUES[index % SOURCE_HUES.length], 58, dark ? 76 : 46);

/** 图上要画的段位分隔线：只画落在可见区间里的那几条 */
export const tierLinesIn = (lo: number, hi: number) =>
  TIERS.filter((t) => t.min > lo && t.min < hi && Number.isFinite(t.min));
