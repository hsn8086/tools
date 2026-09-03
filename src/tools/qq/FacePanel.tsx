import { useEffect, useMemo, useRef, useState } from 'react';
import { QFACES, qfaceUrl } from './qface';

/**
 * 桌面端的表情面板。
 *
 * 移动端不弹这个 —— 屏幕就那么大，面板一开就把正在编辑的内容盖住了，
 * 那边继续用打 `/` 触发的补全（键盘本来就占半屏，补全条贴着光标反而更顺）。
 * 四百多个表情靠滚动找太慢，所以搜索框永远在最上面并自动聚焦。
 */
export function FacePanel({ onPick, onClose }: { onPick: (name: string) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener('keydown', onKey);
    // 捕获阶段：面板里点了什么由面板自己处理，外面点了就关
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [onClose]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return QFACES;
    return QFACES.filter(
      (f) => f.name.toLowerCase().includes(s) || f.words.some((w) => w.toLowerCase().includes(s))
    );
  }, [q]);

  return (
    <div className="face-panel" ref={box}>
      <input
        ref={input}
        className="face-search"
        value={q}
        placeholder={`搜表情（共 ${QFACES.length} 个）`}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && list.length) {
            e.preventDefault();
            onPick(list[0].name);
          }
        }}
      />
      <div className="face-grid">
        {list.map((f) => (
          <button key={f.name} type="button" title={f.name} onClick={() => onPick(f.name)}>
            {f.file ? <img src={qfaceUrl(f.file)} alt={f.name} loading="lazy" /> : <span>{f.char}</span>}
          </button>
        ))}
        {!list.length && <p className="hint">没有匹配的表情</p>}
      </div>
    </div>
  );
}
