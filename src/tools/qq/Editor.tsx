import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import cardCss from './card.css?inline';
import { QQCard } from './Card';
import { DEFAULT_AVATAR, defaultData, WATERMARK_HOST } from './defaults';
import { IMG_MARK, peopleInScript } from './script';
import type { PersonAttrs, QQData } from './types';
import { usePreviewLayout } from '../../ui/usePreviewLayout';
import { ShadowScope } from '../../ui/ShadowScope';
import { Button, IconButton, Segmented, Switch, TextField } from '../../ui/controls';
import { IconDelete, IconDice, IconExport, IconImage, IconPerson } from '../../ui/icons';
import { AvatarPicker } from '../../ui/AvatarPicker';
import { readImageFile } from '../../ui/file';
import { pick, randClock, randInt } from '../../ui/random';
import { ExportSheet } from '../../export/ExportSheet';
import { useSnackbar } from '../../ui/Snackbar';

const STORE_KEY = 'tools.qq.v1';

/** 旧存档存的是 people 数组，转成按昵称索引的 roster */
function rosterFromLegacy(s: Record<string, unknown>): QQData['roster'] {
  const legacy = s.people;
  if (!Array.isArray(legacy)) return defaultData().roster;
  return Object.fromEntries(
    legacy.map((p: { name: string; avatar?: string; self?: boolean; title?: string }) => [
      p.name,
      { avatar: p.avatar ?? DEFAULT_AVATAR, self: p.self ?? false, title: p.title ?? '' },
    ])
  );
}

function load(): QQData {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultData();
    const d = defaultData();
    const s = JSON.parse(raw) as Partial<QQData>;
    // 嵌套对象要逐层并，不然旧存档少一个字段就会在渲染时炸
    return {
      ...d,
      ...s,
      header: { ...d.header, ...s.header },
      statusBar: { ...d.statusBar, ...s.statusBar },
      watermark: { ...d.watermark, ...s.watermark },
      roster: { ...(s.roster ?? rosterFromLegacy(s)) },
    };
  } catch {
    return defaultData();
  }
}


let imgSeq = 0;

