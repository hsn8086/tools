import { useCallback, useEffect, useLayoutEffect, useRef, useState, type Ref } from 'react';
import { TextField } from '../../ui/controls';
import { QFACES, qfaceUrl } from './qface';

/**
 * 剧本输入框：打 `@` 补人名，打 `/` 补 QQ 表情。
 *
 * 两个触发字符走同一套逻辑 —— 都是「从光标往回找触发符，
 * 拿后面的字当查询词」。表情有两百多个，没有补全等于没有。
 */

interface Hit {
  /** 落到文本里的东西 */
  insert: string;
  label: string;
  icon?: string;
  char?: string;
}

const MAX = 30;

function nameHits(query: string, names: string[]): Hit[] {
  const q = query.toLowerCase();
  return names
    .filter((n) => !q || n.toLowerCase().includes(q))
    .slice(0, MAX)
    .map((n) => ({ insert: `@[${n}]`, label: n }));
}

function faceHits(query: string): Hit[] {
  const q = query.toLowerCase();
  const score = (f: (typeof QFACES)[number]) => {
    const n = f.name.toLowerCase();
    if (!q) return 0;
    if (n === q) return 0;
    if (n.startsWith(q)) return 1;
    if (n.includes(q)) return 2;
    if (f.words.some((w) => w.toLowerCase().includes(q))) return 3;
    return -1;
  };
  return QFACES.map((f) => [f, score(f)] as const)
    .filter(([, s]) => s >= 0)
    .sort((a, b) => a[1] - b[1])
    .slice(0, MAX)
    .map(([f]) => ({ insert: `/${f.name}`, label: f.name, icon: f.file ? qfaceUrl(f.file) : undefined, char: f.char }));
}

/**
 * 量光标在 textarea 里的像素位置。
 * 拿一个样式完全一致的镜像 div，把光标前的文本塞进去，
 * 末尾放个空 span，量它的位置 —— 没有别的办法拿到 caret 坐标。
 */
function caretXY(ta: HTMLTextAreaElement, at: number): { x: number; y: number } {
  const cs = getComputedStyle(ta);
  const mirror = document.createElement('div');
  const copy = [
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'letterSpacing',
    'padding',
    'border',
    'boxSizing',
    'whiteSpace',
    'wordWrap',
    'overflowWrap',
  ] as const;
  for (const k of copy) mirror.style[k] = cs[k];
  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.width = `${ta.clientWidth}px`;
  mirror.textContent = ta.value.slice(0, at);
  const marker = document.createElement('span');
  marker.textContent = '\u200b';
  mirror.appendChild(marker);
  document.body.appendChild(mirror);
  const x = marker.offsetLeft;
  const y = marker.offsetTop;
  mirror.remove();
  return { x: x - ta.scrollLeft, y: y - ta.scrollTop };
}

