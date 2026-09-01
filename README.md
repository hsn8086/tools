# 小工具

跑在 [tools.hsn8086.com](https://tools.hsn8086.com) 的网页截图生成工具集。纯前端运行，无后端服务，图片与数据不会离开本地浏览器。

## 包含工具

- **知乎生成器** (`/zhihu`)：生成知乎问答截图。支持深浅色主题、认证角标、iOS 状态栏与灵动岛、图文混排，以及模拟多次转发画质损失的包浆滤镜。
- **QQ 聊天记录生成器** (`/qq`)：按「昵称：内容」纯文本剧本排版，渲染 iOS QQ 聊天卡片。尺寸与字号基于真机截图（414pt / @2x）反推校准；标记为「我」的角色右侧显示，未标记时按合并转发样式全员居左。

## 访问统计

使用 Cloudflare Web Analytics，不写入 Cookie，不使用 LocalStorage，仅统计页面 PV 与来源等聚合指标。

仅在构建阶段配置了 `VITE_CF_BEACON` 时才会注入统计代码，本地 `pnpm dev` 默认不注入：

```sh
cp .env.example .env
# 填入 VITE_CF_BEACON
# Token 位置：Cloudflare Dashboard → Analytics & Logs → Web Analytics → Manage site
```

未配置 Token 时不会产生任何上报请求。

## 本地开发

```sh
pnpm install
pnpm dev
```

## 添加新工具

在 `src/tools/<id>/meta.ts` 导出 `meta` 配置，首页会自动注册：

```ts
import { lazy } from 'react';
import type { ToolMeta } from '../../registry';

export const meta: ToolMeta = {
  id: 'my-tool',
  name: '我的工具',
  emoji: '🔧',
  desc: '工具简要说明',
  Component: lazy(() => import('./Editor').then((m) => ({ default: m.MyEditor }))),
};
```

## 实现细节

- **Shadow DOM 隔离渲染**：目标卡片渲染在独立的 Shadow Root 中，避免宿主样式和浏览器默认缩放影响排版精度，外层缩放统一采用 `transform: scale`。
- **导出与字体就绪**：使用 `html-to-image` 截取 375px 容器，配合 `pixelRatio` 生成 2x / 3x 清晰度图片。截图前等待 `document.fonts.ready`，避免字体回退导致文字跳变。
- **分辨率无关的包浆算法**：在 Web Worker 中将图像等比下采样到固定基准宽度（约 380px），在该尺寸上叠加多轮低质量 JPEG 编码、偏色与噪点，最后放大回原尺寸，保证 1x 预览与 3x 导出效果完全一致。
- **配色系统**：基于 Material Design 3 Expressive 规范，由种子色经 HCT 动态派生，适配系统深浅模式与对比度偏好。

## 构建与部署

```sh
pnpm build
npx wrangler pages deploy dist --project-name=tools
```
