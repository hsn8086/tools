import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import cardCss from './card.css?inline';
import { TGCard } from './Card';
import { defaultData, WATERMARK_HOST } from './defaults';
import { IMG_MARK, nameColor, peopleInScript } from './script';
import type { PersonAttrs, TGData } from './types';
import { usePreviewLayout } from '../../ui/usePreviewLayout';
import { ShadowScope } from '../../ui/ShadowScope';
import { Button, IconButton, Segmented, Switch, TextField } from '../../ui/controls';
import { IconDelete, IconDice, IconExport, IconPerson } from '../../ui/icons';
import { AvatarPicker } from '../../ui/AvatarPicker';
import { readImageFile } from '../../ui/file';
import { randClock } from '../../ui/random';
import { ExportSheet } from '../../export/ExportSheet';
import { useSnackbar } from '../../ui/Snackbar';

const STORE_KEY = 'tools.tg.v1';

function load(): TGData {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultData();
    const d = defaultData();
    const s = JSON.parse(raw) as Partial<TGData>;
    // 嵌套对象要逐层并，不然旧存档少一个字段就会在渲染时炸
    return {
      ...d,
      ...s,
      chrome: { ...d.chrome, ...s.chrome },
      peer: { ...d.peer, ...s.peer },
      watermark: { ...d.watermark, ...s.watermark },
      roster: { ...(s.roster ?? d.roster) },
    };
  } catch {
    return defaultData();
  }
}

let imgSeq = 0;

