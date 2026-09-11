import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import icon from "astro-icon";

import vercel from "@astrojs/vercel";

export default defineConfig({
  site: 'https://fartmonarch.xyz',
  integrations: [mdx(), icon()],

  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },

  prefetch: {
    defaultStrategy: 'viewport',
    prefetchAll: true,
  },

  // 旧的英文路由已整体删除，这里把老链接 301 回对应的中文页面
  // （走 Astro 的 redirects，Vercel 适配器会写进 .vercel/output/config.json）
  // 注意：动态目标（如 /[...path]）不合法——Astro 要求目标必须是已存在的路由，所以只能逐条列静态路径；
  // 带不带结尾斜杠会被 Astro 归一化成同一条规则，所以不用写两遍
  redirects: {
    '/en': '/',
    '/en/about': '/about/',
    '/en/archive': '/archive/',
    '/en/tags': '/tags/',
    '/en/rss.xml': '/rss.xml',
    '/en/blog/hello-world': '/blog/hello-world/',
  },

  adapter: vercel()
});