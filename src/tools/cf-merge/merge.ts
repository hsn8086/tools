import { contestRatingChanges, userRating, type RatingChange } from './api';
import { DEFAULT_RATING, deltaFor, toDisplay, type Row } from './rating';
import type { CfPoint } from './types';

export interface Entry {
  contestId: number;
  contestName: string;
  time: number;
  handle: string;
  rank: number;
}

/**
 * 把几个号的 rated 场次按时间穿成一条。
 *
 * 同一场被两个号打过时只留名次好的那次：虚拟号是一个人，一场比赛只能有一个成绩。
 */
export function mergeHistories(histories: RatingChange[][]): Entry[] {
  const best = new Map<number, Entry>();
  for (const history of histories) {
    for (const c of history) {
      const prev = best.get(c.contestId);
      if (prev && prev.rank <= c.rank) continue;
      best.set(c.contestId, {
        contestId: c.contestId,
        contestName: c.contestName,
        time: c.ratingUpdateTimeSeconds,
        handle: c.handle,
        rank: c.rank,
      });
    }
  }
  return [...best.values()].sort((a, b) => a.time - b.time);
}

export const fetchHistories = (handles: string[], signal?: AbortSignal) =>
  Promise.all(handles.map((h) => userRating(h, signal)));

export interface Progress {
  done: number;
  total: number;
  contestName: string;
}

/**
 * 重放这条合并后的历史。
 *
 * 每一场都用官方那份完整名单重算：别人还是他们当时的真实分，
 * 只把打这场的号换成虚拟号累计到现在的分。所以这不是把三个号的 delta 相加——
 * 同样的名次，分低的时候涨得多，分高的时候涨得少，必须一场一场重算。
 */
export async function simulate(
  entries: Entry[],
  opts: { signal?: AbortSignal; onProgress?: (p: Progress) => void },
): Promise<CfPoint[]> {
  const points: CfPoint[] = [];
  let real = DEFAULT_RATING;

  for (const [i, entry] of entries.entries()) {
    opts.onProgress?.({ done: i, total: entries.length, contestName: entry.contestName });
    const changes = await contestRatingChanges(entry.contestId, opts.signal);

    const rows: Row[] = changes.map((c) => ({
      handle: c.handle,
      rank: c.rank,
      // oldRating 为 0 的是新号，官方藏起了真实分，按起始分 1400 处理
      rating: c.handle === entry.handle ? real : c.oldRating === 0 ? null : c.oldRating,
    }));

    // 单场几万人，算之前让出一帧，别把界面卡住
    await new Promise((r) => setTimeout(r, 0));
    const delta = deltaFor(rows, entry.handle);
    real += delta;

    points.push({
      n: i + 1,
      contestId: entry.contestId,
      contestName: entry.contestName,
      handle: entry.handle,
      rank: entry.rank,
      date: new Date(entry.time * 1000).toISOString().slice(0, 10),
      delta,
      rating: toDisplay(real, i + 1),
    });
  }

  opts.onProgress?.({ done: entries.length, total: entries.length, contestName: '' });
  return points;
}

export const parseHandles = (input: string) =>
  [...new Set(input.split(/[\s,，;；]+/).map((s) => s.trim()).filter(Boolean))].slice(0, 8);
