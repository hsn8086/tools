import { lazy } from 'react';
import type { ToolMeta } from '../../registry';

export const meta: ToolMeta = {
  id: 'cf-merge',
  name: 'Codeforces 合并战绩',
  emoji: '📈',
  desc: '把几个号的 rated 场次按时间合并，重算 rating 曲线',
  Component: lazy(() => import('./Editor').then((m) => ({ default: m.CfEditor }))),
};
