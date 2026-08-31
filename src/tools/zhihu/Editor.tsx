import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import cardCss from './card.css?inline';
import { ZhihuCard } from './Card';
import { ANON_AVATAR, ANON_NAME, WATERMARK_HOST, defaultData, uid } from './defaults';
import { IMG_MARK, usedImageIds } from './content';
import type { BadgeKind, ZhihuData } from './types';
import { usePreviewLayout } from './usePreviewLayout';
import { ShadowScope } from '../../ui/ShadowScope';
import { Button, IconButton, Segmented, Slider, Switch, TextField } from '../../ui/controls';
import { IconBold, IconCopy, IconDelete, IconDownload, IconExport, IconImage, IconLink, IconPerson } from '../../ui/icons';
import { Sheet } from '../../ui/Sheet';
import { useSnackbar } from '../../ui/Snackbar';
import { renderCard } from '../../export/capture';
import { BAOJIANG_PRESETS } from '../../export/baojiang';
import { copyBlob, downloadBlob, stamp } from '../../export/save';

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

          <Section title="问题">
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
                size="sm"
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
                    size="sm"
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

          <Section title="赞同">
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

          <Section title="页脚">
            <div className="row">
              <Switch checked={data.footer.show} onChange={(v) => patch('footer', { show: v })} label="显示页脚" />
              <Switch
                checked={data.showExpandChevron}
                onChange={(v) => setData((d) => ({ ...d, showExpandChevron: v }))}
                label="折叠箭头"
              />
            </div>
            {data.footer.show && (
              <>
                <div className="row">
                  <span className="muted grow">写法</span>
                  <Segmented
                    size="sm"
                    value={data.footer.style}
                    onChange={(v) => patch('footer', { style: v })}
                    options={[
                      { value: 'full' as const, label: '完整' },
                      { value: 'plain' as const, label: '简洁' },
                    ]}
                  />
                  <Switch checked={data.footer.noRepost} onChange={(v) => patch('footer', { noRepost: v })} label="禁止转载" />
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

      <ExportSheet open={exporting} onClose={() => setExporting(false)} hostRef={hostRef} data={data} setData={setData} />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="section">
      <h4>{title}</h4>
      {children}
    </div>
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
                size="sm"
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

function ExportSheet({
  open,
  onClose,
  hostRef,
  data,
  setData,
}: {
  open: boolean;
  onClose: () => void;
  hostRef: React.RefObject<HTMLDivElement | null>;
  data: ZhihuData;
  setData: React.Dispatch<React.SetStateAction<ZhihuData>>;
}) {
  const [level, setLevel] = useState(0);
  const [ratio, setRatio] = useState(2);
  const [out, setOut] = useState<{ url: string; w: number; h: number; size: number; blob: Blob } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const snack = useSnackbar();
  const runId = useRef(0);

  const render = useCallback(
    async (pixelRatio: number, lv: number) => {
      const host = hostRef.current;
      if (!host) return;
      const id = ++runId.current;
      setBusy(true);
      setErr('');
      try {
        const r = await renderCard(host, { pixelRatio, level: lv, format: 'png' });
        if (id !== runId.current) return URL.revokeObjectURL(r.url);
        setOut((prev) => {
          if (prev) URL.revokeObjectURL(prev.url);
          return { url: r.url, w: r.width, h: r.height, size: r.blob.size, blob: r.blob };
        });
      } catch (e) {
        if (id === runId.current) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (id === runId.current) setBusy(false);
      }
    },
    [hostRef],
  );

  // 打开时、参数变化时重渲染。滑块拖动防抖 120ms，避免每一帧都截一次图。
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => void render(ratio, level), 120);
    return () => clearTimeout(t);
  }, [open, ratio, level, data, render]);

  return (
    <Sheet open={open} onClose={onClose} title="导出">
      <div className="row">
        <span className="muted grow">倍率</span>
        <Segmented
          value={ratio}
          onChange={setRatio}
          options={[
            { value: 1, label: '1x' },
            { value: 2, label: '2x' },
            { value: 3, label: '3x' },
          ]}
        />
      </div>

      <div className="row" style={{ marginTop: 20 }}>
        <span className="muted grow">包浆</span>
        <Segmented
          size="sm"
          value={BAOJIANG_PRESETS.find((p) => p.level === level)?.level ?? -1}
          onChange={(v) => v >= 0 && setLevel(v)}
          options={BAOJIANG_PRESETS.map((p) => ({ value: p.level, label: p.label }))}
        />
      </div>
      <Slider label="包浆强度" value={level} onChange={setLevel} />

      <div className="row">
        <Switch
          checked={data.watermark.show}
          onChange={(v) => {
            setData((d) => ({ ...d, watermark: { ...d.watermark, show: v } }));
            if (!v) snack('已去掉水印。喜欢的话，帮我提一句出处就好。');
          }}
          label="保留小水印"
        />
      </div>

      <div style={{ marginTop: 16 }}>
        {err ? (
          <p className="muted" style={{ color: 'var(--md-error)' }}>
            {err}
          </p>
        ) : out ? (
          <>
            <img className="out-preview" src={out.url} alt="导出预览" />
            <p className="muted" style={{ marginTop: 8, textAlign: 'center' }}>
              {out.w}×{out.h}　{(out.size / 1024).toFixed(0)} KB{busy ? '　· 更新中…' : ''}
            </p>
          </>
        ) : (
          <p className="muted">正在生成…</p>
        )}
      </div>

      <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
        <Button
          variant="text"
          icon={<IconCopy />}
          disabled={!out}
          onClick={async () => {
            if (!out) return;
            try {
              await copyBlob(out.blob);
              snack('已复制到剪贴板');
            } catch (e) {
              snack(e instanceof Error ? e.message : '复制失败');
            }
          }}
        >
          复制
        </Button>
        <Button
          variant="filled"
          icon={<IconDownload />}
          disabled={!out}
          onClick={() => out && downloadBlob(out.blob, `zhihu-${stamp()}.${out.blob.type === 'image/png' ? 'png' : 'jpg'}`)}
        >
          下载
        </Button>
      </div>
    </Sheet>
  );
}
