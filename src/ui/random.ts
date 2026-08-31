/** 随机填数用的小工具。目标是「像真的」，不是「均匀分布」：
 *  真实截图里的数字有量级偏好，小数目远比大数目常见。 */

export const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

export const pick = <T>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];

/** 按量级抽，小数目更常出现 */
function magnitude(): number {
  const r = Math.random();
  if (r < 0.35) return randInt(10, 999);
  if (r < 0.75) return randInt(1000, 9999);
  if (r < 0.95) return randInt(10_000, 99_999);
  return randInt(100_000, 999_999);
}

/** 一万以下带千分位，一万以上写成「3.2万」。中文里「万」前面不留空 */
function fmt(n: number): string {
  if (n < 10_000) return n.toLocaleString('en-US');
  return `${(n / 10_000).toFixed(1).replace(/\.0$/, '')}万`;
}

/** 赞同、关注这类，量级可以很大 */
export const randCount = () => fmt(magnitude());

/** 小一点的计数：评论、听过这类 */
export const randSmallCount = () => fmt(Math.random() < 0.6 ? randInt(3, 999) : randInt(1000, 49_999));

/** 回答数。真问题很少上万，上万就不像了 */
export const randAnswerCount = () => fmt(Math.random() < 0.5 ? randInt(20, 999) : randInt(1000, 9999));

/** 手机状态栏那种时间 */
export const randClock = () => `${randInt(0, 23)}:${String(randInt(0, 59)).padStart(2, '0')}`;

/** 发布于 xxxx-xx-xx hh:mm，近三年内。跟默认示例一个格式 */
export function randDate(): string {
  const t = new Date(Date.now() - randInt(0, 3 * 365) * 86_400_000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())} ${randInt(7, 23)}:${p(randInt(0, 59))}`;
}

export const PROVINCES = [
  '北京',
  '上海',
  '广东',
  '浙江',
  '江苏',
  '四川',
  '湖北',
  '湖南',
  '陕西',
  '福建',
  '山东',
  '河南',
  '辽宁',
  '重庆',
  '天津',
  '安徽',
  '江西',
  '云南',
] as const;

export const randProvince = () => pick(PROVINCES);
