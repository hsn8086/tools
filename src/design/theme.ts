import {
  DynamicScheme,
  Hct,
  MaterialDynamicColors,
  Variant,
  argbFromHex,
  hexFromArgb,
} from '@material/material-color-utilities';

export type Mode = 'light' | 'dark' | 'system';

/**
 * 用 material-color-utilities 的 **2025 色彩规格**（也就是 Material 3 Expressive 那一版）。
 * 2021 规格的中性色带着明显的种子色偏色，整页会糊成一片淡紫；
 * 2025 规格把表面拉回接近中性，彩度集中到真正可交互的元素上。
 */
export const DEFAULT_SEED = '#4F5DFF';

/** 需要写进 CSS 变量的角色。名字即 --md-<kebab> */
const ROLE_KEYS = [
  'primary',
  'onPrimary',
  'primaryContainer',
  'onPrimaryContainer',
  'secondary',
  'onSecondary',
  'secondaryContainer',
  'onSecondaryContainer',
  'tertiary',
  'onTertiary',
  'tertiaryContainer',
  'onTertiaryContainer',
  'error',
  'onError',
  'errorContainer',
  'onErrorContainer',
  'background',
  'onBackground',
  'surface',
  'surfaceDim',
  'surfaceBright',
  'surfaceContainerLowest',
  'surfaceContainerLow',
  'surfaceContainer',
  'surfaceContainerHigh',
  'surfaceContainerHighest',
  'onSurface',
  'surfaceVariant',
  'onSurfaceVariant',
  'outline',
  'outlineVariant',
  'inverseSurface',
  'inverseOnSurface',
  'inversePrimary',
  'scrim',
] as const satisfies readonly (keyof typeof MaterialDynamicColors)[];

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

let mediaQuery: MediaQueryList | null = null;
let contrastQuery: MediaQueryList | null = null;

export function resolveMode(mode: Mode): 'light' | 'dark' {
  if (mode !== 'system') return mode;
  mediaQuery ??= window.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery.matches ? 'dark' : 'light';
}

export function applyTheme(seed: string, mode: Mode) {
  const dark = resolveMode(mode) === 'dark';
  contrastQuery ??= window.matchMedia('(prefers-contrast: more)');

  const scheme = new DynamicScheme({
    sourceColorHct: Hct.fromInt(argbFromHex(seed)),
    variant: Variant.TONAL_SPOT,
    isDark: dark,
    contrastLevel: contrastQuery.matches ? 0.5 : 0,
    specVersion: '2025',
    platform: 'phone',
  });

  const root = document.documentElement;
  for (const key of ROLE_KEYS) {
    const color = MaterialDynamicColors[key] as { getArgb(s: DynamicScheme): number };
    root.style.setProperty(`--md-${kebab(key)}`, hexFromArgb(color.getArgb(scheme)));
  }

  root.dataset.mode = dark ? 'dark' : 'light';
  root.style.colorScheme = dark ? 'dark' : 'light';
}

/** 系统深浅色、系统对比度变化时都要重算 */
export function watchSystem(cb: () => void) {
  mediaQuery ??= window.matchMedia('(prefers-color-scheme: dark)');
  contrastQuery ??= window.matchMedia('(prefers-contrast: more)');
  mediaQuery.addEventListener('change', cb);
  contrastQuery.addEventListener('change', cb);
  return () => {
    mediaQuery?.removeEventListener('change', cb);
    contrastQuery?.removeEventListener('change', cb);
  };
}
