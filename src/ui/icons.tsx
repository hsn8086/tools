/**
 * Material Symbols 的路径数据，24×24 网格。
 * 直接内联而不是引整套图标字体：这里只用到十来个，字体文件的体积不值得。
 */
const Svg = ({ d, size = 24 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d={d} />
  </svg>
);

export const IconBack = () => <Svg d="M10 19l-7-7 7-7 1.4 1.4L6.8 11H21v2H6.8l4.6 4.6z" />;

export const IconForward = () => <Svg d="m14 18-1.4-1.45L16.15 13H4v-2h12.15L12.6 7.45 14 6l6 6z" />;

export const IconClose = () => (
  <Svg d="M6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6z" />
);

export const IconDelete = () => (
  <Svg d="M7 21q-.825 0-1.412-.587Q5 19.825 5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413Q17.825 21 17 21ZM17 6H7v13h10ZM9 17h2V8H9Zm4 0h2V8h-2Z" />
);

export const IconAdd = () => <Svg d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z" />;

export const IconBold = () => (
  <Svg d="M8 19V5h5.3q1.5 0 2.6.95T17 8.35q0 .95-.45 1.6t-1.15 1.05q.9.35 1.5 1.125T17.5 14q0 1.75-1.25 2.875T13.25 19Zm2.5-2.25h2.75q.75 0 1.25-.5t.5-1.25q0-.75-.5-1.25t-1.25-.5H10.5Zm0-5.75h2.6q.7 0 1.15-.45t.45-1.15q0-.7-.45-1.15T13.1 7.25h-2.6Z" />
);

export const IconLink = () => (
  <Svg d="M11 17H7q-2.075 0-3.537-1.463Q2 14.075 2 12t1.463-3.538Q4.925 7 7 7h4v2H7q-1.25 0-2.125.875T4 12q0 1.25.875 2.125T7 15h4Zm-3-4v-2h8v2Zm5 4v-2h4q1.25 0 2.125-.875T20 12q0-1.25-.875-2.125T17 9h-4V7h4q2.075 0 3.538 1.462Q22 9.925 22 12q0 2.075-1.462 3.537Q19.075 17 17 17Z" />
);

export const IconImage = () => (
  <Svg d="M5 21q-.825 0-1.412-.587Q3 19.825 3 19V5q0-.825.588-1.412Q4.175 3 5 3h14q.825 0 1.413.588Q21 4.175 21 5v14q0 .825-.587 1.413Q19.825 21 19 21Zm0-2h14V5H5v14Zm1-2h12l-3.75-5-3 4L9 13Z" />
);

export const IconDownload = () => (
  <Svg d="M12 16 7 11l1.4-1.45 2.6 2.6V4h2v8.15l2.6-2.6L17 11Zm-6 4q-.825 0-1.412-.587Q4 18.825 4 18v-3h2v3h12v-3h2v3q0 .825-.587 1.413Q18.825 20 18 20Z" />
);

export const IconCopy = () => (
  <Svg d="M9 18q-.825 0-1.412-.587Q7 16.825 7 16V4q0-.825.588-1.413Q8.175 2 9 2h9q.825 0 1.413.587Q20 3.175 20 4v12q0 .825-.587 1.413Q18.825 18 18 18Zm0-2h9V4H9v12Zm-4 6q-.825 0-1.412-.587Q3 20.825 3 20V6h2v14h11v2Z" />
);

export const IconPerson = () => (
  <Svg d="M12 12q-1.65 0-2.825-1.175Q8 9.65 8 8q0-1.65 1.175-2.825Q10.35 4 12 4q1.65 0 2.825 1.175Q16 6.35 16 8q0 1.65-1.175 2.825Q13.65 12 12 12Zm-8 8v-2.8q0-.85.438-1.563.437-.712 1.162-1.087 1.55-.775 3.15-1.163Q10.35 13 12 13t3.25.387q1.6.388 3.15 1.163.725.375 1.163 1.087Q20 16.35 20 17.2V20Z" />
);

export const IconExport = () => (
  <Svg d="M11 16V7.85l-2.6 2.6L7 9l5-5 5 5-1.4 1.45-2.6-2.6V16Zm-5 4q-.825 0-1.412-.587Q4 18.825 4 18v-3h2v3h12v-3h2v3q0 .825-.587 1.413Q18.825 20 18 20Z" />
);

/** 拖动手柄：MD3 列表项的六点 */
export const IconDrag = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="9" cy="5" r="1.6" />
    <circle cx="9" cy="12" r="1.6" />
    <circle cx="9" cy="19" r="1.6" />
    <circle cx="15" cy="5" r="1.6" />
    <circle cx="15" cy="12" r="1.6" />
    <circle cx="15" cy="19" r="1.6" />
  </svg>
);

/** 骰子。比 shuffle 那两根交叉箭头更直白，一眼是「随机」而不是「打乱顺序」 */
export const IconDice = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="currentColor" strokeWidth="1.8" />
    <g fill="currentColor">
      <circle cx="8.4" cy="8.4" r="1.35" />
      <circle cx="15.6" cy="8.4" r="1.35" />
      <circle cx="12" cy="12" r="1.35" />
      <circle cx="8.4" cy="15.6" r="1.35" />
      <circle cx="15.6" cy="15.6" r="1.35" />
    </g>
  </svg>
);

export const IconCamera = () => (
  <Svg d="M12 17.5q1.875 0 3.188-1.313Q16.5 14.875 16.5 13t-1.312-3.188Q13.875 8.5 12 8.5T8.813 9.812Q7.5 11.125 7.5 13t1.313 3.187Q10.125 17.5 12 17.5Zm0-2q-1.05 0-1.775-.725Q9.5 14.05 9.5 13t.725-1.775Q10.95 10.5 12 10.5t1.775.725q.725.725.725 1.775t-.725 1.775q-.725.725-1.775.725ZM4 21q-.825 0-1.412-.587Q2 19.825 2 19V7q0-.825.588-1.412Q3.175 5 4 5h3.15L9 3h6l1.85 2H20q.825 0 1.413.588Q22 6.175 22 7v12q0 .825-.587 1.413Q20.825 21 20 21Z" />
);
