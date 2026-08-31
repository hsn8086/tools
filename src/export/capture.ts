import { toCanvas } from 'html-to-image';
import type { BaojiangRequest, BaojiangResponse } from './baojiang.worker';
import { baojiang } from './baojiang';

/** 卡片渲染在 shadow root 里，这里取出真正要截的那个节点 */
export function cardNode(host: HTMLElement): HTMLElement {
  const inner = host.shadowRoot?.querySelector<HTMLElement>('.zh');
  return inner ?? host;
}

/** 等字体和图片都就绪，否则会截到 fallback 字体或空图 */
async function ready(node: HTMLElement) {
  await document.fonts.ready;
  const imgs = Array.from(node.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.addEventListener('load', () => res(), { once: true });
            img.addEventListener('error', () => res(), { once: true });
          }),
    ),
  );
}

/** 页面切到后台时 Chrome 会挂起 SVG 解码，html-to-image 会永久 pending —— 给个明确的失败 */
function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) =>
      setTimeout(() => rej(new Error(`${what}超时（${ms}ms）。页面在后台时浏览器会暂停渲染，回到本页再试。`)), ms),
    ),
  ]);
}

export async function captureCanvas(host: HTMLElement, pixelRatio: number): Promise<HTMLCanvasElement> {
  const node = cardNode(host);
  await ready(node);
  return withTimeout(
    toCanvas(node, {
      pixelRatio,
      cacheBust: false,
      skipAutoScale: true,
      backgroundColor: getComputedStyle(node).backgroundColor,
    }),
    15_000,
    '截图',
  );
}

// ---- 包浆 worker（单例，后发先至：只保留最新一次请求的结果） ----

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, { resolve: (b: Blob) => void; reject: (e: unknown) => void }>();

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') return null;
  if (!worker) {
    worker = new Worker(new URL('./baojiang.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<BaojiangResponse>) => {
      const p = pending.get(e.data.id);
      if (!p) return;
      pending.delete(e.data.id);
      e.data.blob ? p.resolve(e.data.blob) : p.reject(new Error(e.data.error));
    };
  }
  return worker;
}

function runBaojiang(bitmap: ImageBitmap, level: number): Promise<Blob> {
  const w = getWorker();
  if (!w) return baojiang(bitmap, level).then((r) => r.blob);
  const id = ++seq;
  return new Promise<Blob>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ id, bitmap, level } satisfies BaojiangRequest, [bitmap]);
  });
}

export interface RenderOptions {
  /** 导出倍率，2 → 750px 宽 */
  pixelRatio: number;
  /** 包浆强度 0–100，0 为原图 */
  level: number;
  /** level 为 0 时的输出格式；有包浆时强制 jpeg */
  format: 'png' | 'jpeg';
}

export interface RenderResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

export async function renderCard(host: HTMLElement, opts: RenderOptions): Promise<RenderResult> {
  const canvas = await captureCanvas(host, opts.pixelRatio);
  const { width, height } = canvas;

  if (opts.level <= 0) {
    const blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob(
        (b) => (b ? res(b) : rej(new Error('toBlob failed'))),
        opts.format === 'jpeg' ? 'image/jpeg' : 'image/png',
        0.94,
      ),
    );
    return { blob, url: URL.createObjectURL(blob), width, height };
  }

  const bitmap = await createImageBitmap(canvas);
  const blob = await runBaojiang(bitmap, opts.level);
  return { blob, url: URL.createObjectURL(blob), width, height };
}
