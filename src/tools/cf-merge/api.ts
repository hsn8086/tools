/**
 * Codeforces API 客户端。
 *
 * 两个约束决定了这里的写法：
 * 1. 官方限流是「每 2 秒最多一次」，并发请求会直接吃 429，所以所有请求走一条串行队列。
 * 2. contest.ratingChanges 对非管理员只接受「只带 contestId 的匿名 GET」，不能加别的参数。
 */

const API = 'https://codeforces.com/api';
const MIN_GAP = 2100;

export interface RatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

let chain: Promise<unknown> = Promise.resolve();
let lastAt = 0;

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((res, rej) => {
    const t = setTimeout(res, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      rej(new DOMException('已取消', 'AbortError'));
    }, { once: true });
  });

async function call<T>(path: string, signal?: AbortSignal): Promise<T> {
  const run = async (): Promise<T> => {
    // 限流是按时间窗算的，被拒了就退避重试，而不是把错误抛给用户
    for (let attempt = 0; ; attempt++) {
      const wait = lastAt + MIN_GAP - Date.now();
      if (wait > 0) await sleep(wait, signal);
      lastAt = Date.now();

      const res = await fetch(`${API}/${path}`, { signal });
      if (res.status === 429 || res.status === 403) {
        if (attempt >= 4) throw new Error('Codeforces 限流了，等一会再试');
        await sleep(2000 * (attempt + 1), signal);
        continue;
      }
      if (!res.ok) throw new Error(`Codeforces 返回 ${res.status}`);

      const body = (await res.json()) as { status: string; comment?: string; result: T };
      if (body.status !== 'OK') throw new Error(body.comment || 'Codeforces 拒绝了这次请求');
      return body.result;
    }
  };

  // 串成一条链，前一个请求失败也不影响后面排队
  const next = chain.then(run, run);
  chain = next.catch(() => {});
  return next;
}

/** 某个账号的全部 rated 场次 */
export const userRating = (handle: string, signal?: AbortSignal) =>
  call<RatingChange[]>(`user.rating?handle=${encodeURIComponent(handle)}`, signal);

/** 某场比赛所有 rated 选手的名次和赛前分 */
export const contestRatingChanges = (contestId: number, signal?: AbortSignal) =>
  call<RatingChange[]>(`contest.ratingChanges?contestId=${contestId}`, signal);
