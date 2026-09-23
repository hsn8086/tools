import { Fragment, type ReactNode } from 'react';
import type { TGData, TGItem } from './types';
import { attrsOf, clockOf, isBareEmoji, nameColor, parseScript } from './script';

/** @某人 和 http 链接上色，跟 TG 一致。@[带空格的名字] 也认 */
function inline(text: string): ReactNode {
  const re = /@\[([^\]]+)\]|(@[^\s@]{1,20})|(https?:\/\/\S+)/g;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) out.push(<span className="at" key={k++}>@{m[1]}</span>);
    else if (m[2]) out.push(<span className="at" key={k++}>{m[2]}</span>);
    else out.push(<a className="lnk" key={k++}>{m[3]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const Dot = ({ c }: { c: string }) => <i className="dot" style={{ background: c }} />;

const IconSearch = () => (
  <svg className="hicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5 21 21" />
  </svg>
);

const IconPhone = () => (
  <svg className="hicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.6 3.2c.7-.2 1.6 0 2 .7l2 3.2c.4.6.3 1.5-.3 2l-1.3 1c.9 1.8 2.2 3.1 4 4l1-1.3c.5-.6 1.4-.7 2-.3l3.2 2c.7.4.9 1.3.7 2-.4 1.3-1.6 2.3-3 2.5-1 .1-2.1-.2-3-.7a17.6 17.6 0 0 1-5.4-5.4c-.5-.9-.8-2-.7-3 .2-1.4 1.2-2.6 2.5-3Z" />
  </svg>
);

const IconMenu = () => (
  <svg className="hicon" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="12" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="19" cy="12" r="1.7" />
  </svg>
);

const IconClip = () => (
  <svg className="iicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 11.8-7.4 7.4a4.2 4.2 0 0 1-6-6l8-8a2.8 2.8 0 0 1 4 4l-7.4 7.4a1.4 1.4 0 0 1-2-2l6.8-6.8" />
  </svg>
);

const IconSmile = () => (
  <svg className="iicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M8.3 14.2a5 5 0 0 0 7.4 0" />
    <circle cx="9" cy="9.6" r=".9" fill="currentColor" stroke="none" />
    <circle cx="15" cy="9.6" r=".9" fill="currentColor" stroke="none" />
  </svg>
);

const IconMic = () => (
  <svg className="iicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
  </svg>
);

const IconPlay = () => (
  <svg className="vplay-ic" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.5 5.8v12.4c0 .8.9 1.3 1.6.9l9.6-6.2c.6-.4.6-1.3 0-1.7L10.1 5c-.7-.4-1.6.1-1.6.8Z" />
  </svg>
);

const Check = ({ read }: { read: TGData['readState'] }) =>
  read === 'none' ? null : read === 'read' ? (
    <svg className="tick" viewBox="0 0 22 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m1.5 8.5 3.5 3.5L13 4M9 11.5l3.5 3.5L20.5 4" />
    </svg>
  ) : (
    <svg className="tick" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 8.8 4 4L14.5 4" />
    </svg>
  );

/** 语音条的假波形：按消息 id 散列出一串柱高，同一消息每次画出来都一样 */
function wave(id: string): number[] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) >>> 0;
  return Array.from({ length: 34 }, (_, i) => {
    h = (h * 1103515245 + 12345) >>> 0;
    // 两头低中间高，像真的录音
    const env = Math.sin((i / 33) * Math.PI) * 0.8 + 0.2;
    return Math.round(((h % 100) / 100) * env * 22 + 3);
  });
}

/** TG 默认头像：名字首字母 + 按名字挑的渐变底色 */
function LetterAvatar({ name }: { name: string }) {
  return (
    <span className="lava" style={{ background: nameColor(name) }}>
      {(name.trim()[0] ?? '?').toUpperCase()}
    </span>
  );
}

