import { SITE_URL } from '../../site';

export const templates = [
  { id: 'poster', name: '色块海报', ink: '#202424', paper: '#e4ef73' },
  { id: 'index', name: '索引便签', ink: '#183d36', paper: '#e3f1ec' },
  { id: 'ticket', name: '灵感票据', ink: '#28272d', paper: '#f7dce4' },
  { id: 'editorial', name: '独立刊物', ink: '#242424', paper: '#f5f5f2' },
  { id: 'terminal', name: '像素终端', ink: '#d7f8ac', paper: '#222927' },
  { id: 'postcard', name: '湖畔来信', ink: '#173a46', paper: '#e4eef2' },
] as const;
export type Template = typeof templates[number]['id'];
export const ratios = ['3:4', '1:1', '4:5'] as const;
export const accents = ['#31745e', '#ba354e', '#305fa8', '#72549b'] as const;
export type NoteData = {
  text: string;
  label: string;
  signature: string;
  template: Template;
  ratio: typeof ratios[number];
  accent: string;
  fontSize: number;
  align: 'left' | 'center';
  font: 'auto' | 'sans' | 'serif';
  watermark: { show: boolean; mode: 'invite' | 'quiet'; qr: boolean };
};
export const STORE_KEY = 'tools.note.v1';
export const defaultData = (): NoteData => ({
  text: '多出的一小时，\n你想留给什么？',
  label: '今日一问', signature: '', template: 'poster', ratio: '3:4',
  accent: accents[0], fontSize: 38, align: 'left', font: 'auto',
  watermark: { show: true, mode: 'invite', qr: true },
});

export const cardHeight = (ratio: NoteData['ratio']) => ratio === '1:1' ? 375 : ratio === '4:5' ? 469 : 500;
const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T): T =>
  options.includes(v as T) ? v as T : fallback;

export function normalize(value: unknown): NoteData {
  const d = defaultData();
  if (!value || typeof value !== 'object') return d;
  const v = value as Record<string, unknown>;
  const wm = v.watermark as Record<string, unknown> | undefined;
  return {
    text: typeof v.text === 'string' ? v.text.slice(0, 280) : d.text,
    label: typeof v.label === 'string' ? v.label.slice(0, 24) : d.label,
    signature: typeof v.signature === 'string' ? v.signature.slice(0, 40) : d.signature,
    template: oneOf(v.template, templates.map(t => t.id), d.template),
    ratio: oneOf(v.ratio, ratios, d.ratio),
    accent: oneOf(v.accent, accents, d.accent),
    fontSize: typeof v.fontSize === 'number' && Number.isFinite(v.fontSize) ? Math.max(22, Math.min(52, v.fontSize)) : d.fontSize,
    align: oneOf(v.align, ['left', 'center'], d.align),
    font: oneOf(v.font, ['auto', 'sans', 'serif'], d.font),
    watermark: { show: typeof wm?.show === 'boolean' ? wm.show : true, mode: oneOf(wm?.mode, ['invite', 'quiet'], 'invite'), qr: typeof wm?.qr === 'boolean' ? wm.qr : true },
  };
}

export function load(): NoteData {
  let data = defaultData();
  try { data = normalize(JSON.parse(localStorage.getItem(STORE_KEY) || 'null')); } catch { /* Use the default for an unreadable draft. */ }
  const params = new URLSearchParams(location.search);
  const style = params.get('style') ?? (params.has('s') ? templates[Number(params.get('s'))]?.id : null);
  if (!templates.some(t => t.id === style)) return data;
  return normalize({ ...data, template: style, ratio: params.get('ratio') ?? data.ratio,
    accent: params.get('accent') ?? data.accent, font: params.get('font') ?? data.font,
    align: params.get('align') ?? data.align, fontSize: params.has('size') ? Number(params.get('size')) : data.fontSize });
}

export function templateUrl(data: NoteData): string {
  const url = new URL('/note', SITE_URL);
  url.search = new URLSearchParams({ style: data.template, ratio: data.ratio, accent: data.accent,
    font: data.font, align: data.align, size: String(data.fontSize), utm_source: 'share', utm_medium: 'template' }).toString();
  return url.href;
}

export function imageUrl(data: NoteData): string {
  return `${new URL(SITE_URL).host}/note?style=${data.template}`;
}

export function qrUrl(data: NoteData): string {
  const style = templates.findIndex(t => t.id === data.template);
  return `${SITE_URL}/note?s=${style}`;
}
