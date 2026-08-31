import { useRef, useState } from 'react';
import { IconCamera, IconClose } from './icons';
import { readImageFile } from './file';

/**
 * 头像就是那个按钮。
 * 之前旁边挂一个「上传」按钮，等于让人先看懂两个东西才知道点哪个；
 * 现在点头像本身就是换，图拖上去、粘贴板里的图 Cmd+V 也认。
 */
export function AvatarPicker({
  src,
  label,
  size = 44,
  onPick,
  onReset,
}: {
  src: string;
  label: string;
  size?: number;
  onPick: (dataUrl: string) => void;
  /** 传了才显示右上角那颗「恢复默认」 */
  onReset?: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const take = async (file?: File | null) => {
    if (file?.type.startsWith('image/')) onPick(await readImageFile(file));
  };

  return (
    <div className="avatar-pick" style={{ '--sz': `${size}px` } as React.CSSProperties} data-over={over || undefined}>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          await take(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        aria-label={label}
        title="点一下换图，也可以把图拖进来或直接粘贴"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void take(e.dataTransfer.files?.[0]);
        }}
        onPaste={(e) => {
          const file = e.clipboardData.files?.[0];
          if (file) {
            e.preventDefault();
            void take(file);
          }
        }}
      >
        <img src={src} alt="" />
        <span className="veil">
          <IconCamera />
        </span>
      </button>

      {onReset && (
        <button type="button" className="reset" aria-label="恢复默认头像" title="恢复默认头像" onClick={onReset}>
          <IconClose />
        </button>
      )}
    </div>
  );
}
