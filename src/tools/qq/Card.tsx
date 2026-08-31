import { type ReactNode } from 'react';
import type { QQData } from './types';
import { parseScript } from './script';
import { StatusBar } from '../../ui/StatusBar';

/** 行内语法：@某人 和 http 链接自动上色，和 QQ 一致 */
function inline(text: string): ReactNode {
  const re = /(@[^\s@]{1,20})|(https?:\/\/\S+)/g;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<span className="at" key={k++}>{m[1]}</span>);
    else out.push(<a className="lnk" key={k++}>{m[2]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const BackArrow = () => (
  <svg className="back" viewBox="0 0 11 19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 1.5 1.5 9.5l8 8" />
  </svg>
);

export function QQCard({ data, theme }: { data: QQData; theme: 'light' | 'dark' }) {
  const items = parseScript(data.script);
  const person = (name: string) => data.people.find((p) => p.name === name);
  const image = (id?: string) => (id ? data.images.find((i) => i.id === id)?.src : undefined);
  const sb = data.statusBar;

  return (
    <div className="qq" data-theme={theme}>
      {sb.show && <StatusBar time={sb.time} battery={sb.battery} island={sb.island} />}

      {data.header.show && (
        <div className="header">
          <BackArrow />
          <div className="title">{data.header.title}</div>
          {data.header.subtitle && <div className="subtitle">{data.header.subtitle}</div>}
        </div>
      )}

      <div className="list">
        {items.map((it) => {
          if (it.kind === 'time') return <div className="tsep" key={it.id}>{it.text}</div>;

          const p = person(it.name);
          const src = image(it.imageId);
          return (
            <div className="msg" data-self={p?.self ? 'true' : undefined} key={it.id}>
              <img className="avatar" src={p?.avatar} alt="" crossOrigin="anonymous" />
              <div className="col">
                {!p?.self && it.name && <div className="name">{it.name}</div>}
                {src ? (
                  <img className="pic" src={src} alt="" crossOrigin="anonymous" />
                ) : (
                  <div className="bubble">{inline(it.text)}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {data.watermark.show && <div className="watermark">{data.watermark.text}</div>}
    </div>
  );
}
