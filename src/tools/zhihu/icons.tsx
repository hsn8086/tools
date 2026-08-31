import type { BadgeKind } from './types';

export const Chevron = ({ size = 12, dir = 'right' }: { size?: number; dir?: 'right' | 'down' }) => (
  <svg
    className="chev"
    width={size}
    height={size}
    viewBox="0 0 12 12"
    fill="none"
    style={dir === 'down' ? { transform: 'rotate(90deg)' } : undefined}
  >
    <path d="M4 2.2 7.9 6 4 9.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const DoubleChevronDown = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <path d="M4.5 5.2 9 9.2l4.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.5 9.6 9 13.6l4.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Plus = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M6 1.6v8.8M1.6 6h8.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const ShareIcon = ({ size = 20 }: { size?: number }) => (
  <svg className="share" width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M3 13.2c1.6-4.6 5-6.6 9-6.7V3.4l4.8 5-4.8 5v-3.1c-3.6-.2-6.6.8-9 2.9Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
);

export const HeadphoneIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M2.2 9V7a4.8 4.8 0 0 1 9.6 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <rect x="1" y="8.4" width="2.8" height="4" rx="1.2" fill="currentColor" />
    <rect x="10.2" y="8.4" width="2.8" height="4" rx="1.2" fill="currentColor" />
  </svg>
);

export const Badge = ({ kind }: { kind: BadgeKind }) => {
  if (kind === 'none') return null;
  if (kind === 'gold')
    return (
      <svg className="badge" width="15" height="15" viewBox="0 0 15 15">
        <circle cx="7.5" cy="7.5" r="7" fill="#E8B339" />
        <circle cx="7.5" cy="7.5" r="5.2" fill="none" stroke="#fff" strokeWidth="1" opacity=".85" />
        <path d="M5 7.7 6.7 9.4 10 6" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (kind === 'org')
    return (
      <svg className="badge" width="15" height="15" viewBox="0 0 15 15">
        <circle cx="7.5" cy="7.5" r="7" fill="#0084FF" />
        <path d="M4.8 7.6 6.6 9.4 10.2 5.8" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  return (
    <svg className="badge" width="15" height="15" viewBox="0 0 15 15">
      <rect x="0.5" y="0.5" width="14" height="14" rx="4.5" fill="#0084FF" />
      <path d="M3.6 5.2h7.8v4.6H3.6z" fill="none" stroke="#fff" strokeWidth="1" strokeLinejoin="round" />
      <path d="m3.6 5.4 3.9 2.7 3.9-2.7" fill="none" stroke="#fff" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
};

export const StatusIcons = ({ battery }: { battery: number }) => (
  <>
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
  </>
);
