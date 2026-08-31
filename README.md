# 小工具

一些自己要用的小东西，跑在 [tools.hsn8086.com](https://tools.hsn8086.com)。

所有处理都在浏览器里完成 —— 图片不会离开你的设备，没有后端。

## 现有工具

**知乎生成器** (`/zhihu`) —— 自定义问题、回答、头像和昵称，生成知乎风格的截图。支持浅色/深色卡片、认证角标、手机状态栏、灵动岛、图文混排，可选包浆（模拟多次转发的画质衰减）和去水印。

**QQ 聊天记录生成器** (`/qq`) —— 把对话写成「昵称：内容」的剧本，渲染成 iOS QQ 风格的截图。尺寸沿用 [qq-gen](https://github.com/hsn8086) 从真实截图 828×2273 @2x 反推的那一套，按 414pt 排版。标成「我」的人靠右显示，都不标就是合并转发那种全部靠左的样子。

## 访问统计

用的是 Cloudflare Web Analytics：不写 cookie、不碰 localStorage、不采集能定位到人的东西，
只有页面浏览量和来源这类聚合数据。图片依旧不出你的设备。

统计脚本只在配了 beacon token 时注入，而且只在打包时注入，dev 下不注入：

```sh
cp .env.example .env
# 填上 VITE_CF_BEACON，token 在 Cloudflare Dashboard →
# Analytics & Logs → Web Analytics → 站点 → Manage site 里
```

不配就完全不注入，clone 下来自己跑不会给任何人发数据。

Cloudflare 代理下的域名也可以在 Dashboard 里直接开自动注入，那样连 token 都不用配。

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
