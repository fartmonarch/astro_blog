import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { CATEGORIES } from "./config";

// Sveltia CMS 保存时会把空的可选字段写成 ''（空字符串），
// 这里统一转成 undefined，避免 zod 4 把 Invalid Date 判为类型错误导致构建失败。
const optionalDate = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.coerce.date().optional(),
);

// 同理：空的可选数组字段可能被写成 ''、也可能整个键被省略，统一归一成 []。
const optionalStringArray = z.preprocess(
  (v) => (v === "" || v == null ? [] : v),
  z.array(z.string()).default([]),
);

// 分类：受控词表 + 最多 3 个；留空（缺失或 []）= 未分类。
// 白名单写错值会直接构建失败并报出非法值，比静默长出一个新分类页更好。
const categoryArray = z.preprocess(
  (v) => (v === "" || v == null ? [] : v),
  z.array(z.enum([...CATEGORIES])).max(3).default([]),
);

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: optionalDate,
    categories: categoryArray,
    tags: optionalStringArray,
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
