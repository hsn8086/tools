import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import cardCss from './card.css?inline';
import { ZhihuCard } from './Card';
import { ANON_AVATAR, ANON_NAME, WATERMARK_HOST, defaultData, uid } from './defaults';
import { IMG_MARK, usedImageIds } from './content';
import type { BadgeKind, ZhihuData } from './types';
import { usePreviewLayout } from '../../ui/usePreviewLayout';
import { ShadowScope } from '../../ui/ShadowScope';
import { Button, IconButton, Segmented, Switch, TextField } from '../../ui/controls';
import { IconBold, IconDelete, IconDice, IconExport, IconImage, IconLink, IconPerson } from '../../ui/icons';
import { randAnswerCount, randCount, randDate, randProvince, randSmallCount } from '../../ui/random';
import { ExportSheet } from '../../export/ExportSheet';

const STORE_KEY = 'tools.zhihu.v1';

function load(): ZhihuData {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultData();
    const saved = JSON.parse(raw) as ZhihuData & { blocks?: { type: string; text?: string }[] };
    // 旧存档（分段落的）平成一长条
    if (!saved.content && Array.isArray(saved.blocks)) {
      saved.content = {
        text: saved.blocks
          .filter((b) => b.type === 'text')
          .map((b) => b.text ?? '')
          .join('\n'),
        images: [],
      };
    }
    // 旧存档的水印没有工具后缀，追上
    if (saved.watermark?.text === WATERMARK_HOST) saved.watermark.text = `${WATERMARK_HOST}/zhihu`;
    return { ...defaultData(), ...saved };
  } catch {
    /* 存档坏了就用默认值，不打扰用户 */
  }
  return defaultData();
}

function readFile(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = () => rej(fr.error);
    fr.readAsDataURL(file);
  });
}

function PickImage({
  onPick,
  children,
  variant = 'outlined',
  icon,
}: {
  onPick: (dataUrl: string) => void;
  children: React.ReactNode;
  variant?: 'filled' | 'tonal' | 'outlined' | 'text';
  icon?: React.ReactNode;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) onPick(await readFile(f));
          e.target.value = '';
        }}
      />
      <Button size="sm" variant={variant} icon={icon} onClick={() => ref.current?.click()}>
        {children}
      </Button>
    </>
  );
}

