import type { PersonAttrs, TGData, TGItem, TGPerson, Reaction } from './types';

export const IMG_MARK = (id: string) => `![${id}]`;

const NAME_LINE = /^\s*([^：:]{1,24})\s*[：:]\s*([\s\S]*)$/;
const DATE_LINE = /^\s*[[【]\s*([^\]】]{1,24})\s*[\]】]\s*$/;
const REPLY_LINE = /^\s*[[【]\s*(?:引用|回复)\s*[\]】]\s*(.*)$/;
const FORWARD_LINE = /^\s*[[【]\s*(?:转发|fwd)\s*[\]】]\s*(.+)$/;
const SYS_LINE = /^\s*[[【]\s*系统\s*[\]】]\s*(.+)$/;
const CLOCK_LINE = /^\s*[[【]\s*(?:时刻|时间)\s*[\]】]\s*(\S{1,16})\s*$/;
const VOICE_MARK = /^\s*[[【]\s*(?:语音|voice)\s*[\]】]\s*(\S{1,12})\s*$/;
const REACT_LINE = /^\s*\+\s*(\S[^\n]*)$/;

/** `+❤️2 👍3` 拆成表情和计数，贴到上一条消息下面 */
function parseReactions(rest: string): Reaction[] | null {
  const out: Reaction[] = [];
  for (const tok of rest.split(/\s+/)) {
    const m = /^(\D+?)\s*(\d*)$/.exec(tok);
    if (!m) return null;
    // 纯 ASCII 的不算表情，挡掉「+1」「+10086」这种正文
    if (!/[^\u0000-\u007f]/.test(m[1])) return null;
    out.push({ emoji: m[1], count: m[2] ? Number(m[2]) : 1 });
  }
  return out.length ? out : null;
}

/**
 * 剧本语法，一行一条：
 *   Serafina：今晚吃什么
 *   [9月4日]                ← 日期药丸，居中
 *   [引用] Serafina：scoop salad   ← 挂到下一条消息上，气泡里带绿条
 *   [转发] hsn.recipe       ← 下一条消息标「Forwarded from:」
 *   我：[语音] 0:12          ← 语音条
 *   ![img_x]                ← 图片，写在名字后面就是带文字说明的图
 *   +❤️2 👍3               ← 贴到上一条消息下面的表情回应
 *   [时刻] 21:30            ← 后面消息的时间从这接着走（每条自动 +1 分钟）
 *   [系统] xxx 置顶了一条消息    ← 居中灰字
 *   Serafina：👍             ← 整条只有表情就放大、不带气泡
 *
 * 之所以不做成一条条卡片：聊天记录是顺序性极强的东西，
 * 打字比拖控件快得多，而且换人只是改一个名字。
 */
