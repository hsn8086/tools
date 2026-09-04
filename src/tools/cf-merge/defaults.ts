import type { CfData, CfPoint } from './types';

export const WATERMARK = 'tools.hsn8086.com/cf-merge';

/**
 * 默认展示的示例：三个号合并成一个虚拟号，34 场。
 * 打开就能看到卡片长什么样，不用先等一分钟的接口拉取。
 */
export const DEMO_HANDLES = ['hsn8086', 'small-hsn', 'big-hsn'];

const DEMO_POINTS: CfPoint[] = [
  { n: 1, contestId: 2025, contestName: "Educational Codeforces Round 170 (Rated for Div. 2)", handle: "hsn8086", rank: 11733, date: "2024-10-14", delta: -115, rating: 385 },
  { n: 2, contestId: 2024, contestName: "Codeforces Round 980 (Div. 2)", handle: "hsn8086", rank: 5738, date: "2024-10-20", delta: -42, rating: 693 },
  { n: 3, contestId: 2033, contestName: "Codeforces Round 981 (Div. 3)", handle: "hsn8086", rank: 13927, date: "2024-10-24", delta: -96, rating: 847 },
  { n: 4, contestId: 2027, contestName: "Codeforces Round 982 (Div. 2)", handle: "hsn8086", rank: 3744, date: "2024-10-26", delta: 59, rating: 1056 },
  { n: 5, contestId: 2035, contestName: "Codeforces Global Round 27", handle: "hsn8086", rank: 3886, date: "2024-10-27", delta: 53, rating: 1209 },
  { n: 6, contestId: 2026, contestName: "Educational Codeforces Round 171 (Rated for Div. 2)", handle: "hsn8086", rank: 5970, date: "2024-10-28", delta: -7, rating: 1252 },
  { n: 7, contestId: 2032, contestName: "Codeforces Round 983 (Div. 2)", handle: "hsn8086", rank: 7660, date: "2024-11-01", delta: -38, rating: 1214 },
  { n: 8, contestId: 2037, contestName: "Codeforces Round 988 (Div. 3)", handle: "hsn8086", rank: 3474, date: "2024-11-17", delta: 24, rating: 1238 },
  { n: 9, contestId: 2039, contestName: "CodeTON Round 9 (Div. 1 + Div. 2, Rated, Prizes!)", handle: "hsn8086", rank: 4230, date: "2024-11-23", delta: 19, rating: 1257 },
  { n: 10, contestId: 2050, contestName: "Codeforces Round 991 (Div. 3)", handle: "hsn8086", rank: 1337, date: "2024-12-05", delta: 88, rating: 1345 },
  { n: 11, contestId: 2040, contestName: "Codeforces Round 992 (Div. 2)", handle: "hsn8086", rank: 3845, date: "2024-12-08", delta: 1, rating: 1346 },
  { n: 12, contestId: 2044, contestName: "Codeforces Round 993 (Div. 4)", handle: "hsn8086", rank: 3957, date: "2024-12-15", delta: -8, rating: 1338 },
  { n: 13, contestId: 2065, contestName: "Codeforces Round 1003 (Div. 4)", handle: "hsn8086", rank: 1005, date: "2025-02-09", delta: 89, rating: 1427 },
  { n: 14, contestId: 2078, contestName: "Codeforces Round 1008 (Div. 2)", handle: "hsn8086", rank: 4752, date: "2025-03-10", delta: -30, rating: 1397 },
  { n: 15, contestId: 2074, contestName: "Codeforces Round 1009 (Div. 3)", handle: "hsn8086", rank: 901, date: "2025-03-11", delta: 79, rating: 1476 },
  { n: 16, contestId: 2086, contestName: "Educational Codeforces Round 177 (Rated for Div. 2)", handle: "hsn8086", rank: 7084, date: "2025-04-03", delta: -44, rating: 1432 },
  { n: 17, contestId: 2084, contestName: "Teza Round 1 (Codeforces Round 1015, Div. 1 + Div. 2)", handle: "hsn8086", rank: 3028, date: "2025-04-05", delta: 27, rating: 1459 },
  { n: 18, contestId: 2093, contestName: "Codeforces Round 1016 (Div. 3)", handle: "hsn8086", rank: 1523, date: "2025-04-08", delta: 27, rating: 1486 },
  { n: 19, contestId: 2094, contestName: "Codeforces Round 1017 (Div. 4)", handle: "small-hsn", rank: 8435, date: "2025-04-13", delta: -101, rating: 1385 },
  { n: 20, contestId: 2103, contestName: "Codeforces Round 1019 (Div. 2)", handle: "small-hsn", rank: 1665, date: "2025-04-21", delta: 75, rating: 1460 },
  { n: 21, contestId: 2106, contestName: "Codeforces Round 1020 (Div. 3)", handle: "hsn8086", rank: 614, date: "2025-04-24", delta: 67, rating: 1527 },
  { n: 22, contestId: 2117, contestName: "Codeforces Round 1029 (Div. 3)", handle: "small-hsn", rank: 2224, date: "2025-06-08", delta: -13, rating: 1514 },
  { n: 23, contestId: 2125, contestName: "Educational Codeforces Round 181 (Rated for Div. 2)", handle: "small-hsn", rank: 4745, date: "2025-07-22", delta: -31, rating: 1483 },
  { n: 24, contestId: 2133, contestName: "Codeforces Round 1044 (Div. 2)", handle: "small-hsn", rank: 8701, date: "2025-08-24", delta: -80, rating: 1403 },
  { n: 25, contestId: 2136, contestName: "Codeforces Round 1046 (Div. 2)", handle: "small-hsn", rank: 5904, date: "2025-08-28", delta: -46, rating: 1357 },
  { n: 26, contestId: 2140, contestName: "Codeforces Round 1049 (Div. 2)", handle: "small-hsn", rank: 2917, date: "2025-09-09", delta: 46, rating: 1403 },
  { n: 27, contestId: 2149, contestName: "Codeforces Round 1054 (Div. 3)", handle: "small-hsn", rank: 3208, date: "2025-09-25", delta: -12, rating: 1391 },
  { n: 28, contestId: 2167, contestName: "Codeforces Round 1062 (Div. 4)", handle: "big-hsn", rank: 862, date: "2025-10-28", delta: 79, rating: 1470 },
  { n: 29, contestId: 2170, contestName: "Educational Codeforces Round 185 (Rated for Div. 2)", handle: "small-hsn", rank: 2279, date: "2025-11-28", delta: 18, rating: 1488 },
  { n: 30, contestId: 2158, contestName: "Codeforces Round 1067 (Div. 2)", handle: "small-hsn", rank: 978, date: "2025-11-29", delta: 81, rating: 1569 },
  { n: 31, contestId: 2173, contestName: "Codeforces Round 1068 (Div. 2)", handle: "small-hsn", rank: 1140, date: "2025-12-05", delta: 47, rating: 1616 },
  { n: 32, contestId: 2176, contestName: "Codeforces Round 1070 (Div. 2)", handle: "small-hsn", rank: 1193, date: "2025-12-11", delta: 39, rating: 1655 },
  { n: 33, contestId: 2209, contestName: "Codeforces Round 1087 (Div. 2)", handle: "big-hsn", rank: 1223, date: "2026-03-21", delta: 26, rating: 1681 },
  { n: 34, contestId: 2258, contestName: "Codeforces Round 1118 (Div. 2)", handle: "big-hsn", rank: 5501, date: "2026-08-29", delta: -109, rating: 1572 },
];

export const defaultData = (): CfData => ({
  handlesInput: DEMO_HANDLES.join('\n'),
  title: '虚拟账号',
  theme: 'light',
  showRecent: true,
  showSources: true,
  watermark: { show: true },
  result: { handles: DEMO_HANDLES, points: DEMO_POINTS, fetchedAt: 0 },
});
