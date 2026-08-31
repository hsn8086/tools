import { baojiang } from './baojiang';

export interface BaojiangRequest {
  id: number;
  bitmap: ImageBitmap;
  level: number;
}

export interface BaojiangResponse {
  id: number;
  blob?: Blob;
  error?: string;
}

self.onmessage = async (e: MessageEvent<BaojiangRequest>) => {
  const { id, bitmap, level } = e.data;
  try {
    const { blob } = await baojiang(bitmap, level);
    (self as unknown as Worker).postMessage({ id, blob } satisfies BaojiangResponse);
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, error: String(err) } satisfies BaojiangResponse);
  } finally {
    bitmap.close?.();
  }
};
