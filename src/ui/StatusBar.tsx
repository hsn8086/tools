/**
 * iOS 状态栏。两个生成器共用，样式由各自 shadow 作用域里的 .status 规则决定，
 * 这里只负责结构和电量的画法。
 */
export function StatusBar({ time, battery, island }: { time: string; battery: number; island: boolean }) {
  return (
    <div className="status">
      {island && <div className="island" />}
      <div className="time">{time}</div>
      <div className="right">
        <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="1" opacity=".9" />
          <rect x="4.5" y="5.6" width="3" height="6.4" rx="1" opacity=".9" />
          <rect x="9" y="3" width="3" height="9" rx="1" opacity=".9" />
          <rect x="13.5" y="0.4" width="3" height="11.6" rx="1" opacity=".35" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
          <path d="M8 11.2 1 4.4a9.9 9.9 0 0 1 14 0Z" opacity=".9" />
        </svg>
        <svg width="26" height="13" viewBox="0 0 26 13" fill="none">
          <rect x="0.6" y="0.6" width="21" height="11.8" rx="3.4" stroke="currentColor" strokeWidth="1" opacity=".4" />
          <rect x="2.2" y="2.2" width={Math.max(1, (battery / 100) * 17.8)} height="8.6" rx="2" fill="currentColor" />
          <path d="M23.4 4.4c1.4.4 1.4 3.8 0 4.2z" fill="currentColor" opacity=".4" />
        </svg>
      </div>
    </div>
  );
}
