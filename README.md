# 小工具

一些自己要用的小东西，跑在 [tools.hsn8086.com](https://tools.hsn8086.com)。

所有处理都在浏览器里完成 —— 图片不会离开你的设备，没有后端。

## 现有工具

**知乎生成器** (`/zhihu`) —— 自定义问题、回答、头像和昵称，生成知乎风格的截图。支持浅色/深色卡片、认证角标、手机状态栏、灵动岛、图文混排，可选包浆（模拟多次转发的画质衰减）和去水印。

## 本地跑

```sh
pnpm install
pnpm dev
```

## 加一个新工具

建 `src/tools/<id>/meta.ts` 并导出 `meta`，首页会自动收录：

```ts
import { lazy } from 'react';
import type { ToolMeta } from '../../registry';

export const meta: ToolMeta = {
  id: 'my-tool',
  name: '我的工具',
  emoji: '🔧',
  desc: '一句话说明',
  Component: lazy(() => import('./Editor').then((m) => ({ default: m.MyEditor }))),
};
```

## 一些实现上的取舍

**卡片渲染在 shadow DOM 里。** 生成的图要像素级还原目标平台，不能被站点的设计系统污染，也不能被用户的浏览器字号缩放影响。卡片内部只用 px，外面缩放靠 `transform: scale`。

**导出走 `html-to-image`。** 截的是 shadow root 里那个固定 375px 宽的元素，靠 `pixelRatio` 放大到 2x / 3x。截图前等 `document.fonts.ready`，否则会截到 fallback 字体。

**包浆是分辨率无关的。** 图片先被压到一个固定的「转发链宽度」（约 380px），在那个尺寸上反复低质量 JPEG 重编码 + 偏色 + 加噪，最后再放大回原尺寸。这样 1x 预览和 3x 导出糊得一样，滑块才所见即所得。跑在 Web Worker 里。

**配色用 Material 3 的 2025 色彩规格**（即 Expressive 那版），从种子色经 HCT 实时生成，跟随系统深浅色和 `prefers-contrast`。

## 部署

推到 main 由 Cloudflare Pages 构建，或者本地：

```sh
pnpm build
npx wrangler pages deploy dist --project-name=tools
```
