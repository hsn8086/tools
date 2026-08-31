import type { ComponentType } from 'react';

export interface ToolMeta {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  Component: ComponentType;
}

/** 加新工具：建 src/tools/<id>/meta.ts 并 export const meta，这里自动收录 */
const modules = import.meta.glob<{ meta: ToolMeta }>('./tools/*/meta.ts', { eager: true });

export const tools: ToolMeta[] = Object.values(modules).map((m) => m.meta);

export const findTool = (id: string) => tools.find((t) => t.id === id);
