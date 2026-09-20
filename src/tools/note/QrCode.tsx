import { useMemo } from 'react';
import QRCode from 'qrcode';

/** Synchronous SVG: present in the same render as the template, including during export. */
export function QrCode({ url }: { url: string }) {
  const { path, size } = useMemo(() => {
    const { modules } = QRCode.create(url, { errorCorrectionLevel: 'L' });
    const cells: string[] = [];
    for (let y = 0; y < modules.size; y++) {
      for (let x = 0; x < modules.size; x++) {
        if (modules.get(y, x)) cells.push(`M${x + 4} ${y + 4}h1v1h-1z`);
      }
    }
    // Keep four clear modules around the code; the card supplies the background.
    return { path: cells.join(''), size: modules.size + 8 };
  }, [url]);
  return <svg className="note-qr" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="扫码制作同款便签"
    width={56} height={56} viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges">
    <path d={path} fill="currentColor" />
  </svg>;
}