export function ZhihuEditor() {
  const [data, setData] = useState<ZhihuData>(load);
  const [exporting, setExporting] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(STORE_KEY, JSON.stringify(data)), 400);
    return () => clearTimeout(t);
  }, [data]);

  usePreviewLayout(frameRef, innerRef, hostRef);

  const patch = useCallback(<K extends keyof ZhihuData>(key: K, value: Partial<ZhihuData[K]>) => {
    setData((d) => ({
      ...d,
      [key]: typeof value === 'object' && !Array.isArray(value) ? { ...(d[key] as object), ...value } : value,
    }));
  }, []);

  const anonymous = data.author.name.trim() === ANON_NAME || data.author.name.trim() === '';

  const reset = () => {
    if (confirm('清空当前内容，恢复默认示例？')) setData(defaultData());
  };

  return (
    <>
      <div className="tool-layout">
        <div className="editor-col">
          <Section title="外观">
            <div className="row">
              <span className="muted grow">卡片主题</span>
              <Segmented
                value={data.theme}
                onChange={(v) => patch('theme', v as never)}
                options={[
                  { value: 'light' as const, label: '浅色' },
                  { value: 'dark' as const, label: '深色' },
                ]}
              />
            </div>
            <div className="row">
              <Switch checked={data.statusBar.show} onChange={(v) => patch('statusBar', { show: v })} label="手机状态栏" />
              {data.statusBar.show && (
                <Switch checked={data.statusBar.island} onChange={(v) => patch('statusBar', { island: v })} label="灵动岛" />
              )}
            </div>
            {data.statusBar.show && (
              <div className="row">
                <div className="grow">
                  <TextField label="时间" value={data.statusBar.time} onChange={(v) => patch('statusBar', { time: v })} />
                </div>
                <div className="grow">
                  <TextField
                    label="电量 %"
                    inputMode="numeric"
                    value={String(data.statusBar.battery)}
                    onChange={(v) => patch('statusBar', { battery: Math.max(0, Math.min(100, +v || 0)) })}
                  />
                </div>
              </div>
            )}
          </Section>

          <Section
            title="问题"
            actions={
              data.question.show && data.question.showMeta ? (
                <Dice
                  label="随机回答数和关注数"
                  onClick={() => patch('question', { answerCount: randAnswerCount(), followCount: randCount() })}
                />
              ) : undefined
            }
          >
            <div className="row">
              <Switch checked={data.question.show} onChange={(v) => patch('question', { show: v })} label="显示问题" />
              {data.question.show && (
                <Switch
                  checked={data.question.showMeta}
                  onChange={(v) => patch('question', { showMeta: v })}
                  label="回答数 / 关注数"
                />
              )}
            </div>
            {data.question.show && (
              <>
                <TextField
                  label="标题"
                  multiline
                  rows={2}
                  value={data.question.title}
                  onChange={(v) => patch('question', { title: v })}
                />
                {data.question.showMeta && (
                  <div className="row">
                    <div className="grow">
                      <TextField label="回答数" value={data.question.answerCount} onChange={(v) => patch('question', { answerCount: v })} />
                    </div>
                    <div className="grow">
                      <TextField label="关注数" value={data.question.followCount} onChange={(v) => patch('question', { followCount: v })} />
                    </div>
                  </div>
                )}
              </>
            )}
          </Section>

          <Section title="答主">
            <div className="avatar-row">
              <img src={data.author.avatar} alt="" />
              <div className="grow">
                <TextField label="昵称" value={data.author.name} onChange={(v) => patch('author', { name: v })} />
              </div>
            </div>
            <div className="row">
              <PickImage onPick={(src) => patch('author', { avatar: src })} icon={<IconImage />}>
                换头像
              </PickImage>
              <Button
               
                variant={anonymous ? 'filled' : 'outlined'}
                icon={<IconPerson />}
                onClick={() => patch('author', { avatar: ANON_AVATAR, name: ANON_NAME })}
              >
                匿名回答
              </Button>
            </div>
            {anonymous ? (
              <p className="helper">匿名回答不显示关注按钮、签名和认证角标 —— 和知乎一致。</p>
            ) : (
              <>
                <TextField label="签名" value={data.author.headline} onChange={(v) => patch('author', { headline: v })} />
                <div className="row">
                  <span className="muted grow">认证角标</span>
                  <Segmented
                   
                    value={data.author.badge}
                    onChange={(v) => patch('author', { badge: v as BadgeKind })}
                    options={[
                      { value: 'none' as const, label: '无' },
                      { value: 'blue' as const, label: '蓝标' },
                      { value: 'gold' as const, label: '金标' },
                      { value: 'org' as const, label: '机构' },
                    ]}
                  />
                </div>
                <div className="row">
                  <Switch checked={data.author.showFollow} onChange={(v) => patch('author', { showFollow: v })} label="关注按钮" />
                  <Switch checked={data.author.showShare} onChange={(v) => patch('author', { showShare: v })} label="分享图标" />
                </div>
              </>
            )}
          </Section>

          <Section
            title="赞同"
            actions={
              data.vote.show ? (
                <Dice
                  label="随机赞同数"
                  onClick={() => patch('vote', { count: randCount(), listenedCount: randSmallCount() })}
                />
              ) : undefined
            }
          >
            <div className="row">
              <Switch checked={data.vote.show} onChange={(v) => patch('vote', { show: v })} label="显示赞同行" />
              {data.vote.show && (
                <Switch checked={data.vote.showListened} onChange={(v) => patch('vote', { showListened: v })} label="N 人听过" />
              )}
            </div>
            {data.vote.show && (
              <div className="row">
                <div className="grow">
                  <TextField label="赞同数" value={data.vote.count} onChange={(v) => patch('vote', { count: v })} />
                </div>
                {data.vote.showListened && (
                  <div className="grow">
                    <TextField label="听过人数" value={data.vote.listenedCount} onChange={(v) => patch('vote', { listenedCount: v })} />
                  </div>
                )}
              </div>
            )}
          </Section>

          <ContentSection data={data} setData={setData} />

          <Section
            title="页脚"
            actions={
              data.footer.show ? (
                <Dice label="随机时间和属地" onClick={() => patch('footer', { time: randDate(), ip: randProvince() })} />
              ) : undefined
            }
          >
            {/* 开关归开关，带左侧标题的控件单独一行——
                两种标注方式混在同一行里就乱了 */}
            <div className="row">
              <Switch checked={data.footer.show} onChange={(v) => patch('footer', { show: v })} label="显示页脚" />
              <Switch
                checked={data.showExpandChevron}
                onChange={(v) => setData((d) => ({ ...d, showExpandChevron: v }))}
                label="折叠箭头"
              />
              {data.footer.show && (
                <Switch checked={data.footer.noRepost} onChange={(v) => patch('footer', { noRepost: v })} label="禁止转载" />
              )}
            </div>
            {data.footer.show && (
              <>
                <div className="row">
                  <span className="muted grow">写法</span>
                  <Segmented
                   
                    value={data.footer.style}
                    onChange={(v) => patch('footer', { style: v })}
                    options={[
                      { value: 'full' as const, label: '完整' },
                      { value: 'plain' as const, label: '简洁' },
                    ]}
                  />
                </div>
                <div className="row">
                  <div className="grow">
                    <TextField label="时间" value={data.footer.time} onChange={(v) => patch('footer', { time: v })} />
                  </div>
                  <div className="grow">
                    <TextField label="IP 属地" value={data.footer.ip} onChange={(v) => patch('footer', { ip: v })} />
                  </div>
                </div>
              </>
            )}
          </Section>

        </div>

        <div className="preview-col">
          <div className="preview-panel">
            <div className="preview-frame" ref={frameRef}>
              <div className="preview-inner" ref={innerRef}>
                <ShadowScope css={cardCss} ref={hostRef}>
                  <ZhihuCard data={data} />
                </ShadowScope>
              </div>
            </div>
            <div className="preview-actions">
              <Button variant="text" onClick={reset}>
                重置
              </Button>
              <Button variant="filled" className="grow" icon={<IconExport />} onClick={() => setExporting(true)}>
                导出图片
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-bar">
        <Button variant="text" onClick={reset}>
          重置
        </Button>
        <Button variant="filled" className="grow" icon={<IconExport />} onClick={() => setExporting(true)}>
          导出图片
        </Button>
      </div>

      <ExportSheet
        open={exporting}
        onClose={() => setExporting(false)}
        hostRef={hostRef}
        fileName="zhihu"
        deps={data}
        watermark={data.watermark.show}
        onWatermarkChange={(v) => setData((d) => ({ ...d, watermark: { ...d.watermark, show: v } }))}
      />
    </>
  );
}