export function QQEditor() {
  const [data, setData] = useState<QQData>(load);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [exporting, setExporting] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLTextAreaElement>(null);
  const snack = useSnackbar();

  usePreviewLayout(frameRef, innerRef, hostRef);

  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(STORE_KEY, JSON.stringify(data)), 400);
    return () => clearTimeout(t);
  }, [data]);

  /**
   * 成员列表完全由剧本推出来，不落在 state 里。
   * 之前是「解析出新名字就往 people 里塞一条」，打字打到
   * 「张三」的过程中会先后塞进「张」和「张三」，一句话打完
   * 多出一串半截人名。现在没写进剧本的名字根本不存在。
   */
  const people = useMemo(() => peopleInScript(data, DEFAULT_AVATAR), [data.script, data.roster]);

  const setPerson = useCallback((name: string, patch: Partial<PersonAttrs>) => {
    setData((d) => {
      const roster = { ...d.roster };
      const cur: PersonAttrs = roster[name] ?? { avatar: DEFAULT_AVATAR, self: false, title: '' };
      // 「我」同时只能有一个
      if (patch.self) for (const k of Object.keys(roster)) roster[k] = { ...roster[k], self: false };
      roster[name] = { ...cur, ...patch };
      return { ...d, roster };
    });
  }, []);

  const insertImage = useCallback(async (file: File) => {
    const src = await readImageFile(file);
    const id = `img${Date.now().toString(36)}${imgSeq++}`;
    const ta = scriptRef.current;
    setData((d) => {
      const at = ta ? ta.selectionStart : d.script.length;
      const before = d.script.slice(0, at);
      const after = d.script.slice(at);
      const nl = before && !before.endsWith('\n') ? '\n' : '';
      // 图片单独占一行，前面补上最后一个说话人的名字
      const lastName = /(?:^|\n)\s*([^：:\n]{1,20})\s*[：:]/g;
      let name = '';
      for (let m = lastName.exec(before); m; m = lastName.exec(before)) name = m[1].trim();
      const line = `${name ? name + '：' : ''}${IMG_MARK(id)}\n`;
      return { ...d, images: [...d.images, { id, src }], script: before + nl + line + after };
    });
    snack('图片已插到光标处');
  }, [snack]);

  const reset = useCallback(() => {
    if (!confirm('清空当前内容，恢复默认示例？')) return;
    localStorage.removeItem(STORE_KEY);
    setData(defaultData());
  }, []);

  /** 只用来改嵌套对象字段 */
  const patch = useCallback(
    <K extends 'header' | 'statusBar' | 'watermark'>(key: K, value: Partial<QQData[K]>) => {
      setData((d) => ({ ...d, [key]: { ...d[key], ...value } }));
    },
    [],
  );

  return (
    <>
      <div className="tool-layout">
        <div className="editor-col">
          <Section
            title="外观"
            actions={
              <IconButton
                label="随机未读数和状态栏"
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    header: { ...d.header, unread: pick(['', '', '2', '5', '9', '12', '36', '99+']) },
                    statusBar: { ...d.statusBar, time: randClock(), battery: randInt(15, 100) },
                  }))
                }
              >
                <IconDice />
              </IconButton>
            }
          >
            <div className="row">
              <span className="muted grow">主题</span>
              <Segmented
                value={theme}
                onChange={setTheme}
                options={[
                  { value: 'light' as const, label: '浅色' },
                  { value: 'dark' as const, label: '深色' },
                ]}
              />
            </div>
            <div className="row">
              <Switch checked={data.header.show} onChange={(v) => patch('header', { show: v })} label="标题栏" />
              <Switch checked={data.inputBar} onChange={(v) => setData((d) => ({ ...d, inputBar: v }))} label="输入栏" />
              <Switch checked={data.statusBar.show} onChange={(v) => patch('statusBar', { show: v })} label="手机状态栏" />
            </div>
            {data.header.show && (
              <div className="row">
                <div className="grow">
                  <TextField
                    label="群名（人数直接写进去）"
                    value={data.header.title}
                    onChange={(v) => patch('header', { title: v })}
                  />
                </div>
                <div style={{ width: 96 }}>
                  <TextField label="未读数" value={data.header.unread} onChange={(v) => patch('header', { unread: v })} />
                </div>
              </div>
            )}
            {data.statusBar.show && (
              <div className="row">
                <div className="grow">
                  <TextField label="时间" value={data.statusBar.time} onChange={(v) => patch('statusBar', { time: v })} />
                </div>
                <div style={{ width: 110 }}>
                  <TextField
                    label="电量 %"
                    value={String(data.statusBar.battery)}
                    onChange={(v) => patch('statusBar', { battery: Math.max(0, Math.min(100, Number(v) || 0)) })}
                  />
                </div>
                <Switch checked={data.statusBar.island} onChange={(v) => patch('statusBar', { island: v })} label="灵动岛" />
              </div>
            )}
          </Section>

          <Section
            title="对话"
            actions={
              <PickImage onPick={insertImage}>
                <IconImage />
                插图
              </PickImage>
            }
          >
            <p className="hint">
              一行一条，写成「昵称：内容」。不带昵称的行会接到上一条后面，单独一行的 <code>[21:18]</code> 是时间分割线。
            </p>
            <TextField
              ref={scriptRef}
              label="聊天记录"
              multiline
              rows={14}
              value={data.script}
              onChange={(v) => setData((d) => ({ ...d, script: v }))}
            />
          </Section>

          <Section title="成员">
            {people.length === 0 ? (
              <p className="hint">上面写了「昵称：内容」之后，这里会列出所有人。</p>
            ) : (
              <div className="people">
                {people.map((p) => (
                  <div className="person" key={p.name}>
                    <AvatarPicker
                      src={p.avatar}
                      label={`给 ${p.name} 换头像`}
                      size={40}
                      onPick={(src) => setPerson(p.name, { avatar: src })}
                      onReset={p.avatar === DEFAULT_AVATAR ? undefined : () => setPerson(p.name, { avatar: DEFAULT_AVATAR })}
                    />
                    <span className="pname">{p.name}</span>
                    <div style={{ width: 92 }}>
                      <TextField label="头衔" value={p.title} onChange={(v) => setPerson(p.name, { title: v })} />
                    </div>
                    <Button
                      variant={p.self ? 'filled' : 'outlined'}
                      size="sm"
                      icon={<IconPerson />}
                      onClick={() => setPerson(p.name, { self: !p.self })}
                    >
                      我
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <p className="hint">
              点头像换图，把图拖上去或者直接粘贴也行。标成「我」的人靠右、蓝气泡。头衔写「群主」是琢珀色，其余都按管理员的青色。
            </p>
          </Section>

          {data.images.length > 0 && (
            <Section title="图片">
              <div className="img-list">
                {data.images.map((im) => {
                  const used = data.script.includes(IMG_MARK(im.id));
                  return (
                    <div className="img-item" key={im.id} data-orphan={!used || undefined}>
                      <img src={im.src} alt="" />
                      <span className="muted grow">{used ? IMG_MARK(im.id) : '未使用'}</span>
                      <IconButton
                        label="删除"
                        onClick={() =>
                          setData((d) => ({
                            ...d,
                            images: d.images.filter((x) => x.id !== im.id),
                            script: d.script.replace(IMG_MARK(im.id), ''),
                          }))
                        }
                      >
                        <IconDelete />
                      </IconButton>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}
        </div>

        <div className="preview-col">
          <div className="preview-panel">
            <div className="preview-frame" ref={frameRef}>
              <div className="preview-inner" ref={innerRef}>
                <ShadowScope css={cardCss} ref={hostRef}>
                  <QQCard data={data} theme={theme} />
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
        fileName="qq"
        deps={`${JSON.stringify(data)}|${theme}`}
        watermark={data.watermark.show}
        onWatermarkChange={(v) => setData((d) => ({ ...d, watermark: { ...d.watermark, show: v } }))}
      />
    </>
  );
}

function Section({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
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

function PickImage({
  onPick,
  children,
  variant = 'outlined',
}: {
  onPick: (f: File) => void | Promise<void>;
  children: React.ReactNode;
  variant?: 'outlined' | 'text';
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button variant={variant} size="sm" onClick={() => ref.current?.click()}>
        {children}
      </Button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onPick(f);
          e.target.value = '';
        }}
      />
    </>
  );
}

export { WATERMARK_HOST };