export function ScriptField({
  label,
  value,
  onChange,
  rows,
  names,
  select,
  ref,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  /** 补全用的人名字典 */
  names: string[];
  /**
   * 外面要求把光标放到某段上。
   * 用 seq 触发而不是 rAF：插入是 setState，DOM 里的值什么时候更新
   * 由 React 决定，rAF 经常跑在提交之前，选区就落到旧文本上了。
   * effect 在提交之后跑，这才是唯一可靠的时机。
   */
  select?: { start: number; end: number; seq: number; open?: boolean };
  ref?: Ref<HTMLTextAreaElement>;
}) {
  const inner = useRef<HTMLTextAreaElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<{ start: number; hits: Hit[]; x: number; y: number; query: string } | null>(null);
  const [active, setActive] = useState(0);
  /** 上一次的查询词。查询词没变就别动选中项，不然方向键刚挪一格就被重置回 0 */
  const lastQuery = useRef<string | null>(null);

  const setRefs = useCallback(
    (el: HTMLTextAreaElement | null) => {
      inner.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as { current: HTMLTextAreaElement | null }).current = el;
    },
    [ref]
  );

  /** 从光标往回找触发符，找到就算数 */
  const refresh = useCallback(() => {
    const ta = inner.current;
    if (!ta) return setMenu(null);
    const at = ta.selectionStart;
    if (at !== ta.selectionEnd) return setMenu(null);
    const line = ta.value.slice(0, at);
    // 触发符后面不能有空格、换行、方括号，不然就是已经写完了
    const m = /([@/])([^\s@/[\]]{0,12})$/.exec(line);
    if (!m) return setMenu(null);
    const start = at - m[1].length - m[2].length;
    // 前一个字符是英数或 /:._- 就不弹：挡掉 https://、路径和邮箱。
    // 中文后面直接跟 / 是常态（「好耶/庆祝」），所以只挡这些。
    if (/[A-Za-z0-9/:._-]/.test(line[start - 1] ?? '')) return setMenu(null);
    const query = m[1] + m[2];
    const hits = m[1] === '@' ? nameHits(m[2], names) : faceHits(m[2]);
    if (!hits.length) {
      lastQuery.current = null;
      return setMenu(null);
    }
    const { x, y } = caretXY(ta, start);
    if (lastQuery.current !== query) {
      lastQuery.current = query;
      setActive(0);
    }
    setMenu({ start, hits, x, y: y + parseFloat(getComputedStyle(ta).lineHeight || '20'), query });
  }, [names]);

  useLayoutEffect(() => {
    if (menu) refresh();
    // value 变了要重算，但 refresh 依赖 names，交给下面的 effect 统一处理
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!select) return;
    const ta = inner.current;
    if (!ta) return;
    ta.focus();
    ta.setSelectionRange(select.start, select.end);
    if (select.open) refresh();
    else setMenu(null);
  }, [select?.seq]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const close = () => {
      lastQuery.current = null;
      setMenu(null);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const accept = useCallback(
    (hit: Hit) => {
      const ta = inner.current;
      if (!ta || !menu) return;
      const at = ta.selectionStart;
      const next = value.slice(0, menu.start) + hit.insert + value.slice(at);
      const caret = menu.start + hit.insert.length;
      onChange(next);
      setMenu(null);
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(caret, caret);
      });
    },
    [menu, onChange, value]
  );

  return (
    <div className="script-field" ref={wrap}>
      <TextField
        label={label}
        multiline
        rows={rows}
        value={value}
        ref={setRefs}
        onChange={onChange}
        onKeyDown={(e) => {
          if (!menu) {
            // 打完触发符立刻弹出来，不用等下一个字
            if (e.key === '@' || e.key === '/') requestAnimationFrame(refresh);
            return;
          }
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((i) => (i + (e.key === 'ArrowDown' ? 1 : menu.hits.length - 1)) % menu.hits.length);
          } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            accept(menu.hits[active]);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            setMenu(null);
          }
        }}
        onKeyUp={(e) => {
          // 方向键和回车已经在 keydown 里处理过了，
          // 这里再刷一次只会把选中项打回原形
          if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(e.key)) return;
          refresh();
        }}
        onClick={refresh}
        onBlur={() =>
          // 延时是给菜单项的点击留时间；到点再确认一次焦点确实走了，
          // 不然「表情」按钮刚把菜单叫出来就被这个定时器关掉
          setTimeout(() => {
            if (document.activeElement !== inner.current) setMenu(null);
          }, 150)
        }
      />

      {menu && (
        <ul
          className="ac"
          style={{ left: menu.x, top: menu.y }}
          onPointerDown={(e) => e.preventDefault()}
          role="listbox"
        >
          {menu.hits.map((h, i) => (
            <li key={h.insert}>
              <button
                type="button"
                data-active={i === active || undefined}
                onPointerDown={(e) => {
                  e.preventDefault();
                  accept(h);
                }}
                onMouseEnter={() => setActive(i)}
              >
                {h.icon ? <img src={h.icon} alt="" /> : h.char ? <span className="ac-char">{h.char}</span> : null}
                {h.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
