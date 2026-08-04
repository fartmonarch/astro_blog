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

  i18n: {
    defaultLocale: "zh",
    locales: ["zh", "en"],
    routing: {
      prefixDefaultLocale: false
    }
  },

  adapter: vercel()
});