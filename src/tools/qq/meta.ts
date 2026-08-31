import { lazy } from 'react';
import type { ToolMeta } from '../../registry';

export const meta: ToolMeta = {
  id: 'qq',
  name: 'QQ 聊天记录生成器',
  emoji: '💬',
  desc: '写成剧本，直接渲染成 iOS QQ 风格的聊天截图',
  Component: lazy(() => import('./Editor').then((m) => ({ default: m.QQEditor }))),
};
