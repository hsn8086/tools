/**
 * Codeforces rating 计算。
 *
 * 算法出自 Mike Mirzayanov 的公开实现（codeforces.com/blog/entry/20762），
 * 这里的 FFT 加速版本移植自 Carrot（MIT, github.com/meooow25/carrot），
 * 它又源自 TLE 的 rating_calculator.py。
 *
 * 为什么要 FFT：一场 Div.3 有三万个 rated 选手，按定义算 seed 是 O(n²)，
 * 在浏览器里跑一场就要十几秒。seed 只跟「每个 rating 上有多少人」有关，
 * 于是把它写成人数分布和 Elo 胜率曲线的卷积，一次 FFT 解决整场。
 */

/** 实数序列卷积，Cooley-Tukey FFT，O(n log n) */
class FFTConv {
  private n: number;
  private wr: Float64Array;
  private wi: Float64Array;
  private rev: Int32Array;

  constructor(n: number) {
    let k = 1;
    while (1 << k < n) k++;
    this.n = 1 << k;
    const half = this.n >> 1;
    this.wr = new Float64Array(half);
    this.wi = new Float64Array(half);
    const ang = (2 * Math.PI) / this.n;
    for (let i = 0; i < half; i++) {
      this.wr[i] = Math.cos(i * ang);
      this.wi[i] = Math.sin(i * ang);
    }
    this.rev = new Int32Array(this.n);
    for (let i = 1; i < this.n; i++) this.rev[i] = (this.rev[i >> 1] >> 1) | ((i & 1) << (k - 1));
  }

  private reverse(a: Float64Array) {
    for (let i = 1; i < this.n; i++) {
      const j = this.rev[i];
      if (i < j) {
        const t = a[i];
        a[i] = a[j];
        a[j] = t;
      }
    }
  }

  private transform(ar: Float64Array, ai: Float64Array) {
    this.reverse(ar);
    this.reverse(ai);
    for (let len = 2; len <= this.n; len <<= 1) {
      const half = len >> 1;
      const diff = this.n / len;
      for (let i = 0; i < this.n; i += len) {
        let pw = 0;
        for (let j = i; j < i + half; j++) {
          const k = j + half;
          const vr = ar[k] * this.wr[pw] - ai[k] * this.wi[pw];
          const vi = ar[k] * this.wi[pw] + ai[k] * this.wr[pw];
          ar[k] = ar[j] - vr;
          ai[k] = ai[j] - vi;
          ar[j] += vr;
          ai[j] += vi;
          pw += diff;
        }
      }
    }
  }

  /** 把两个实序列打包进一次复数 FFT：省一半变换 */
  convolve(a: Float64Array, b: Float64Array): Float64Array {
    const n = this.n;
    const resLen = a.length + b.length - 1;
    if (resLen > n) throw new Error(`卷积长度 ${resLen} 超过 ${n}`);
    const cr = new Float64Array(n);
    const ci = new Float64Array(n);
    cr.set(a);
    ci.set(b);
    this.transform(cr, ci);

    cr[0] = 4 * cr[0] * ci[0];
    ci[0] = 0;
    for (let i = 1, j = n - 1; i <= j; i++, j--) {
      const ar = cr[i] + cr[j];
      const ai = ci[i] - ci[j];
      const br = ci[j] + ci[i];
      const bi = cr[j] - cr[i];
      cr[i] = ar * br - ai * bi;
      ci[i] = ar * bi + ai * br;
      cr[j] = cr[i];
      ci[j] = -ci[i];
    }

    this.transform(cr, ci);
    const res = new Float64Array(resLen);
    res[0] = cr[0] / (4 * n);
    for (let i = 1, j = n - 1; i <= j && i < resLen; i++, j--) {
      res[i] = cr[j] / (4 * n);
      if (j < resLen) res[j] = cr[i] / (4 * n);
    }
    return res;
  }
}

/** 新号的内部起始分。页面上显示 0，参与计算的是 1400 */
export const DEFAULT_RATING = 1400;

const MAX_RATING = 6000;
const MIN_RATING = -500;
const RANGE = MAX_RATING - MIN_RATING;
const ELO_OFFSET = RANGE;
const RATING_OFFSET = -MIN_RATING;

/** ELO_WIN_PROB[y - x + ELO_OFFSET] = rating 为 x 的人赢 rating 为 y 的人的概率 */
const ELO_WIN_PROB = new Float64Array(2 * RANGE + 1);
for (let i = -RANGE; i <= RANGE; i++) ELO_WIN_PROB[i + ELO_OFFSET] = 1 / (1 + Math.pow(10, i / 400));

