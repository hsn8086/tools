import { Fragment, type ReactNode } from 'react';
import type { TGData, TGItem } from './types';
import { attrsOf, clockOf, isBareEmoji, nameColor, parseScript } from './script';
import { tgIcons } from './icons';

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

type Theme = 'light' | 'dark';
const ic = (set: { dark: string; light: string }, theme: Theme) => set[theme];

const HIcon = ({ src, alt }: { src: string; alt: string }) => (
  <img className="hicon" src={src} alt={alt} draggable={false} />
);
const IIcon = ({ src, alt }: { src: string; alt: string }) => (
  <img className="iicon" src={src} alt={alt} draggable={false} />
);

/** 消息右下角的勾：单勾已送达，双勾已读。图标是 TG 官方 PNG 的染色版 */
const Check = ({ read, variant, theme }: { read: TGData['readState']; variant: 'bubble' | 'accent' | 'overlay'; theme: Theme }) => {
  if (read === 'none') return null;
  const set = read === 'read' ? tgIcons.check2 : tgIcons.check1;
  const src =
    variant === 'overlay'
      ? set.overlay
      : variant === 'accent'
        ? ic({ dark: set.accentDark, light: set.accentLight }, theme)
        : ic({ dark: set.bubbleDark, light: set.bubbleLight }, theme);
  return <img className="tick" src={src} alt="" draggable={false} />;
};

const IconPlay = () => (
  <svg className="vplay-ic" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.5 5.8v12.4c0 .8.9 1.3 1.6.9l9.6-6.2c.6-.4.6-1.3 0-1.7L10.1 5c-.7-.4-1.6.1-1.6.8Z" />
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
function LetterAvatar({ name, theme }: { name: string; theme: Theme }) {
  return (
    <span className="lava" style={{ background: nameColor(name, theme) }}>
      {(name.trim()[0] ?? '?').toUpperCase()}
    </span>
  );
}

export function TGCard({ data, theme }: { data: TGData; theme: 'light' | 'dark' }) {
  const items = parseScript(data.script);
  const times = clockOf(items, data.clock);
  const img = (id?: string) => data.images.find((x) => x.id === id)?.src;
  const self = (name: string) => attrsOf(data, name).self;

  const meta = (it: Extract<TGItem, { kind: 'msg' }>, variant: 'bubble' | 'accent' | 'overlay') => (
    <span className="mt">
      {times.get(it.id)}
      {self(it.name) && <Check read={data.readState} variant={variant} theme={theme} />}
    </span>
  );

  const quote = (it: Extract<TGItem, { kind: 'msg' }>, out: boolean) =>
    it.replyTo ? (
      <div className="reply">
        <i
          className="rbar"
          style={{ background: out ? undefined : nameColor(it.replyTo.name, theme) }}
        />
        <div className="rbody">
          <div
            className="rname"
            style={{ color: out ? undefined : nameColor(it.replyTo.name, theme) }}
          >
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
          {data.peer.avatar ? (
            <img className="pava" src={data.peer.avatar} alt="" />
          ) : (
            <LetterAvatar name={data.peer.name} theme={theme} />
          )}
          <div className="pinfo">
            <div className="pname">{data.peer.name}</div>
            <div className="psub" data-online={data.peer.online || undefined}>
              {data.peer.online ? 'online' : data.peer.subtitle}
            </div>
          </div>
          <div className="hicons">
            <HIcon src={ic(tgIcons.search, theme)} alt="search" />
            <HIcon src={ic(tgIcons.call, theme)} alt="call" />
            <HIcon src={ic(tgIcons.more, theme)} alt="more" />
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
                    <div className="sender" style={{ color: nameColor(it.name, theme) }}>
                      {it.name}
                    </div>
                  ) : null}

                  {src ? (
                    <div className="media" data-self={out || undefined}>
                      <img className="pic" src={src} alt="" />
                      {it.text ? (
                        <div className="cap">
                          {inline(it.text)}
                          {meta(it, 'bubble')}
                        </div>
                      ) : (
                        <span className="mt mt-media">
                          {times.get(it.id)}
                          {self(it.name) && <Check read={data.readState} variant="overlay" theme={theme} />}
                        </span>
                      )}
                    </div>
                  ) : it.voice ? (
                    <div className="bubble vbubble">
                      {quote(it, out)}
                      {it.forward ? (
                        <div className="fwd">
                          Forwarded from: <span className="fwd-name">{it.forward}</span>
                        </div>
                      ) : null}
                      <div className="vline">
                        <span className="vplay">
                          <IconPlay />
                        </span>
                        <span className="vwave">
                          {wave(it.id).map((h, i) => (
                            <i key={i} className={i < 20 ? 'on' : undefined} style={{ height: h }} />
                          ))}
                        </span>
                        <span className="vdur">{it.voice}</span>
                        {meta(it, 'bubble')}
                      </div>
                    </div>
                  ) : bare ? (
                    <span className="bemoji">
                      {it.text}
                      {meta(it, 'accent')}
                    </span>
                  ) : (
                    <div className="bubble">
                      {quote(it, out)}
                      {it.forward ? (
                        <div className="fwd">
                          Forwarded from: <span className="fwd-name">{it.forward}</span>
                        </div>
                      ) : null}
                      {inline(it.text)}
                      {meta(it, 'bubble')}
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
          <IIcon src={ic(tgIcons.attach, theme)} alt="attach" />
          <div className="field">
            <span className="ph">Write a message...</span>
          </div>
          <IIcon src={ic(tgIcons.emoji, theme)} alt="emoji" />
          <IIcon src={ic(tgIcons.voice, theme)} alt="voice" />
        </div>
      )}
      {data.watermark.show && <div className="watermark">{data.watermark.text}</div>}
    </div>
  );
}
