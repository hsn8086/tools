export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** 剪贴板只认 PNG，JPEG 要先转一道 */
export async function copyBlob(blob: Blob): Promise<void> {
  if (!('clipboard' in navigator) || !('write' in navigator.clipboard)) throw new Error('剪贴板不可用');

  let png = blob;
  if (blob.type !== 'image/png') {
    const bmp = await createImageBitmap(blob);
    const c = document.createElement('canvas');
    c.width = bmp.width;
    c.height = bmp.height;
    c.getContext('2d')!.drawImage(bmp, 0, 0);
    bmp.close?.();
    png = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('转 PNG 失败'))), 'image/png'));
  }
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
}

export function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