let conv: FFTConv | null = null;

/** 在 [left, right) 上找第一个让 predicate 为真的整数 */
function binarySearch(left: number, right: number, predicate: (v: number) => boolean): number {
  while (left < right) {
    const mid = (left + right) >> 1;
    if (predicate(mid)) right = mid;
    else left = mid + 1;
  }
  return left;
}

export interface Row {
  handle: string;
  /** 官方名次。并列会重复，中间可能因为未计分选手被滤掉而不连续 */
  rank: number;
  /** 参与计算的 rating，新号传 null */
  rating: number | null;
}

/**
 * 算出 target 这一场的 delta。
 *
 * 只有 rated 选手参与计算，所以名次要在这个子集里重新压紧（并列保持并列）——
 * Carrot 处理已结束的比赛时也是这么做的。
 */
export function deltaFor(rows: Row[], target: string): number {
  const n = rows.length;
  const order = rows.map((_, i) => i).sort((a, b) => rows[a].rank - rows[b].rank);
  const ratings = new Int32Array(n);
  const ranks = new Int32Array(n);
  let targetIdx = -1;

  for (let i = 0; i < n; i++) {
    const r = rows[order[i]];
    ratings[i] = r.rating ?? DEFAULT_RATING;
    if (r.handle === target) targetIdx = i;
  }
  if (targetIdx < 0) throw new Error(`这场比赛里没有 ${target}`);

  // 压紧名次。并列取组内最靠后的位次（"有多少人不比你差"），
  // 官方实现和 Carrot 都是这个口径——写成最靠前会让整条曲线偏低。
  for (let i = n - 1; i >= 0; ) {
    let j = i;
    while (j > 0 && rows[order[j - 1]].rank === rows[order[i]].rank) j--;
    for (let k = j; k <= i; k++) ranks[k] = i + 1;
    i = j - 1;
  }

  // seed[r + 偏移] = 一个 rating 为 r 的人若参赛的期望名次
  const counts = new Float64Array(RANGE);
  for (let i = 0; i < n; i++) counts[ratings[i] + RATING_OFFSET] += 1;
  conv ??= new FFTConv(ELO_WIN_PROB.length + RANGE - 1);
  const seed = conv.convolve(ELO_WIN_PROB, counts);
  for (let i = 0; i < seed.length; i++) seed[i] += 1;

  // 自己不该跟自己比，所以要把自己那份胜率减掉
  const getSeed = (r: number, self: number) =>
    seed[r + ELO_OFFSET + RATING_OFFSET] - ELO_WIN_PROB[r - self + ELO_OFFSET];

  const deltas = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const self = ratings[i];
    const mid = Math.sqrt(ranks[i] * getSeed(self, self));
    const need = binarySearch(2, MAX_RATING, (r) => getSeed(r, self) < mid) - 1;
    deltas[i] = Math.trunc((need - self) / 2);
  }

  // 全场零和修正，再对高分段做一次，避免通货膨胀
  let sum = 0;
  for (let i = 0; i < n; i++) sum += deltas[i];
  const incAll = Math.trunc(-sum / n) - 1;
  for (let i = 0; i < n; i++) deltas[i] += incAll;

  const byRating = Array.from({ length: n }, (_, i) => i).sort((a, b) => ratings[b] - ratings[a]);
  const topCount = Math.min(4 * Math.round(Math.sqrt(n)), n);
  let topSum = 0;
  for (let i = 0; i < topCount; i++) topSum += deltas[byRating[i]];
  const incTop = Math.min(Math.max(Math.trunc(-topSum / topCount), -10), 0);
  for (let i = 0; i < n; i++) deltas[i] += incTop;

  return deltas[targetIdx];
}

/** 前六场显示分要打的折扣：内部分减去它才是页面上那个数 */
const DISPLAY_OFFSET = [1400, 900, 550, 300, 150, 50, 0];

/** 内部 rating → 页面显示的 rating。contests 是含这一场在内的已参赛场数 */
export const toDisplay = (real: number, contests: number) =>
  real - DISPLAY_OFFSET[Math.min(contests, DISPLAY_OFFSET.length - 1)];

/** 页面显示的 rating → 内部 rating */
export const toReal = (display: number, contests: number) =>
  display + DISPLAY_OFFSET[Math.min(contests, DISPLAY_OFFSET.length - 1)];
