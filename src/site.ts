export const SITE_URL = 'https://tools.hsn8086.com';
export const SITE_NAME = '小工具';

export const toolInfo = {
  'cf-merge': {
    id: 'cf-merge',
    name: 'Codeforces 合并战绩',
    emoji: '📈',
    desc: '把几个号的 rated 场次按时间合并，重算 rating 曲线',
    title: 'Codeforces 合并战绩 - 多账号 Rating 曲线与战绩卡',
    description: '合并多个 Codeforces 账号的 rated 比赛，按时间顺序重新计算虚拟账号的 rating 曲线，生成战绩卡。读取 Codeforces 官方公开接口，支持同场比赛去重。',
  },
  qq: {
    id: 'qq',
    name: 'QQ 聊天记录生成器',
    emoji: '💬',
    desc: '写成剧本，生成 iOS QQ 聊天截图',
    title: 'QQ 聊天记录生成器 - 在线制作 QQ 聊天截图',
    description: '在线制作 iOS QQ 聊天记录截图，支持多人对话、QQ 表情、图片、戳一戳和撤回提示。按昵称与内容编写剧本，在浏览器本地生成并导出聊天图片。',
  },
  zhihu: {
    id: 'zhihu',
    name: '知乎生成器',
    emoji: '💭',
    desc: '自定义问答、认证与排版，生成知乎卡片截图',
    title: '知乎生成器 - 在线制作知乎问答截图',
    description: '在线制作知乎问答截图，自定义问题、回答、认证角标和图文排版，支持深浅色主题、iOS 状态栏与包浆滤镜。图片在浏览器本地生成，无需上传。',
  },
};

export const routes = ['', ...Object.keys(toolInfo)];

export function pageSeo(route: string) {
  const tool = Object.values(toolInfo).find((item) => item.id === route);
  const isHome = route === '';
  const title = tool
    ? `${tool.title} | ${SITE_NAME}`
    : isHome ? '小工具 - 知乎、QQ 聊天截图生成器与 Codeforces 合并战绩' : '页面未找到 | 小工具';
  const description = tool?.description ?? (isHome
    ? '小工具提供知乎问答截图生成器、QQ 聊天记录生成器和 Codeforces 多账号战绩合并。在线编辑、预览并导出图片，截图与编辑数据保留在本地浏览器。'
    : '该页面不存在。');
  const url = `${SITE_URL}/${tool?.id ?? ''}`;
  const structuredData = tool ? {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    description,
    url,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    inLanguage: 'zh-CN',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
  } : isHome ? {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    description,
    url,
    inLanguage: 'zh-CN',
  } : null;
  return { title, description, url, structuredData, indexable: isHome || Boolean(tool) };
}

export function updateSeo(route: string) {
  const seo = pageSeo(route);
  document.title = seo.title;
  const metas = {
    description: seo.description,
    robots: seo.indexable ? 'index,follow' : 'noindex,follow',
    'og:type': 'website',
    'og:site_name': SITE_NAME,
    'og:locale': 'zh_CN',
    'og:title': seo.title,
    'og:description': seo.description,
    'og:url': seo.indexable ? seo.url : '',
    'twitter:card': 'summary',
    'twitter:title': seo.title,
    'twitter:description': seo.description,
  };
  for (const [key, content] of Object.entries(metas)) {
    const attr = key.startsWith('og:') ? 'property' : 'name';
    let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attr, key);
      document.head.append(tag);
    }
    tag.content = content;
  }
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (seo.indexable) {
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.append(canonical);
    }
    canonical.href = seo.url;
  } else {
    canonical?.remove();
  }
  document.getElementById('page-schema')?.remove();
  if (seo.structuredData) {
    const script = document.createElement('script');
    script.id = 'page-schema';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(seo.structuredData);
    document.head.append(script);
  }
}
