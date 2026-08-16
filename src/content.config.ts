import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Sveltia CMS 保存时会把空的可选字段写成 ''（空字符串），
// 这里统一转成 undefined，避免 zod 4 把 Invalid Date 判为类型错误导致构建失败。
const optionalDate = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.coerce.date().optional(),
);

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: optionalDate,
    tags: z.array(z.string()).default([]),
    translationKey: z.string().optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const collections = { blog, pages };
