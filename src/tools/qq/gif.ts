/**
 * GIF 抽帧。
 *
 * 截图里的 GIF 是死的：导出时抓到第几帧全看运气，同一张图导两次
 * 可能不一样。所以让用户自己选一帧，定格成 PNG 再去渲染和导出。
 *
 * 用 WebCodecs 的 ImageDecoder —— 浏览器自带的解码器，不用背一个
 * gif 解析库。Safari 17 以下没有，那就退回原图（还是会动，但不至于崩）。
 */

export const canDecodeGif = () => typeof (globalThis as { ImageDecoder?: unknown }).ImageDecoder === 'function';

interface DecoderLike {
  completed: Promise<void>;
  tracks: { ready: Promise<void>; selectedTrack?: { frameCount: number } };
  decode(init: { frameIndex: number }): Promise<{ image: CanvasImageSource & { close?: () => void } }>;
  close(): void;
}

async function open(dataUrl: string): Promise<DecoderLike> {
  const blob = await (await fetch(dataUrl)).blob();
  const Ctor = (globalThis as unknown as { ImageDecoder: new (init: unknown) => DecoderLike }).ImageDecoder;
  const dec = new Ctor({ data: await blob.arrayBuffer(), type: blob.type || 'image/gif' });
  // 两个都要等：completed 是数据收全，tracks.ready 才是能读到 frameCount
  await Promise.all([dec.completed, dec.tracks.ready]);
  return dec;
}

/** 帧数。拿不到就当 1 帧（当静态图处理） */
export async function frameCount(dataUrl: string): Promise<number> {
  if (!canDecodeGif()) return 1;
  try {
    const dec = await open(dataUrl);
    const n = dec.tracks.selectedTrack?.frameCount ?? 1;
    dec.close();
    return n;
  } catch {
    return 1;
  }
}

/** 把第 index 帧画成 PNG data URL */
export async function frameToPng(dataUrl: string, index: number): Promise<string | null> {
  if (!canDecodeGif()) return null;
  try {
    const dec = await open(dataUrl);
    const total = dec.tracks.selectedTrack?.frameCount ?? 1;
    const { image } = await dec.decode({ frameIndex: Math.min(Math.max(index, 0), total - 1) });
    const w = (image as { displayWidth?: number; width?: number }).displayWidth ?? (image as { width: number }).width;
    const h =
      (image as { displayHeight?: number; height?: number }).displayHeight ?? (image as { height: number }).height;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')?.drawImage(image, 0, 0);
    image.close?.();
    dec.close();
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}
