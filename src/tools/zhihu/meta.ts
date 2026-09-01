import { lazy } from 'react';
import type { ToolMeta } from '../../registry';

export const meta: ToolMeta = {
  id: 'zhihu',
  name: '知乎生成器',
  emoji: '💭',
  desc: '自定义问答、认证与排版，生成知乎卡片截图',
  Component: lazy(() => import('./Editor').then((m) => ({ default: m.ZhihuEditor }))),
};
