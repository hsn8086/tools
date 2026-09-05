import { lazy } from 'react';
import type { ToolMeta } from '../../registry';
import { toolInfo } from '../../site';

export const meta: ToolMeta = {
  ...toolInfo['cf-merge'],
  Component: lazy(() => import('./Editor').then((m) => ({ default: m.CfEditor }))),
};