export function parseScript(script: string): TGItem[] {
  const items: TGItem[] = [];
  let seq = 0;
  const id = () => `i${seq++}`;
  let last: Extract<TGItem, { kind: 'msg' }> | null = null;
  let pendReply: { name: string; text: string } | null = null;
  let pendForward: string | null = null;

  for (const raw of script.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) {
      last = null; // 空行断开续行
      continue;
    }

    const sy = SYS_LINE.exec(line);
    if (sy) {
      items.push({ kind: 'sys', id: id(), text: sy[1].trim() });
      last = null;
      continue;
    }

    const ck = CLOCK_LINE.exec(line);
    if (ck) {
      items.push({ kind: 'clock', id: id(), text: ck[1] });
      last = null;
      continue;
    }

    const rp = REPLY_LINE.exec(line);
    if (rp) {
      const m = NAME_LINE.exec(rp[1]);
      pendReply = m ? { name: m[1].trim(), text: m[2].trim() } : { name: '', text: rp[1].trim() };
      continue;
    }

    const fw = FORWARD_LINE.exec(line);
    if (fw) {
      pendForward = fw[1].trim();
      continue;
    }

    const rx = REACT_LINE.exec(line);
    if (rx && last) {
      const reactions = parseReactions(rx[1]);
      if (reactions) {
        last.reactions = [...(last.reactions ?? []), ...reactions];
        continue;
      }
    }

    const dt = DATE_LINE.exec(line);
    if (dt) {
      items.push({ kind: 'date', id: id(), text: dt[1].trim() });
      last = null;
      continue;
    }

    const m = NAME_LINE.exec(line);
    if (m) {
      const body = m[2];
      const vm = VOICE_MARK.exec(body);
      const msg: Extract<TGItem, { kind: 'msg' }> = {
        kind: 'msg',
        id: id(),
        name: m[1].trim(),
        text: vm ? '' : body,
        ...(vm ? { voice: vm[1] } : {}),
        ...(pendReply ? { replyTo: pendReply } : {}),
        ...(pendForward ? { forward: pendForward } : {}),
      };
      items.push(msg);
      last = msg;
      pendReply = pendForward = null;
      continue;
    }

    if (last) {
      last.text += '\n' + line;
    } else {
      // 开头就没写名字，挂到一个空名字上
      const msg: Extract<TGItem, { kind: 'msg' }> = {
        kind: 'msg',
        id: id(),
        name: '',
        text: line,
        ...(pendReply ? { replyTo: pendReply } : {}),
        ...(pendForward ? { forward: pendForward } : {}),
      };
      items.push(msg);
      last = msg;
      pendReply = pendForward = null;
    }
  }

  // 把 `![id]` 从正文里摘出来：单独一行是纯图，后面带字是带说明的图
  return items.map((it) => {
    if (it.kind !== 'msg') return it;
    const m = /!\[([^\]]+)\]/.exec(it.text);
    if (!m) return it;
    const text = (it.text.slice(0, m.index) + it.text.slice(m.index + m[0].length)).trim();
    return { ...it, text, imageId: m[1] };
  });
}

/** 剧本里出现过的昵称，按首次出现排序 */
export function namesInScript(script: string): string[] {
  const seen: string[] = [];
  for (const it of parseScript(script)) {
    if (it.kind === 'msg' && it.name && !seen.includes(it.name)) seen.push(it.name);
  }
  return seen;
}

/** 剧本里现在有的人，配上各自存着的设定 */
export function peopleInScript(data: TGData): TGPerson[] {
  return namesInScript(data.script).map((name) => ({
    name,
    ...attrsOf(data, name),
  }));
}

export function attrsOf(data: TGData, name: string): PersonAttrs {
  return data.roster[name] ?? { self: false };
}

/**
 * 每条消息的时间：`clock` 是起点，顺序一条 +1 分钟。
 * [时刻] 系统行把钟拨回去。格式就是普通的「时:分」或「h:mm AM/PM」。
 */
export function clockOf(items: TGItem[], base: string): Map<string, string> {
  const out = new Map<string, string>();
  let t = parseClock(base);
  for (const it of items) {
    if (it.kind === 'clock') {
      t = parseClock(it.text);
      continue;
    }
    if (it.kind === 'msg') {
      out.set(it.id, fmtClock(t));
      t += 1;
    }
  }
  return out;
}

function parseClock(s: string): number {
  const m = /(\d{1,2})[:：.](\d{2})\s*(am|pm|AM|PM)?/.exec(s.trim());
  if (!m) return 20 * 60 + 52;
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (m[3]) {
    const pm = m[3].toLowerCase() === 'pm';
    if (pm && h < 12) h += 12;
    if (!pm && h === 12) h = 0;
  }
  return h * 60 + min;
}

function fmtClock(t: number): string {
  const h = Math.floor(t / 60) % 24;
  const m = t % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/** 整条消息只有表情（≤4 个），画成大贴纸不带气泡 */
export function isBareEmoji(text: string): boolean {
  const s = text.trim();
  if (!s || s.length > 14) return false;
  if (/[a-zA-Z0-9一-鿿]/.test(s)) return false;
  const graphemes = s.split(/\s+/).filter(Boolean);
  return graphemes.length <= 4 && /\p{Extended_Pictographic}/u.test(s);
}

/** TG 给每个人的名字色，按名字散列到固定调色板 */
const NAME_COLORS = ['#f15b5b', '#e8a23d', '#a37ee1', '#53c05c', '#38a3d1', '#3a78c9', '#c0629f'];
export function nameColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return NAME_COLORS[h % NAME_COLORS.length];
}
