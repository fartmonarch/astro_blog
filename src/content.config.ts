import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import yaml from "js-yaml";
import type { Loader, LoaderContext } from "astro/loaders";
import { CATEGORIES, PROJECT_STATUSES } from "./config";

// ============================================================================
// 为什么不用 astro/loaders 的 glob()
// ----------------------------------------------------------------------------
// glob() 会 import tinyglobby，而 tinyglobby 又 import picomatch（纯 CJS）。
// 在当前依赖组合（Astro 7.1.6 + Vite 8.2）下，Vite 的 SSR 模块运行器会把
// picomatch 的**未转换源码**直接交给求值器执行，于是 `astro sync` / `astro build`
// 报 `require is not defined` 直接挂掉（`astro dev` 不走这条路径，所以开发时看不出来）。
//
// 下面这个 loader 只依赖 node:fs / node:path / js-yaml，不碰 tinyglobby，
// 从根上绕开那个 bug。它做的事和 glob() 一样：遍历目录 → 解析 frontmatter →
// 渲染正文 → 写进 store。详见 docs/项目展示功能手册.md 的「构建阻塞」一节。
//
// 想换回官方 loader：把三处 loader: 改回
//   glob({ pattern: "**/*.{md,mdx}", base: "./src/content/<集合名>" })
// 代价是构建会重新踩到上面那个 bug。
// ============================================================================

/** 需要被收集的扩展名。`.mdx` 会走同一套 Markdown 渲染（见下方注释）。 */
const CONTENT_EXTENSIONS = [".md", ".mdx"];

/** frontmatter 必须出现在文件最开头（允许 BOM 和空行）。 */
const FRONTMATTER_RE = /^(?:\uFEFF)?\s*---[ \t]*\r?\n([\s\S]*?)\r?\n?---[ \t]*(?:\r?\n|$)/;

function splitFrontmatter(source: string, filePath: string) {
  const match = FRONTMATTER_RE.exec(source);
  if (!match) return { frontmatter: {} as Record<string, unknown>, content: source };

  let frontmatter: unknown;
  try {
    frontmatter = yaml.load(match[1], { filename: filePath }) ?? {};
  } catch (error) {
    // 抛出去让 Astro 指名道姓地报出是哪个文件坏了，别静默当成空 frontmatter
    throw new Error(`解析 frontmatter 失败：${filePath}\n${(error as Error).message}`, {
      cause: error,
    });
  }
  if (typeof frontmatter !== "object" || frontmatter === null || Array.isArray(frontmatter)) {
    throw new Error(`frontmatter 必须是一个 YAML 映射：${filePath}`);
  }
  return {
    frontmatter: frontmatter as Record<string, unknown>,
    content: source.slice(match[0].length),
  };
}

/**
 * 遍历某个内容目录下的所有 `.md` / `.mdx`，递归子目录。
 * 条目 id = 相对该目录的路径去掉扩展名（`a/b.md` → `a/b`），与 glob() 的默认行为一致。
 *
 * 关于 `.mdx`：这里用 `renderMarkdown()` 渲染，等价于 Markdown 处理——
 * 也就是说 **.mdx 里的 JSX/import 不会被处理**。当前仓库没有 mdx 内容；
 * 真要用 mdx，请换回官方 glob() loader（并先解决构建阻塞）。
 */
