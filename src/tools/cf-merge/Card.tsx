import { useMemo } from 'react';
import { DEFAULT_SEED, schemeVars } from '../../design/theme';
import {
  TIERS,
  deltaColors,
  hairline,
  sourceColor as sourceHex,
  tierBand,
  tierColors,
  tierOf,
  type Tier,
} from './tiers';
import { WATERMARK } from './defaults';
import type { CfData, CfPoint } from './types';

const CHART_W = 342;
const CHART_H = 168;
/** 右边留给段位名的余地。要能装下最长的那个名字，否则最后一个点就压在字上 */
const LABEL_GUTTER = 62;

export function CfCard({ data }: { data: CfData }) {
  const dark = data.theme === 'dark';
  const vars = useMemo(() => schemeVars(DEFAULT_SEED, dark), [dark]);
  const points = data.result?.points ?? [];
  const handles = data.result?.handles ?? [];

  const last = points.at(-1);
  const rating = last?.rating ?? 0;
  const tier = tierOf(rating);
  const tc = tierColors(tier, dark);
  const peak = points.reduce((a, p) => Math.max(a, p.rating), 0);
  const ups = points.filter((p) => p.delta > 0).length;

  const sourceColor = (handle: string) => sourceHex(Math.max(0, handles.indexOf(handle)), dark);

  const style = {
    ...vars,
    '--tier': tc.solid,
    '--tier-container': tc.container,
    '--on-tier-container': tc.onContainer,
    '--cf-hairline': hairline(dark),
  } as React.CSSProperties;

  return (
    <div className="cf" style={style} data-theme={data.theme}>
      <header className="cf-head">
        <span className="cf-eyebrow">Codeforces</span>
        <h2>{data.title || '虚拟账号'}</h2>
        <div className="cf-handles">
          {handles.map((h) => (
            <span className="cf-handle" key={h}>
              <i style={{ background: sourceColor(h) }} />
              {h}
            </span>
          ))}
        </div>
      </header>

      {/* 段位不再做成胶囊：一个小色块挂在 62px 数字旁边，上方一大块空，重心是歪的。
          改成右侧一列文字，段位名叠区间，正好填满数字的高度，也顺便说清楚“1572 属于哪一档” */}
      <div className="cf-hero">
        <span className="cf-rating">{rating}</span>
        <span className="cf-hero-meta">
          <span className="cf-tier-name">{tier.name}</span>
          <span className="cf-tier-range">{tierRange(tier)}</span>
        </span>
      </div>

      {points.length > 1 ? (
        <div className="cf-plot">
          <div className="cf-chart">
            <Chart points={points} sourceColor={sourceColor} dark={dark} showSources={data.showSources} />
          </div>
          <div className="cf-axis">
            <span>{points[0].date}</span>
            <span>{last!.date}</span>
          </div>
        </div>
      ) : (
        <div className="cf-empty">还没有数据，先点一下「合并计算」</div>
      )}

      {/* 三个数放一块面板里用细线分栏，而不是三块各自上色的方砖：
          这一行是注脚，不该比上面那个大数字还热闹 */}
      <div className="cf-stats">
        <div className="cf-stat">
          <span className="cf-stat-v">{points.length}</span>
          <span className="cf-stat-l">场次</span>
        </div>
        <div className="cf-stat">
          <span className="cf-stat-v" style={{ color: tierColors(tierOf(peak), dark).solid }}>
            {peak}
          </span>
          <span className="cf-stat-l">最高</span>
        </div>
        <div className="cf-stat">
          <span className="cf-stat-v">
            {ups}
            <em>/{points.length}</em>
          </span>
          <span className="cf-stat-l">上涨</span>
        </div>
      </div>

      {data.showRecent && points.length > 0 && (
        <div className="cf-recent">
          {points
            .slice(-4)
            .reverse()
            .map((p) => {
              const dc = deltaColors(p.delta >= 0, dark);
              return (
                <div className="cf-row" key={p.contestId}>
                  <i className="cf-dot" style={{ background: sourceColor(p.handle) }} />
                  <span className="cf-name">{shortName(p.contestName)}</span>
                  <span className="cf-rank">#{p.rank.toLocaleString()}</span>
                  <span className="cf-delta" style={{ background: dc.bg, color: dc.fg }}>
                    {p.delta >= 0 ? `+${p.delta}` : p.delta}
                  </span>
                </div>
              );
            })}
        </div>
      )}

      {data.watermark.show && <div className="cf-mark">{WATERMARK}</div>}
    </div>
  );
}

