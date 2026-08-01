import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import icon from "astro-icon";

export default defineConfig({
  site: 'https://fartmonarch.xyz',   
  integrations: [mdx(), icon()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
  i18n: {
    defaultLocale: "zh",           
    locales: ["zh", "en"],         
    routing: {
      prefixDefaultLocale: false   
    }
  }
});