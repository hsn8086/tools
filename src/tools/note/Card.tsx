import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { QrCode } from './QrCode';
import { cardHeight, imageUrl, qrUrl, type NoteData } from './model';

export function NoteCard({ data }: { data: NoteData }) {
  const box = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const container = box.current;
    const content = text.current;
    if (!container || !content) return;
    let active = true;
    const fit = () => {
      if (!active) return;
      const fits = () => content.scrollHeight <= container.clientHeight && content.scrollWidth <= container.clientWidth;
      content.style.fontSize = `${data.fontSize}px`;
      if (fits()) return;
      // Search the actual rendered size, including explicit newlines and fallback fonts.
      let low = 0.1;
      let high = data.fontSize;
      for (let i = 0; i < 12; i++) {
        const mid = (low + high) / 2;
        content.style.fontSize = `${mid}px`;
        if (fits()) low = mid;
        else high = mid;
      }
      content.style.fontSize = `${low}px`;
    };
    fit();
    void document.fonts.ready.then(fit);
    const observer = new ResizeObserver(fit);
    observer.observe(container);
    return () => { active = false; observer.disconnect(); };
  }, [data]);

  return (
    <article className="zh note" data-template={data.template} data-font={data.font}
      style={{ height: cardHeight(data.ratio), '--accent': data.accent, textAlign: data.align } as CSSProperties}>
      {data.template === 'postcard' && <img className="note-photo" src="/assets/note/lake.jpg" alt="" />}
      <div className="note-layout">
        <header className="note-heading"><span>{data.label}</span><span className="note-number" aria-hidden="true">{data.template === 'terminal' ? '[01]' : '01 /'}</span></header>
        <div className="note-body" ref={box}><div className="note-text" ref={text}>{data.text || '写下一点想法'}</div></div>
        <div className="note-signature">{data.signature}</div>
        {data.watermark.show && <footer className="note-credit" data-mode={data.watermark.mode}>
          <div className="note-credit-copy">
            {data.watermark.mode === 'invite' && <strong>{data.watermark.qr ? '扫码做同款' : '做一张同款'} <span aria-hidden="true">↗</span></strong>}
            <span>{imageUrl(data)}</span>
          </div>
          {data.watermark.qr && <QrCode url={qrUrl(data)} />}
        </footer>}
      </div>
    </article>
  );
}
