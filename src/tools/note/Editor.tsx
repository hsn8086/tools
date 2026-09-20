import { useEffect, useRef, useState } from 'react';
import { Button, IconButton, Segmented, Slider, Switch, TextField } from '../../ui/controls';
import { IconDice, IconExport, IconLink } from '../../ui/icons';
import { ShadowScope } from '../../ui/ShadowScope';
import { usePreviewLayout } from '../../ui/usePreviewLayout';
import { useSnackbar } from '../../ui/Snackbar';
import { ExportSheet } from '../../export/ExportSheet';
import { NoteCard } from './Card';
import { accents, defaultData, load, ratios, STORE_KEY, templates, templateUrl, type NoteData } from './model';
import cardCss from './card.css?inline';
import './editor.css';

export function NoteEditor() {
  const [data, setData] = useState(load);
  const [exporting, setExporting] = useState(false);
  const [fallbackLink, setFallbackLink] = useState('');
  const snack = useSnackbar();
  const warned = useRef(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  usePreviewLayout(frameRef, innerRef, hostRef, 0.1);
  useEffect(() => {
    const timer = setTimeout(() => {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
      catch { if (!warned.current) { warned.current = true; snack('草稿未能保存到浏览器'); } }
    }, 400);
    return () => clearTimeout(timer);
  }, [data, snack]);
  const patch = <K extends keyof NoteData>(key: K, value: NoteData[K]) => setData(d => ({ ...d, [key]: value }));
  const reset = () => { if (confirm('恢复默认便签？')) setData(defaultData()); };
  const share = async () => {
    const link = templateUrl(data);
    try { await navigator.clipboard.writeText(link); snack('已复制模板链接，不含正文'); setFallbackLink(''); }
    catch { setFallbackLink(link); }
  };
  return <>
    <div className="tool-layout note-tool">
      <div className="editor-col">
        <section className="section">
          <div className="section-head"><h4>内容</h4><span className="muted">{data.text.length} / 280</span></div>
          <TextField label="正文" multiline rows={4} value={data.text} onChange={v => patch('text', v.slice(0, 280))} />
          <div className="note-fields">
            <TextField label="标签" value={data.label} onChange={v => patch('label', v.slice(0, 24))} />
            <TextField label="署名" value={data.signature} onChange={v => patch('signature', v.slice(0, 40))} />
          </div>
        </section>
        <section className="section">
          <div className="section-head"><h4>风格</h4><IconButton label="随机风格" onClick={() => {
            const others = templates.filter(t => t.id !== data.template);
            patch('template', others[Math.floor(Math.random() * others.length)].id);
          }}><IconDice /></IconButton></div>
          <div className="note-templates" role="group" aria-label="便签风格">
            {templates.map(t => <button key={t.id} type="button" className="note-template" aria-pressed={data.template === t.id}
              onClick={() => patch('template', t.id)}>
              <span className="note-thumbnail"><ShadowScope css={cardCss} aria-hidden="true">
                <NoteCard data={{ ...defaultData(), template: t.id, text: '把想法\n留在这里。', watermark: { show: false, mode: 'quiet', qr: false } }} />
              </ShadowScope></span><span>{t.name}</span>
            </button>)}
          </div>
          <div className="row"><span className="muted grow">画布比例</span><Segmented value={data.ratio} onChange={v => patch('ratio', v)} options={ratios.map(value => ({ value, label: value }))} /></div>
        </section>
        <section className="section">
          <div className="section-head"><h4>排版</h4></div>
          <div className="row"><span className="muted grow">字体</span><Segmented value={data.font} onChange={v => patch('font', v)} options={[
            { value: 'auto' as const, label: '随风格' }, { value: 'sans' as const, label: '黑体' }, { value: 'serif' as const, label: '宋体' },
          ]} /></div>
          <div className="row"><span className="muted grow">对齐</span><Segmented value={data.align} onChange={v => patch('align', v)} options={[
            { value: 'left' as const, label: '居左' }, { value: 'center' as const, label: '居中' },
          ]} /></div>
          <div><div className="row"><span className="muted grow">字号上限</span><output>{data.fontSize} px</output></div>
            <Slider label="字号上限" min={22} max={52} value={data.fontSize} onChange={v => patch('fontSize', v)} /></div>
          {['index', 'editorial', 'postcard'].includes(data.template) && <div className="row"><span className="muted grow">强调色</span>
            <div className="note-swatches" role="group" aria-label="强调色">{accents.map((color, i) => <button key={color} type="button" style={{ background: color }}
              aria-label={['松绿', '莓红', '湖蓝', '紫藤'][i]} title={['松绿', '莓红', '湖蓝', '紫藤'][i]} aria-pressed={data.accent === color} onClick={() => patch('accent', color)} />)}</div></div>}
        </section>
        <section className="section">
          <div className="section-head"><h4>出处</h4></div>
          <Switch label="保留出处" checked={data.watermark.show} onChange={show => patch('watermark', { ...data.watermark, show })} />
          {data.watermark.show && <>
            <div className="row"><span className="muted grow">样式</span><Segmented value={data.watermark.mode} onChange={mode => patch('watermark', { ...data.watermark, mode })} options={[
              { value: 'invite' as const, label: '同款入口' }, { value: 'quiet' as const, label: '简洁' },
            ]} /></div>
            <Switch label="加入二维码" checked={data.watermark.qr} onChange={qr => patch('watermark', { ...data.watermark, qr })} />
          </>}
          <div><Button icon={<IconLink />} onClick={() => void share()}>复制模板链接</Button></div>
          {fallbackLink && <TextField label="模板链接" value={fallbackLink} onChange={() => {}} />}
        </section>
      </div>
      <div className="preview-col"><div className="preview-panel">
        <div className="preview-frame" ref={frameRef}><div className="preview-inner" ref={innerRef}>
          <ShadowScope css={cardCss} ref={hostRef}><NoteCard data={data} /></ShadowScope>
        </div></div>
        <div className="preview-actions"><Button variant="text" onClick={reset}>重置</Button>
          <Button variant="filled" className="grow" icon={<IconExport />} onClick={() => setExporting(true)}>导出图片</Button></div>
      </div></div>
    </div>
    <div className="bottom-bar"><Button variant="text" onClick={reset}>重置</Button>
      <Button variant="filled" className="grow" icon={<IconExport />} onClick={() => setExporting(true)}>导出图片</Button></div>
    <ExportSheet open={exporting} onClose={() => setExporting(false)} hostRef={hostRef} fileName={`note-${data.template}`} deps={data}
      watermark={data.watermark.show} watermarkLabel="保留出处" onWatermarkChange={show => patch('watermark', { ...data.watermark, show })} />
  </>;
}
