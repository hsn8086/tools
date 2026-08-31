import { type ReactNode } from 'react';
import type { QQData } from './types';
import { DEFAULT_AVATAR } from './defaults';
import { attrsOf, parseScript } from './script';
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

const Back = () => (
  <svg className="back" viewBox="0 0 11 19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 1.5 1.5 9.5l8 8" />
  </svg>
);

const Menu = () => (
  <svg className="menu" viewBox="0 0 22 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M1 1h20M1 8h20M1 15h20" />
  </svg>
);

const InputBar = () => (
  <div className="inputbar">
    <svg width="20" height="24" viewBox="0 0 20 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="6.2" y="1.8" width="7.6" height="12" rx="3.8" />
      <path d="M3 11.5a7 7 0 0 0 14 0M10 18.5v3.2" />
    </svg>
    <div className="box" />
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="10" />
      <path d="M8.2 14.4a4.6 4.6 0 0 0 7.6 0" strokeLinecap="round" />
      <circle cx="8.8" cy="9.6" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.2" cy="9.6" r="1.15" fill="currentColor" stroke="none" />
    </svg>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7.4v9.2M7.4 12h9.2" />
    </svg>
  </div>
);

export function QQCard({ data, theme }: { data: QQData; theme: 'light' | 'dark' }) {
  const items = parseScript(data.script);
  const person = (name: string) => attrsOf(data, name, DEFAULT_AVATAR);
  const image = (id?: string) => (id ? data.images.find((i) => i.id === id)?.src : undefined);
  const sb = data.statusBar;

  return (
    <div className="qq" data-theme={theme}>
      {sb.show && <StatusBar time={sb.time} battery={sb.battery} island={sb.island} />}

      {data.header.show && (
        <div className="header">
          <Back />
          {data.header.unread.trim() && <span className="unread">{data.header.unread}</span>}
          <div className="title">{data.header.title}</div>
          <Menu />
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
                {it.name && (
                  <div className="name">
                    {p?.title?.trim() && (
                      <span className="tag" data-kind={p.title.trim() === '群主' ? 'owner' : undefined}>
                        {p.title.trim()}
                      </span>
                    )}
                    <span className="who">{it.name}</span>
                  </div>
                )}
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

      {data.inputBar && <InputBar />}
      {data.watermark.show && <div className="watermark">{data.watermark.text}</div>}
    </div>
  );
}
