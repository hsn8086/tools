import { Sheet } from '../../ui/Sheet';

/**
 * 完整语法收在这里。
 * 常驻提示只留「怎么写一条消息」，剩下六种写法平时不该占着版面 ——
 * 真要查的时候一次看全，比在正文里塞一段小字有用。
 */
const ROWS: [string, string][] = [
  ['昵称：内容', '一条消息。下一行不写昵称就接在上一条后面'],
  ['[21:18]', '时间分隔线'],
  ['[撤回] 昵称', '「昵称撤回了一条消息」'],
  ['[系统] @[甲]👉戳了戳@[乙]的头', '灰色居中的系统行，@[名字] 显示成蓝色'],
  ['+/庆祝@[土豆]', '给上一条消息表态；表的是自己的消息会自动补一行「回应了你的消息」'],
  ['/庆祝', 'QQ 表情，输入 / 有补全'],
  ['@[土豆]', '@ 某人，输入 @ 有补全'],
  ['![图片 id]', '图片，由「图片」按钮写入'],
];

export function SyntaxSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="剧本语法">
      <dl className="syntax">
        {ROWS.map(([code, desc]) => (
          <div key={code}>
            <dt>
              <code>{code}</code>
            </dt>
            <dd>{desc}</dd>
          </div>
        ))}
      </dl>
    </Sheet>
  );
}