export function TGCard({ data, theme }: { data: TGData; theme: 'light' | 'dark' }) {
  const items = parseScript(data.script);
  const times = clockOf(items, data.clock);
  const img = (id?: string) => data.images.find((x) => x.id === id)?.src;
  const self = (name: string) => attrsOf(data, name).self;

  const meta = (it: Extract<TGItem, { kind: 'msg' }>) => (
    <span className="mt">
      {times.get(it.id)}
      {self(it.name) && <Check read={data.readState} />}
    </span>
  );

  const quote = (it: Extract<TGItem, { kind: 'msg' }>, out: boolean) =>
    it.replyTo ? (
      <div className="reply">
        <i className="rbar" style={out ? undefined : { background: nameColor(it.replyTo!.name) }} />
        <div className="rbody">
          <div className="rname" style={out ? undefined : { color: nameColor(it.replyTo!.name) }}>
            {it.replyTo.name}
          </div>
          <div className="rtext">{it.replyTo.text}</div>
        </div>
      </div>
    ) : null;

  return (
    <div className="tg" data-theme={theme}>
      {data.chrome.show && (
        <div className="titlebar">
          <div className="dots">
            <Dot c="#fe5f57" />
            <Dot c="#febc2e" />
            <Dot c="#28c840" />
          </div>
          <span className="wtitle">{data.chrome.title}</span>
        </div>
      )}

      {data.peer.show && (
        <div className="chat-head">
          {data.peer.avatar ? <img className="pava" src={data.peer.avatar} alt="" /> : <LetterAvatar name={data.peer.name} />}
          <div className="pinfo">
            <div className="pname">{data.peer.name}</div>
            <div className="psub" data-online={data.peer.online || undefined}>
              {data.peer.online ? 'online' : data.peer.subtitle}
            </div>
          </div>
          <div className="hicons">
            <IconSearch />
            <IconPhone />
            <IconMenu />
          </div>
        </div>
      )}

      <div className="list">
        {items.map((it) => {
          if (it.kind === 'date')
            return (
              <div className="dsep" key={it.id}>
                <span>{it.text}</span>
              </div>
            );
          if (it.kind === 'sys')
            return (
              <div className="sysline" key={it.id}>
                {it.text}
              </div>
            );
          if (it.kind === 'clock') return null;

          const out = self(it.name);
          const src = img(it.imageId);
          const bare = !it.voice && !src && isBareEmoji(it.text);

          return (
            <Fragment key={it.id}>
              <div className="msg" data-self={out || undefined}>
                <div className="col">
                  {data.group && !out && it.name ? (
                    <div className="sender" style={{ color: nameColor(it.name) }}>
                      {it.name}
                    </div>
                  ) : null}

                  {src ? (
                    <div className="media" data-self={out || undefined}>
                      <img className="pic" src={src} alt="" />
                      {it.text ? <div className="cap">{inline(it.text)}{meta(it)}</div> : <span className="mt mt-media">{times.get(it.id)}{self(it.name) && <Check read={data.readState} />}</span>}
                    </div>
                  ) : it.voice ? (
                    <div className="bubble vbubble">
                      {quote(it, out)}
                      {it.forward ? <div className="fwd">Forwarded from: <span className="fwd-name">{it.forward}</span></div> : null}
                      <div className="vline">
                        <span className="vplay">
                          <IconPlay />
                        </span>
                        <span className="vwave">
                          {wave(it.id).map((h, i) => (
                            <i key={i} style={{ height: h }} />
                          ))}
                        </span>
                        <span className="vdur">{it.voice}</span>
                        {meta(it)}
                      </div>
                    </div>
                  ) : bare ? (
                    <span className="bemoji">
                      {it.text}
                      {meta(it)}
                    </span>
                  ) : (
                    <div className="bubble">
                      {quote(it, out)}
                      {it.forward ? <div className="fwd">Forwarded from: <span className="fwd-name">{it.forward}</span></div> : null}
                      {inline(it.text)}
                      {meta(it)}
                    </div>
                  )}

                  {it.reactions?.length ? (
                    <div className="reacts">
                      {it.reactions.map((r, i) => (
                        <span className="react" key={i}>
                          <span className="react-emoji">{r.emoji}</span>
                          {r.count}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>

      {data.inputBar && (
        <div className="inputbar">
          <IconClip />
          <span className="ph">Write a message...</span>
          <IconSmile />
          <IconMic />
        </div>
      )}
      {data.watermark.show && <div className="watermark">{data.watermark.text}</div>}
    </div>
  );
}
