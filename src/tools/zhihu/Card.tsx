import { Fragment, type ReactNode } from 'react';
import type { ZhihuData } from './types';
import { Badge, Chevron, DoubleChevronDown, HeadphoneIcon, Plus, ShareIcon, StatusIcons } from './icons';
import { deriveBlocks } from './content';

/** 极简行内语法：**加粗**、[[蓝色链接]] */
function inline(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  const re = /\*\*([\s\S]+?)\*\*|\[\[([\s\S]+?)\]\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(<Fragment key={k++}>{text.slice(last, m.index)}</Fragment>);
    if (m[1] !== undefined) nodes.push(<strong key={k++}>{m[1]}</strong>);
    else nodes.push(
      <span className="lk" key={k++}>
        {m[2]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(<Fragment key={k++}>{text.slice(last)}</Fragment>);
  return nodes;
}

export function ZhihuCard({ data }: { data: ZhihuData }) {
  const { question: q, author: a, vote: v, footer: f, statusBar: sb } = data;

  const full = f.style !== 'plain';
  const footerParts: string[] = [];
  if (f.time.trim()) footerParts.push(full ? `发布于 ${f.time.trim()}` : f.time.trim());
  if (f.ip.trim()) footerParts.push(full ? `IP 属地${f.ip.trim()}` : f.ip.trim());
  if (f.noRepost) footerParts.push('禁止转载');

  return (
    <div className="zh" data-theme={data.theme}>
      {sb.show && (
        <div className="status">
          {sb.island && <div className="island" />}
          <div className="time">{sb.time}</div>
          <div className="right">
            <StatusIcons battery={sb.battery} />
          </div>
        </div>
      )}

      {q.show && (
        <>
          <div className="question">
            <h1 className="q-title">{q.title}</h1>
            {q.showMeta && (
              <div className="q-meta">
                <span>
                  知乎 · {q.answerCount} 个回答 · {q.followCount} 关注
                </span>
                {q.showArrow && <Chevron />}
              </div>
            )}
          </div>
          <div className="sep" />
        </>
      )}

      <div className={`answer${f.show && footerParts.length ? '' : ' no-footer'}`}>
        <div className="author">
          <img className="avatar" src={a.avatar} alt="" crossOrigin="anonymous" />
          <div className="a-main">
            <div className="a-name">
              <span>{a.name}</span>
              <Badge kind={a.badge} />
            </div>
            {a.headline.trim() && <div className="a-headline">{a.headline}</div>}
          </div>
          {a.showFollow && (
            <div className="follow">
              <Plus />
              <span>关注</span>
            </div>
          )}
          {a.showShare && <ShareIcon />}
        </div>

        {v.show && (
          <div className="vote">
            <div className="left">
              <span>{v.count} 人赞同了该回答</span>
              {v.showArrow && <Chevron />}
            </div>
            {v.showListened && (
              <div className="listened">
                <HeadphoneIcon />
                <span>{v.listenedCount} 人听过</span>
              </div>
            )}
          </div>
        )}

        <div className="content">
          {deriveBlocks(data.content).map((b) =>
            b.type === 'text' ? (
              <p key={b.id}>{inline(b.text)}</p>
            ) : (
              <figure key={b.id} data-fit={b.fit}>
                <img src={b.src} alt="" crossOrigin="anonymous" />
              </figure>
            ),
          )}
        </div>

        {data.showExpandChevron && (
          <div className="chevron-more">
            <DoubleChevronDown />
          </div>
        )}
      </div>

      {f.show && footerParts.length > 0 && <div className="footer">{footerParts.join(' · ')}</div>}

      {data.watermark.show && <div className="watermark">{data.watermark.text}</div>}
    </div>
  );
}
