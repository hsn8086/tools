import { useCallback, useEffect, useRef, useState } from 'react';
import cardCss from './card.css?inline';
import { CfCard } from './Card';
import { defaultData } from './defaults';
import { fetchHistories, mergeHistories, parseHandles, simulate, type Progress } from './merge';
import type { CfData } from './types';
import { usePreviewLayout } from '../../ui/usePreviewLayout';
import { ShadowScope } from '../../ui/ShadowScope';
import { Button, ProgressBar, Segmented, Switch, TextField } from '../../ui/controls';
import { IconExport, IconSync } from '../../ui/icons';
import { useSnackbar } from '../../ui/Snackbar';
import { ExportSheet } from '../../export/ExportSheet';

const STORE_KEY = 'tools.cf-merge.v1';

/** 一场比赛的名单动辄几 MB，加上官方 2 秒一次的限流，按这个数报预计时间 */
const SECONDS_PER_CONTEST = 3;

function load(): CfData {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return { ...defaultData(), ...(JSON.parse(raw) as CfData) };
  } catch {
    /* 存档坏了就用示例数据，不打扰用户 */
  }
  return defaultData();
}

type Phase = { kind: 'idle' } | { kind: 'history' } | ({ kind: 'contests' } & Progress);

export function CfEditor() {
  const [data, setData] = useState<CfData>(load);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [exporting, setExporting] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const snack = useSnackbar();

  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  usePreviewLayout(frameRef, innerRef, hostRef);

  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(STORE_KEY, JSON.stringify(data)), 400);
    return () => clearTimeout(t);
  }, [data]);

  useEffect(() => () => abort.current?.abort(), []);

  const patch = useCallback(<K extends keyof CfData>(key: K, value: CfData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
  }, []);

  const running = phase.kind !== 'idle';

  const run = async () => {
    const handles = parseHandles(data.handlesInput);
    if (!handles.length) return snack('先填至少一个 handle');

    const ctrl = new AbortController();
    abort.current = ctrl;
    setPhase({ kind: 'history' });
    try {
      const histories = await fetchHistories(handles, ctrl.signal);
      const entries = mergeHistories(histories);
      if (!entries.length) throw new Error('这些号一场 rated 比赛都没打过');

      const points = await simulate(entries, {
        signal: ctrl.signal,
        onProgress: (p) => setPhase({ kind: 'contests', ...p }),
      });

      setData((d) => ({ ...d, result: { handles, points, fetchedAt: Date.now() } }));
      const skipped = histories.reduce((n, h) => n + h.length, 0) - entries.length;
      snack(`${entries.length} 场算完${skipped ? `，${skipped} 场重复只算了一次` : ''}`);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') snack('已停止');
      else snack(e instanceof Error ? e.message : '拉取失败');
    } finally {
      abort.current = null;
      setPhase({ kind: 'idle' });
    }
  };

  const reset = () => {
    if (confirm('恢复默认示例？')) setData(defaultData());
  };

  return (
    <>
      <div className="tool-layout">
        <div className="editor-col">
          <div className="section">
            <div className="section-head">
              <h4>账号</h4>
            </div>
            <TextField
              label="一行一个 handle"
              multiline
              rows={3}
              value={data.handlesInput}
              onChange={(v) => patch('handlesInput', v)}
            />
            <div className="row">
              <Button
                variant={running ? 'outlined' : 'filled'}
                icon={running ? undefined : <IconSync />}
                onClick={() => (running ? abort.current?.abort() : void run())}
              >
                {running ? '停止' : '合并计算'}
              </Button>
              <span className="muted grow">{statusText(phase)}</span>
            </div>
            {phase.kind === 'contests' && <ProgressBar value={phase.done / Math.max(1, phase.total)} />}
            <p className="helper">
              读 Codeforces 官方接口，把这些号的 rated 场次按时间穿成一条，每场用当场完整名单重算 delta——
              不是把各自的涨跌加起来，同一场被两个号打过只留名次好的那次。官方接口限流，几十场要跑一两分钟。
            </p>
          </div>

          <div className="section">
            <div className="section-head">
              <h4>卡片</h4>
            </div>
            <TextField label="标题" value={data.title} onChange={(v) => patch('title', v)} />
            <div className="row">
              <span className="muted grow">配色</span>
              <Segmented
                value={data.theme}
                onChange={(v) => patch('theme', v)}
                options={[
                  { value: 'light' as const, label: '浅色' },
                  { value: 'dark' as const, label: '深色' },
                ]}
              />
            </div>
            <div className="row">
              <Switch checked={data.showSources} onChange={(v) => patch('showSources', v)} label="标出每场是哪个号" />
              <Switch checked={data.showRecent} onChange={(v) => patch('showRecent', v)} label="最近场次" />
            </div>
          </div>
        </div>

        <div className="preview-col">
          <div className="preview-panel">
            <div className="preview-frame" ref={frameRef}>
              <div className="preview-inner" ref={innerRef}>
                <ShadowScope css={cardCss} ref={hostRef}>
                  <CfCard data={data} />
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
        fileName="cf-merge"
        deps={data}
        watermark={data.watermark.show}
        onWatermarkChange={(v) => setData((d) => ({ ...d, watermark: { show: v } }))}
      />
    </>
  );
}

function statusText(phase: Phase) {
  if (phase.kind === 'idle') return '';
  if (phase.kind === 'history') return '读取参赛记录…';
  const left = Math.max(0, phase.total - phase.done) * SECONDS_PER_CONTEST;
  const eta = left >= 60 ? `约 ${Math.ceil(left / 60)} 分钟` : `约 ${left} 秒`;
  return `第 ${phase.done + 1} / ${phase.total} 场 · 还剩 ${eta}`;
}
