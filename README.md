# 小工具

跑在 [tools.hsn8086.com](https://tools.hsn8086.com) 的网页截图生成工具集。纯前端运行，无后端服务，图片与数据不会离开本地浏览器（Codeforces 合并战绩需要读官方公开接口，只发 handle，不上传任何东西）。

## 包含工具

- **知乎生成器** (`/zhihu`)：生成知乎问答截图。支持深浅色主题、认证角标、iOS 状态栏与灵动岛、图文混排，以及模拟多次转发画质损失的包浆滤镜。
- **QQ 聊天记录生成器** (`/qq`)：按「昵称：内容」纯文本剧本排版，渲染 iOS QQ 聊天卡片。尺寸与字号基于真机截图（414pt / @2x）反推校准；标记为「我」的角色右侧显示，未标记时按合并转发样式全员居左。支持贴表情、戳一戳、撤回提示；内置 433 个 QQNT 表情（桌面端有面板，移动端打 / 补全），GIF 可选定格帧。
- **Codeforces 合并战绩** (`/cf-merge`)：把几个号的 rated 场次按时间穿成一条，重算成一个虚拟号的 rating 曲线，生成战绩卡。

QQ 剧本语法：

| 写法 | 效果 |
| --- | --- |
| `昵称：内容` | 一条消息，无冒号的行并入上一条 |
| `[21:18]` | 时间分隔线 |
| `[撤回] 昵称` | 「昵称撤回了一条消息」 |
| `[系统] @[甲]👉戳了戳@[乙]的头` | 灰色居中系统行，`@[名字]` 显示为蓝色 |
| `+/庆祝@[土豆]` | 给上一条消息表态，表的是自己的消息时自动补「回应了你的消息」 |
| `/庆祝` | QQ 表情，正文里直接写；输入 `/` 有补全 |
| `![图片 id]` | 图片，由「插图」按钮写入 |

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

先在 `src/site.ts` 的 `toolInfo` 中添加工具的 `id`、`name`、`emoji`、`desc`、搜索标题 `title` 和页面描述 `description`。构建会据此生成工具 HTML 和 sitemap。

在 `src/tools/<id>/meta.ts` 导出 `meta` 配置，首页会自动注册：

```ts
import { lazy } from 'react';
import type { ToolMeta } from '../../registry';
import { toolInfo } from '../../site';

export const meta: ToolMeta = {
  ...toolInfo['my-tool'],
  Component: lazy(() => import('./Editor').then((m) => ({ default: m.MyEditor }))),
};
```

## 实现细节

- **Shadow DOM 隔离渲染**：目标卡片渲染在独立的 Shadow Root 中，避免宿主样式和浏览器默认缩放影响排版精度，外层缩放统一采用 `transform: scale`。
- **导出与字体就绪**：使用 `html-to-image` 截取 375px 容器，配合 `pixelRatio` 生成 2x / 3x 清晰度图片。截图前等待 `document.fonts.ready`，避免字体回退导致文字跳变。
- **分辨率无关的包浆算法**：在 Web Worker 中将图像等比下采样到固定基准宽度（约 380px），在该尺寸上叠加多轮低质量 JPEG 编码、偏色与噪点，最后放大回原尺寸，保证 1x 预览与 3x 导出效果完全一致。
- **配色系统**：基于 Material Design 3 Expressive 规范，由种子色经 HCT 动态派生，适配系统深浅模式与对比度偏好。卡片自带深浅开关，颜色单独派一套写在卡片根元素上，不跟站点主题联动。
- **Codeforces rating 重算**：FFT 加速的官方 rating 算法，移植自 [Carrot](https://github.com/meooow25/carrot)。每场拉完整名单，把当时打比赛的号换成虚拟号的当前分重算 delta，而不是把各号的涨跌相加——同样的名次在不同分段涨跌差很多。新号前六场的隐藏分、同一场被两个号打过的去重都按官方口径处理。官方接口限流每 2 秒一次，所以请求走一条串行队列，几十场要跑一两分钟。

## SEO

`src/site.ts` 统一维护生产域名、工具信息与页面元数据。构建输出首页和各工具的独立 HTML，包含标题、描述、canonical、Open Graph、Twitter Card 和 JSON-LD；初始 HTML 提供工具名称、简介与导航链接，完整编辑器仍需 JavaScript。站内切换会同步更新元数据。

构建同时生成 `robots.txt`、`sitemap.xml` 和带 `noindex` 的 `404.html`。Cloudflare Pages 使用无扩展名地址访问工具 HTML；不要添加全站回退到首页的规则，否则未知地址会返回 200，造成 soft 404。部署到其他域名时需修改 `SITE_URL`。

运行 `pnpm test:seo` 检查构建产物、无 JavaScript 内容、桌面与移动端导航及编辑器渲染，需要本机已有 Playwright Chromium。部署后还需检查不存在的路径是否返回 HTTP 404，并在搜索引擎站长平台提交 `https://tools.hsn8086.com/sitemap.xml`。

## 构建与部署

```sh
pnpm build
npx wrangler pages deploy dist --project-name=tools
```