export function TGEditor() {
  const [data, setData] = useState<TGData>(load);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
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

  /** 成员列表完全由剧本推出来，不落在 state 里 */
  const people = useMemo(() => peopleInScript(data), [data.script, data.roster]);

  const setPerson = useCallback((name: string, patch: Partial<PersonAttrs>) => {
    setData((d) => {
      const roster = { ...d.roster };
      const cur: PersonAttrs = roster[name] ?? { self: false };
      // 「我」同时只能有一个
      if (patch.self) for (const k of Object.keys(roster)) roster[k] = { ...roster[k], self: false };
      roster[name] = { ...cur, ...patch };
      return { ...d, roster };
    });
  }, []);

  /** 往光标处插一整行，插完把光标停在需要改的那段上 */
  const insertLine = useCallback((line: string, selectHint?: string) => {
    const ta = scriptRef.current;
    const cur = ta?.value ?? '';
    const at = ta ? ta.selectionStart : cur.length;
    const before = cur.slice(0, at);
    const nl = before && !before.endsWith('\n') ? '\n' : '';
    const pos = selectHint && line.includes(selectHint) ? (before + nl).length + line.indexOf(selectHint) : (before + nl + line).length;
    setData((d) => ({ ...d, script: before + nl + line + '\n' + cur.slice(at) }));
    requestAnimationFrame(() => {
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(pos, pos + (selectHint ? selectHint.length : 0));
    });
  }, []);

  const lastSpeaker = useCallback(() => {
    const re = /(?:^|\n)\s*([^：:\n[【]{1,20})\s*[：:]/g;
    let name = '';
    for (let m = re.exec(data.script); m; m = re.exec(data.script)) name = m[1].trim();
    return name || '昵称';
  }, [data.script]);

  const insertImage = useCallback(
    async (file: File) => {
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
    },
    [snack],
  );

  const reset = useCallback(() => {
    if (!confirm('清空当前内容，恢复默认示例？')) return;
    localStorage.removeItem(STORE_KEY);
    setData(defaultData());
  }, []);

  /** 只用来改嵌套对象字段 */
  const patch = useCallback(
    <K extends 'chrome' | 'peer' | 'watermark'>(key: K, value: Partial<TGData[K]>) => {
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
                label="随机消息时间"
                onClick={() => setData((d) => ({ ...d, clock: randClock() }))}
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
                  { value: 'dark' as const, label: '深色' },
                  { value: 'light' as const, label: '浅色' },
                ]}
              />
            </div>
            <div className="row">
              <Switch checked={data.chrome.show} onChange={(v) => patch('chrome', { show: v })} label="窗口标题栏" />
              <Switch checked={data.peer.show} onChange={(v) => patch('peer', { show: v })} label="聊天头部" />
              <Switch checked={data.inputBar} onChange={(v) => setData((d) => ({ ...d, inputBar: v }))} label="输入栏" />
              <Switch checked={data.group} onChange={(v) => setData((d) => ({ ...d, group: v }))} label="群聊昵称" />
            </div>
            {data.chrome.show && (
              <div className="row">
                <div className="grow">
                  <TextField label="窗口标题" placeholder="Telegram @ hsn" value={data.chrome.title} onChange={(v) => patch('chrome', { title: v })} />
                </div>
              </div>
            )}
            {data.peer.show && (
              <div className="row">
                <AvatarPicker
                  src={data.peer.avatar}
                  label="换对方头像"
                  size={40}
                  fallback={
                    <span
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        background: nameColor(data.peer.name, theme),
                        color: '#fff',
                        fontSize: 16,
                        fontWeight: 600,
                      }}
                    >
                      {(data.peer.name.trim()[0] ?? '?').toUpperCase()}
                    </span>
                  }
                  onPick={(src) => patch('peer', { avatar: src })}
                  onReset={data.peer.avatar ? () => patch('peer', { avatar: '' }) : undefined}
                />
                <div className="grow">
                  <TextField label="聊天对象" placeholder="Serafina" value={data.peer.name} onChange={(v) => patch('peer', { name: v })} />
                </div>
                <div className="grow">
                  <TextField
                    label="副标题"
                    placeholder="last seen today at 19:42"
                    value={data.peer.subtitle}
                    onChange={(v) => patch('peer', { subtitle: v })}
                  />
                </div>
                <Switch checked={data.peer.online} onChange={(v) => patch('peer', { online: v })} label="在线" />
              </div>
            )}
            <div className="row">
              <span className="muted grow">已读回执</span>
              <Segmented
                value={data.readState}
                onChange={(v) => setData((d) => ({ ...d, readState: v }))}
                options={[
                  { value: 'none' as const, label: '无' },
                  { value: 'sent' as const, label: '单勾' },
                  { value: 'read' as const, label: '双勾' },
                ]}
              />
            </div>
            <div className="row">
              <div style={{ width: 140 }}>
                <TextField label="消息起始时间" placeholder="20:52" value={data.clock} onChange={(v) => setData((d) => ({ ...d, clock: v }))} />
              </div>
              <p className="hint grow">每条消息自动 +1 分钟；剧本里写「[时刻] 21:30」可以从某个时间点重新走。</p>
            </div>
          </Section>

          <Section title="对话">
            <p className="hint">每行写「昵称：内容」，下一行不写昵称就接在上一条后面。</p>
            <div className="row toolbar">
              <div className="tool-group">
                <Button size="sm" variant="text" onClick={() => insertLine('[9月4日]', '9月4日')}>
                  日期
                </Button>
                <Button size="sm" variant="text" onClick={() => insertLine(`[引用] ${lastSpeaker()}：原文`, '原文')}>
                  引用
                </Button>
                <Button size="sm" variant="text" onClick={() => insertLine('[转发] hsn.recipe', 'hsn.recipe')}>
                  转发
                </Button>
                <Button size="sm" variant="text" onClick={() => insertLine(`[系统] ${lastSpeaker()} 置顶了一条消息`)}>
                  系统行
                </Button>
              </div>
              <div className="tool-group">
                <Button size="sm" variant="text" onClick={() => insertLine(`${lastSpeaker()}：[语音] 0:12`, '0:12')}>
                  语音
                </Button>
                <Button size="sm" variant="text" onClick={() => insertLine('+❤️ 👍', '❤️')}>
                  回应
                </Button>
                <PickImage onPick={insertImage} variant="text">
                  图片
                </PickImage>
              </div>
            </div>
            <TextField
              ref={scriptRef}
              label="聊天记录"
              rows={14}
              multiline
              placeholder={'Serafina：今晚吃什么\n[引用] Serafina：昨晚那家烧烤\n我：还是那家吧\n我：[语音] 0:12'}
              value={data.script}
              onChange={(v) => setData((d) => ({ ...d, script: v }))}
            />
          </Section>

          <Section title="成员">
            {people.length === 0 ? (
              <p className="hint">上面写完对话，这里会列出所有人。</p>
            ) : (
              <div className="people">
                {people.map((p) => (
                  <div className="person" key={p.name}>
                    <span className="pname grow">{p.name}</span>
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
            <p className="hint">标记为「我」的消息靠右显示（蓝色气泡）并带已读勾。开「群聊昵称」后，别人发的消息上方会显示彩色名字。</p>
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
                  <TGCard data={data} theme={theme} />
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
        fileName="tg"
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
