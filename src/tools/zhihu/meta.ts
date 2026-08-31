import { lazy } from 'react';
import type { ToolMeta } from '../../registry';

export const meta: ToolMeta = {
  id: 'zhihu',
  name: '知乎生成器',
  emoji: '💭',
  desc: '自定义问题、回答、头像和昵称，一键生成知乎风格截图',
  Component: lazy(() => import('./Editor').then((m) => ({ default: m.ZhihuEditor }))),
};
