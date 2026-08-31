import type { Block, ZhihuContent } from './types';

/** 正文里的图片占位标记，独占一行 */
export const IMG_MARK = (id: string) => `![${id}]`;
const IMG_RE = /^!\[([A-Za-z0-9_-]+)\]$/;

/**
 * 一长条文本 → 渲染用的块序列。
 * 空行只当作视觉留白丢掉；知乎的段间距由样式给，不靠空行。
 */
export function deriveBlocks(content: ZhihuContent): Block[] {
  const byId = new Map(content.images.map((im) => [im.id, im]));
  const out: Block[] = [];

  content.text.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;

    const m = IMG_RE.exec(line);
    if (m) {
      const im = byId.get(m[1]);
      // 标记指向的图片被删了，这一行就当不存在
      if (im) out.push({ id: `i-${im.id}`, type: 'image', src: im.src, fit: im.fit });
      return;
    }
    out.push({ id: `t-${i}`, type: 'text', text: line });
  });

  return out;
}

/** 正文里还在用的图片 id */
export function usedImageIds(text: string): Set<string> {
  const set = new Set<string>();
  for (const raw of text.split('\n')) {
    const m = IMG_RE.exec(raw.trim());
    if (m) set.add(m[1]);
  }
  return set;
}
