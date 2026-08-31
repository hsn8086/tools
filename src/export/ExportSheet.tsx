import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Segmented, Slider, Switch } from '../ui/controls';
import { Sheet } from '../ui/Sheet';
import { useSnackbar } from '../ui/Snackbar';
import { IconCopy, IconDownload } from '../ui/icons';
import { BAOJIANG_PRESETS } from './baojiang';
import { renderCard } from './capture';
import { copyBlob, downloadBlob, stamp } from './save';

/**
 * 各工具共用的导出面板：分辨率倍率 / 包浆 / 水印 / 预览 / 下载复制。
 * 只认一个 shadow host 和一份水印状态，不关心里面画的是什么。
 */
export function ExportSheet({
  open,
  onClose,
  hostRef,
  fileName,
  watermark,
  onWatermarkChange,
  deps,
}: {
  open: boolean;
  onClose: () => void;
  hostRef: React.RefObject<HTMLDivElement | null>;
  /** 下载文件名前缀 */
  fileName: string;
  watermark: boolean;
  onWatermarkChange: (v: boolean) => void;
  /** 内容变了要重渲染，把内容对象传进来当依赖 */
  deps: unknown;
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
  }, [open, ratio, level, deps, render]);

  return (
    <Sheet open={open} onClose={onClose} title="导出">
      <div className="row">
        <span className="muted grow">分辨率倍率</span>
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
          checked={watermark}
          onChange={(v) => {
            onWatermarkChange(v);
            if (!v) snack('已去掉水印');
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
          onClick={() =>
            out && downloadBlob(out.blob, `${fileName}-${stamp()}.${out.blob.type === 'image/png' ? 'png' : 'jpg'}`)
          }
        >
          下载
        </Button>
      </div>
    </Sheet>
  );
}
