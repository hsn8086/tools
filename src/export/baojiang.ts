/**
 * 包浆：模拟图片被反复截图、转发、重压缩后的画质衰减。
 * 只暴露一个 0–100 的 level，内部是一条固定管线：
 *   缩到一个"转发链宽度" → 多轮低质量 JPEG 重编码 → 放大回原尺寸 → 再压一次。
 *
 * 关键设计：管线中间那个宽度是**绝对值**（约 380px），不随导出倍率变化。
 * 否则 1x 预览和 3x 导出的糊法完全不同，滑块就没法所见即所得。
 */

export type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;

const hasOffscreen = typeof OffscreenCanvas !== 'undefined';

/** 包浆链路中间级的宽度：level 越高，越接近这个"被压烂"的尺寸 */
const CHAIN_WIDTH = 380;

function makeCanvas(w: number, h: number): AnyCanvas {
  if (hasOffscreen) return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function ctx2d(c: AnyCanvas): CanvasRenderingContext2D {
  const g = (c as HTMLCanvasElement).getContext('2d', { alpha: false });
  if (!g) throw new Error('2d context unavailable');
  return g as CanvasRenderingContext2D;
}

function toJpeg(c: AnyCanvas, quality: number): Promise<Blob> {
  if ('convertToBlob' in c) return c.convertToBlob({ type: 'image/jpeg', quality });
  return new Promise((res, rej) =>
    (c as HTMLCanvasElement).toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/jpeg', quality),
  );
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export interface BaojiangResult {
  blob: Blob;
  width: number;
  height: number;
}

/** 预设：本质就是 level 的几个书签 */
export const BAOJIANG_PRESETS = [
  { key: 'none', label: '原图', level: 0 },
  { key: 'light', label: '轻微', level: 25 },
  { key: 'medium', label: '中度', level: 55 },
  { key: 'heavy', label: '重度', level: 85 },
] as const;

export async function baojiang(source: ImageBitmap, level: number): Promise<BaojiangResult> {
  const w = source.width;
  const h = source.height;
  const t = clamp(level, 0, 100) / 100;

  const out = makeCanvas(w, h);
  const gOut = ctx2d(out);

  if (t === 0) {
    gOut.drawImage(source, 0, 0);
    return { blob: await toJpeg(out, 0.94), width: w, height: h };
  }

  // 1. 缩到转发链宽度（level 越高缩得越狠，但下限是绝对像素，与导出倍率无关）
  const chainW = Math.round(clamp(lerp(w, Math.min(w, CHAIN_WIDTH), t), 120, w));
  const chainH = Math.max(1, Math.round((chainW / w) * h));
  const small = makeCanvas(chainW, chainH);
  const gs = ctx2d(small);
  const scratch = makeCanvas(chainW, chainH);
  const gx = ctx2d(scratch);
  gs.imageSmoothingQuality = 'medium';
  gs.drawImage(source, 0, 0, chainW, chainH);

  // 2. 在小尺寸上反复"转发"：色彩漂移 + 低质量 JPEG，块效应和色带都在这一步累积
  const rounds = 1 + Math.round(t * 3); // 1–4 轮
  let frame: ImageBitmap | null = null;

  for (let r = 0; r < rounds; r++) {
    const p = (r + 1) / rounds;

    if (frame) {
      gs.filter = 'none';
      gs.drawImage(frame, 0, 0, chainW, chainH);
      frame.close?.();
      frame = null;
    }

    // 每轮加一点点色彩漂移：饱和上升、整体偏暖偏绿，是微信/QQ 转发链的典型走样
    // （过一道 scratch，避免 canvas 自绘）
    gx.filter = `saturate(${1 + 0.09 * t}) brightness(${1 + 0.012 * t}) hue-rotate(${1.2 * t}deg)`;
    gx.drawImage(small as CanvasImageSource, 0, 0);
    gx.filter = 'none';
    gs.drawImage(scratch as CanvasImageSource, 0, 0);

    // 末轮加噪点，让后续放大产生"脏"的颗粒感
    if (t > 0.45 && r === rounds - 1) {
      const amp = 14 * (t - 0.45);
      const img = gs.getImageData(0, 0, chainW, chainH);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = (Math.random() - 0.5) * amp;
        d[i] = clamp(d[i] + n, 0, 255);
        d[i + 1] = clamp(d[i + 1] + n * 0.8, 0, 255);
        d[i + 2] = clamp(d[i + 2] + n * 1.2, 0, 255);
      }
      gs.putImageData(img, 0, 0);
    }

    const q = clamp(lerp(0.5, 0.11, t * p), 0.08, 0.92);
    frame = await createImageBitmap(await toJpeg(small, q));
  }

  // 3. 放大回原尺寸 —— 模糊、振铃、块边缘都是在这一步被"拉开"给人看的
  gOut.imageSmoothingQuality = 'low';
  gOut.filter = `contrast(${1 + 0.04 * t})`;
  gOut.drawImage(frame!, 0, 0, w, h);
  gOut.filter = 'none';
  frame!.close?.();

  // 4. 最后再压一道，收掉放大产生的平滑感
  const finalQ = clamp(lerp(0.85, 0.3, t), 0.25, 0.92);
  return { blob: await toJpeg(out, finalQ), width: w, height: h };
}