function Section({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="section">
      <div className="section-head">
        <h4>{title}</h4>
        {actions}
      </div>
      {children}
    </div>
  );
}

/** 章节标题右边那颗骰子 */
function Dice({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <IconButton onClick={onClick} label={label}>
      <IconDice />
    </IconButton>
  );
}

/**
 * 正文：一长条，换行分段。
 * 图片插入光标处一行 `![id]`，所以图文顺序就是文本顺序——
 * 不需要另一套拖拽排序，改顺序就是剪切一行。
 */
function ContentSection({
  data,
  setData,
}: {
  data: ZhihuData;
  setData: React.Dispatch<React.SetStateAction<ZhihuData>>;
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const { text, images } = data.content;
  const used = useMemo(() => usedImageIds(text), [text]);

  const setText = (v: string) => setData((d) => ({ ...d, content: { ...d.content, text: v } }));

  /** 包住选中的字；没选就插入一对标记并把光标放中间 */
  const wrap = (left: string, right: string) => {
    const el = areaRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    setText(value.slice(0, s) + left + value.slice(s, e) + right + value.slice(e));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + left.length, e + left.length);
    });
  };

  /** 在光标所在行之后另起一行插图 */
  const insertImage = (src: string) => {
    const el = areaRef.current;
    const id = uid();
    const mark = IMG_MARK(id);
    const value = text;
    const at = el ? el.selectionStart : value.length;
    const lineEnd = value.indexOf('\n', at);
    const cut = lineEnd === -1 ? value.length : lineEnd;
    const next = `${value.slice(0, cut)}\n${mark}\n${value.slice(cut).replace(/^\n/, '')}`;

    setData((d) => ({
      ...d,
      content: { text: next, images: [...d.content.images, { id, src, fit: 'auto' }] },
    }));
    requestAnimationFrame(() => {
      el?.focus();
      const pos = cut + mark.length + 1;
      el?.setSelectionRange(pos, pos);
    });
  };

  const removeImage = (id: string) =>
    setData((d) => ({
      ...d,
      content: {
        text: d.content.text
          .split('\n')
          .filter((l) => l.trim() !== IMG_MARK(id))
          .join('\n'),
        images: d.content.images.filter((im) => im.id !== id),
      },
    }));

  const setFit = (id: string, fit: 'auto' | 'full') =>
    setData((d) => ({
      ...d,
      content: { ...d.content, images: d.content.images.map((im) => (im.id === id ? { ...im, fit } : im)) },
    }));

  return (
    <div className="section">
      <div className="section-head">
        <h4>正文</h4>
        <IconButton label="加粗选中的字" onClick={() => wrap('**', '**')}>
          <IconBold />
        </IconButton>
        <IconButton label="变成蓝色链接" onClick={() => wrap('[[', ']]')}>
          <IconLink />
        </IconButton>
        <PickImage variant="text" icon={<IconImage />} onPick={insertImage}>
          插图
        </PickImage>
      </div>

      <TextField ref={areaRef} label="一行一段" multiline rows={10} value={text} onChange={setText} />

      {images.length > 0 && (
        <div className="img-list">
          {images.map((im) => (
            <div className="img-item" key={im.id} data-orphan={!used.has(im.id) || undefined}>
              <img src={im.src} alt="" />
              <Segmented
               
                value={im.fit}
                onChange={(v) => setFit(im.id, v)}
                options={[
                  { value: 'auto' as const, label: '原宽' },
                  { value: 'full' as const, label: '通栏' },
                ]}
              />
              <IconButton label="删除这张图" onClick={() => removeImage(im.id)}>
                <IconDelete />
              </IconButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
