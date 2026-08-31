import type { QQData, QQItem } from './types';

export const IMG_MARK = (id: string) => `![${id}]`;

const NAME_LINE = /^\s*([^：:]{1,20})\s*[：:]\s*([\s\S]*)$/;
const TIME_LINE = /^\s*[[【]\s*([^\]】]{1,20})\s*[\]】]\s*$/;

/**
 * 剧本语法，一行一条：
 *   海月：不知道，反正前几年的 CSPS 一轮也做不明白
 *   [21:18]              ← 单独一行的方括号 = 时间分割线
 *   茯茶：今天只做了一题   ← 没有冒号的行接到上一条后面（多行消息）
 *   ![img_x]             ← 图片占位，由「插图」按钮写入
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

/** 让 people 和剧本对齐：新名字补默认头像，消失的名字保留（改回来还在） */
export function syncPeople(data: QQData, fallbackAvatar: string): QQData['people'] {
  const names = namesInScript(data.script);
  const kept = data.people.filter((p) => names.includes(p.name));
  const added = names
    .filter((n) => !data.people.some((p) => p.name === n))
    .map((name) => ({ name, avatar: fallbackAvatar, self: false }));
  const orphans = data.people.filter((p) => !names.includes(p.name) && p.avatar !== fallbackAvatar);
  return [...kept, ...added, ...orphans];
}