function markdownFiles(dir: string): Loader {
  return {
    name: "markdown-files-loader",
    load: async ({
      config,
      logger,
      watcher,
      store,
      parseData,
      renderMarkdown,
      generateDigest,
    }: LoaderContext) => {
      const root = path.join(fileURLToPath(config.root), dir);

      const walk = async (current: string): Promise<string[]> => {
        let entries;
        try {
          entries = await fs.readdir(current, { withFileTypes: true });
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            throw new Error(`内容目录不存在：${dir}（期望路径 ${root}）`, { cause: error });
          }
          throw error;
        }
        const found: string[] = [];
        for (const entry of entries) {
          const full = path.join(current, entry.name);
          if (entry.isDirectory()) {
            found.push(...(await walk(full)));
          } else if (CONTENT_EXTENSIONS.includes(path.extname(entry.name))) {
            found.push(full);
          }
        }
        return found;
      };

      const files = (await walk(root)).sort();

      // 每次 load 都是完整重建：这样删掉的条目不会残留在 store 里
      // （glob() 用 untouchedEntries 做增量，效果一样，这里从简）。
      store.clear();

      if (files.length === 0) {
        logger.warn(`目录里没有任何 .md/.mdx 文件：${dir}`);
        return;
      }

      for (const file of files) {
        const source = await fs.readFile(file, "utf-8");
        const { frontmatter, content } = splitFrontmatter(source, file);
        const relative = path.relative(root, file).split(path.sep).join("/");
        const id = relative.replace(/\.mdx?$/, "");

        // data 交给集合 schema 校验；body 保留原文，rendered 是渲染好的 HTML
        const data = await parseData({ id, data: frontmatter, body: content });

        let rendered;
        try {
          rendered = await renderMarkdown(content, { fileURL: pathToFileURL(file) });
        } catch (error) {
          logger.error(`渲染失败：${relative}\n${(error as Error).message}`);
        }

        store.set({
          id,
          data,
          body: content,
          filePath: `${dir}/${relative}`,
          digest: generateDigest(source),
          rendered,
          assetImports: rendered?.metadata?.imagePaths,
        });
      }

      logger.info(`载入 ${files.length} 个文件：${dir}`);

      // 开发时改文件/加文件能触发重新 load（glob() 也做同样的事）
      watcher?.add(root);
    },
  };
}

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
  z
    .array(z.enum([...CATEGORIES]))
    .max(3)
    .default([]),
);

const blog = defineCollection({
  loader: markdownFiles("./src/content/blog"),
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
  loader: markdownFiles("./src/content/pages"),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

// 同理：可选文本字段，空串/缺失/纯空格统一归一成 undefined。
// 归一后页面只需判一次真值，不用再处理 '' 这种"看着有值其实是空"的情况。封面图 URL 也走它。
const optionalText = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : (v ?? undefined)),
  z.string().optional(),
);

// 项目链接：三个都是可选的；三个全空就把整个对象丢掉，
// 这样卡片只用判断 links 存不存在，不必逐个字段判空。
const projectLinks = z.preprocess(
  (v) => {
    const raw = (v ?? {}) as Record<string, unknown>;
    const cleaned = {
      live: typeof raw.live === "string" && raw.live.trim() !== "" ? raw.live : undefined,
      repo: typeof raw.repo === "string" && raw.repo.trim() !== "" ? raw.repo : undefined,
      npm: typeof raw.npm === "string" && raw.npm.trim() !== "" ? raw.npm : undefined,
    };
    return cleaned.live || cleaned.repo || cleaned.npm ? cleaned : undefined;
  },
  z
    .object({
      live: z.string().optional(),
      repo: z.string().optional(),
      npm: z.string().optional(),
    })
    .optional(),
);

// 技术栈不设白名单：CMS 里就是一个文本框，用逗号手动分隔，
// 在这里切成数组交给页面——于是"展示标签"和"筛选按钮"用的是同一份 string[]，不必各自解析字符串。
// 分隔符同时接受半角逗号、全角逗号和顿号；切完去首尾空格、丢掉空项。
const techStackArray = z.preprocess((v) => {
  const items = typeof v === "string" ? v.split(/[,，、]/) : Array.isArray(v) ? v : [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const name = String(item).trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      result.push(name);
    }
  }
  return result;
}, z.array(z.string()).default([]));

const project = defineCollection({
  loader: markdownFiles("./src/content/projects"),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    featured: z.preprocess((v) => (v === "" || v == null ? false : v), z.boolean().default(false)),
    status: z.enum([...PROJECT_STATUSES]).default("维护中"),
    platforms: z.preprocess(
      (v) => (v === "" || v == null ? [] : v),
      z.array(z.enum(["github", "gitee", "npm"])).default([]),
    ),
    techStack: techStackArray,
    cover: optionalText,
    links: projectLinks,
  }),
});

export const collections = { blog, pages, project };