/** 这一档的分数区间，最高一档写成「3000+」 */
function tierRange(tier: Tier) {
  const next = TIERS[TIERS.indexOf(tier) + 1];
  const from = Number.isFinite(tier.min) ? tier.min : 0;
  return next ? `${from}–${next.min - 1}` : `${from}+`;
}

/** 「Codeforces Round 1118 (Div. 2)」→「Round 1118 (Div. 2)」，卡片一行放得下 */
const shortName = (name: string) => name.replace(/^Codeforces\s+/, '').replace(/\s*\(Rated for Div\. 2\)/, '');

function Chart({
  points,
  sourceColor,
  dark,
  showSources,
}: {
  points: CfPoint[];
  sourceColor: (handle: string) => string;
  dark: boolean;
  showSources: boolean;
}) {
  const values = points.map((p) => p.rating);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  // 上下留白只要别让线贴边就行，留多了下半张全是空的
  const pad = Math.max(50, (hi - lo) * 0.05);
  const y0 = Math.max(0, Math.floor((lo - pad) / 100) * 100);
  const y1 = Math.ceil((hi + pad) / 100) * 100;

  const x = (i: number) => 6 + (i * (CHART_W - 6 - LABEL_GUTTER)) / (points.length - 1);
  const y = (v: number) => CHART_H - ((v - y0) / (y1 - y0)) * CHART_H;

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.rating).toFixed(1)}`).join(' ');

  const peakIdx = values.indexOf(hi);
  const lastIdx = points.length - 1;

  // 每一档都铺一条带子，图就变成五颜六色的表格。只给阀值画发丝线做刻度，
  // 再把当前所在的那一档淡淡染上，“人在哪里”一眼就看得到
  const current = tierOf(values[lastIdx]);
  const currentTop = TIERS[TIERS.indexOf(current) + 1]?.min ?? Infinity;
  const zone = { from: Math.max(current.min, y0), to: Math.min(currentTop, y1) };
  const thresholds = TIERS.filter((t) => Number.isFinite(t.min) && t.min > y0 && t.min < y1);

  return (
    <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} width={CHART_W} height={CHART_H} role="img" aria-label="rating 变化">
      {zone.to > zone.from && (
        <rect x="0" y={y(zone.to)} width={CHART_W} height={y(zone.from) - y(zone.to)} fill={tierBand(current, dark)} />
      )}

      {thresholds.map((tier) => (
        <g key={tier.name}>
          <line x1="0" y1={y(tier.min)} x2={CHART_W} y2={y(tier.min)} stroke="var(--cf-hairline)" strokeWidth="1" />
          {/* 段位名写在线上方：这条线以上就是那一档 */}
          <text
            x={CHART_W - 8}
            y={y(tier.min) - 5}
            textAnchor="end"
            fill="var(--md-on-surface-variant)"
            fontSize="9"
            letterSpacing="0.02em"
            opacity="0.8"
          >
            {tier.name}
          </text>
        </g>
      ))}

      {showSources ? (
        points
          .slice(1)
          .map((p, i) => (
            <path
              key={p.contestId}
              d={`M${x(i).toFixed(1)},${y(points[i].rating).toFixed(1)} L${x(i + 1).toFixed(1)},${y(p.rating).toFixed(1)}`}
              fill="none"
              stroke={sourceColor(p.handle)}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          ))
      ) : (
        <path d={line} fill="none" stroke="var(--tier)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      )}

      {/* 峰值标一个空心点。离终点太近就不标了：两个圈叠在一起只会让人分不清哪个是当前分 */}
      {lastIdx - peakIdx > 2 && (
        <circle
          cx={x(peakIdx)}
          cy={y(hi)}
          r="3.2"
          fill="var(--cf-plot-bg)"
          stroke={showSources ? sourceColor(points[peakIdx].handle) : 'var(--tier)'}
          strokeWidth="1.8"
        />
      )}
      <circle cx={x(lastIdx)} cy={y(values[lastIdx])} r="4.4" fill="var(--tier)" stroke="var(--cf-plot-bg)" strokeWidth="2" />
    </svg>
  );
}
