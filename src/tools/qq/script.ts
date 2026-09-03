import type { PersonAttrs, QQData, QQItem, QQPerson, Reaction } from './types';

export const IMG_MARK = (id: string) => `![${id}]`;

const NAME_LINE = /^\s*([^：:]{1,20})\s*[：:]\s*([\s\S]*)$/;
const TIME_LINE = /^\s*[[【]\s*([^\]】]{1,20})\s*[\]】]\s*$/;
const RECALL_LINE = /^\s*[[【]\s*撤回\s*[\]】]\s*(.*)$/;
const SYS_LINE = /^\s*[[【]\s*系统\s*[\]】]\s*(.+)$/;
/**
 * 贴表情行：`+🐔2 ❤️2`，贴到上一条消息下面。
 * 要求至少有一个非 ASCII 字符，不然「+1，密室好」这种正文会被吃掉。
 */
const REACT_LINE = /^\s*\+\s*(\S[^\n]*)$/;

/**
 * 把 `+/庆祝2 ❤️@土豆@小鹿` 拆成表情、计数和贴的人。
 * 写了人名就以人数为准 —— 计数和名单对不上是最容易出的错，
 * 干脆让名单说了算。
 */
function parseReactions(rest: string): Reaction[] | null {
  const out: Reaction[] = [];
  for (const tok of rest.split(/\s+/)) {
    const who: string[] = [];
    const body = tok.replace(/@\[([^\]]+)\]|@([^\s@]{1,24})/g, (_, a, b) => {
      who.push((a ?? b).trim());
      return '';
    });
    const m = /^(\D+?)\s*(\d*)$/.exec(body);
    if (!m) return null;
    // 纯 ASCII 的不算表情，挡掉「+1」这种正文
    if (!/[^\u0000-\u007f]/.test(m[1])) return null;
    out.push({ emoji: m[1], count: who.length || (m[2] ? Number(m[2]) : 1), who });
  }
  return out.length ? out : null;
}

/**
 * 剧本语法，一行一条：
 *   海月：不知道，反正前几年的 CSPS 一轮也做不明白
 *   [21:18]              ← 单独一行的方括号 = 时间分割线
 *   茯茶：今天只做了一题   ← 没有冒号的行接到上一条后面（多行消息）
 *   ![img_x]             ← 图片占位，由「插图」按钮写入
 *   [撤回] 昵称           ← 「昵称撤回了一条消息」
 *   [系统] @甲 戳了戳@乙   ← 灰色居中行，@名字 变蓝
 *   +🐔2 ❤️2             ← 贴到上一条消息下面的表情回应
 *
 * 之所以不做成一条条卡片：聊天记录是顺序性极强的东西，
 * 打字比拖控件快得多，而且换人只是改一个名字。
 */
export function parseScript(script: string): QQItem[] {
  const items: QQItem[] = [];
  let seq = 0;
  const id = () => `i${seq++}`;
  let last: Extract<QQItem, { kind: 'msg' }> | null = null;

  for (const raw of script.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) {
      last = null; // 空行断开续行
      continue;
    }

    const rc = RECALL_LINE.exec(line);
    if (rc) {
      // 补全插进来的可能是 @[名字]，剥掉外壳再存
      const who = rc[1].trim().replace(/^@\[([^\]]+)\]$/, '$1').replace(/^@/, '');
      items.push({ kind: 'recall', id: id(), name: who });
      last = null;
      continue;
    }

    const sy = SYS_LINE.exec(line);
    if (sy) {
      items.push({ kind: 'sys', id: id(), text: sy[1].trim() });
      last = null;
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

    const t = TIME_LINE.exec(line);
    if (t) {
      items.push({ kind: 'time', id: id(), text: t[1] });
      last = null;
      continue;
    }

    const m = NAME_LINE.exec(line);
    if (m) {
      const msg: Extract<QQItem, { kind: 'msg' }> = { kind: 'msg', id: id(), name: m[1].trim(), text: m[2] };
      items.push(msg);
      last = msg;
      continue;
    }

    if (last) {
      last.text += '\n' + line;
    } else {
      // 开头就没写名字，挂到一个空名字上，渲染时不显示昵称
      const msg: Extract<QQItem, { kind: 'msg' }> = { kind: 'msg', id: id(), name: '', text: line };
      items.push(msg);
      last = msg;
    }
  }

  // 把整条消息就是一张图的情况拆出来
  return items.map((it) => {
    if (it.kind !== 'msg') return it;
    const only = /^\s*!\[([^\]]+)\]\s*$/.exec(it.text);
    return only ? { ...it, text: '', imageId: only[1] } : it;
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
export function peopleInScript(data: QQData, fallbackAvatar: string): QQPerson[] {
  return namesInScript(data.script).map((name) => ({
    name,
    ...attrsOf(data, name, fallbackAvatar),
  }));
}

export function attrsOf(data: QQData, name: string, fallbackAvatar: string): PersonAttrs {
  return data.roster[name] ?? { avatar: fallbackAvatar, self: false, title: '' };
}
