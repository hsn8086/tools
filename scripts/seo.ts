import type { Plugin } from 'vite';
import { pageSeo, routes, SITE_NAME, SITE_URL, toolInfo } from '../src/site';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]!);

function head(route: string) {
  const seo = pageSeo(route);
  const meta = (key: string, value: string) =>
    `<meta ${key.startsWith('og:') ? 'property' : 'name'}="${key}" content="${escapeHtml(value)}" />`;
  return [
    `<title>${escapeHtml(seo.title)}</title>`,
    meta('description', seo.description),
    meta('robots', seo.indexable ? 'index,follow' : 'noindex,follow'),
    meta('og:type', 'website'),
    meta('og:site_name', SITE_NAME),
    meta('og:locale', 'zh_CN'),
    meta('og:title', seo.title),
    meta('og:description', seo.description),
    ...(seo.indexable ? [meta('og:url', seo.url), `<link rel="canonical" href="${seo.url}" />`] : []),
    meta('twitter:card', 'summary'),
    meta('twitter:title', seo.title),
    meta('twitter:description', seo.description),
    ...(seo.structuredData ? [`<script id="page-schema" type="application/ld+json">${JSON.stringify(seo.structuredData).replace(/</g, '\\u003c')}</script>`] : []),
  ].join('\n    ');
}

// A readable initial shell; React replaces it with the interactive editor on load.
function shell(route: string) {
  const tool = Object.values(toolInfo).find((item) => item.id === route);
  const heading = tool?.name ?? (route === '' ? SITE_NAME : '页面未找到');
  const links = Object.values(toolInfo).map((item) =>
    `<li><a href="/${item.id}">${escapeHtml(item.name)}</a><p>${escapeHtml(item.desc)}</p></li>`,
  ).join('');
  return `<main class="wrap"><h1>${escapeHtml(heading)}</h1>${tool ? `<p>${escapeHtml(tool.desc)}</p>` : ''}<nav aria-label="工具导航"><a href="/">小工具</a><ul>${links}</ul></nav></main>`;
}

export function seoPages(): Plugin {
  return {
    name: 'seo-pages',
    enforce: 'post',
    transformIndexHtml(html, context) {
      const pathname = context.server ? new URL(context.originalUrl ?? '/', SITE_URL).pathname : '/';
      const route = pathname === '/index.html' ? '' : pathname.replace(/^\/+|\/+$/g, '');
      return html.replace('<!-- seo-head -->', head(route)).replace('<!-- seo-shell -->', shell(route));
    },
    generateBundle(_, bundle) {
      const index = bundle['index.html'];
      if (!index || index.type !== 'asset' || typeof index.source !== 'string') {
        this.error('Missing built index.html for SEO page generation');
      }
      for (const route of [...routes.filter(Boolean), '404']) {
        this.emitFile({
          type: 'asset',
          fileName: `${route}.html`,
          source: index.source.replace(head(''), head(route)).replace(shell(''), shell(route)),
        });
      }
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((route) => `  <url><loc>${SITE_URL}/${route}</loc></url>`).join('\n')}\n</urlset>\n`,
      });
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
      });
    },
  };
}
