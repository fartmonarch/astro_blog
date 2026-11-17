# 沫之白的小窝

一个从 Astro 官方博客模板出发、被一路改造成「自己用着顺手」的个人技术博客。

- 线上站点：<https://fartmonarch.xyz>
- 写作后台：<https://fartmonarch.xyz/admin/>（Sveltia CMS + GitHub Token 登录）
- 技术栈：Astro 7 · TypeScript · Sveltia CMS · 腾讯云 COS · Vercel

> 仓库里的内容全是 Markdown，**Git 就是数据库**。没有数据库、没有 API 路由、没有常驻服务：
> 写作 → 提交 → Vercel 构建 → 上线，全链路只经过仓库。

---

## 这个项目是什么

起点是 Astro 官方的 blog starter（Bear Blog 风格），但现在它已经不是一个「模板演示站」了：

- 站点是**中文单语**的，原来的中英双语路由和语言切换已经整体移除；
- 内容的组织方式被重做过——**分类是受控词表，标签只做展示**；
- 多了一个**项目展示**模块，用来放自己发布过的仓库、上线地址和 npm 包；
- 写作入口从「必须打开编辑器」变成了**浏览器后台**，手机也能发文章；
- 图片不再进仓库，写作时**直传腾讯云 COS**；
- 视觉是自己调的：暖米色 / 深空蓝两套主题，配一个涂鸦风的日月切换开关。

改造过程没有只留在提交记录里，每一步的决策、踩过的坑和验证结果都写在 [`docs/`](docs/) 下，详见文末的[文档索引](#文档索引)。

三条贯穿始终的原则：

1. **能静态就静态**——全站构建期预渲染，产物直接扔给 Vercel，没有运行时。
2. **同一份内容，多种写法**——浏览器后台、VSCode、Obsidian 之类任意编辑器都行，因为数据源只有仓库里的 `.md`。
3. **配置集中**——站点信息、分类白名单、项目词表都在 `src/config.ts`，改东西先看它。

---

## 页面与功能

| 路由 | 页面 | 说明 |
| --- | --- | --- |
| `/` | 首页 | 左侧资料卡；「项目」模块只放精选（最多 4 个）；下方是限高渐隐的文章列表 |
| `/blog/<slug>/` | 文章详情 | 发布时间 / 更新时间、分类与标签、右侧目录滚动高亮、代码块一键复制 |
| `/archive/` | 归档 | 全部文章按年份分组 |
| `/tags/` | 分类标签 | 6 个白名单分类 +「未分类」，0 篇的置灰但仍可点 |
| `/tags/<分类>/` | 分类详情 | 构建期按白名单生成，词表外的分类直接 404 |
| `/projects/` | 项目 | 卡片式：图标、精选/状态徽章、平台图标、技术栈、上线/源码/npm 三个入口 |
| `/about/` | 关于 | 内容在 `src/content/pages/about.md`，改文件即改页面 |
| `/rss.xml` | RSS | 全量文章，只输出分类 |
| `/admin/` | 写作后台 | Sveltia CMS，`noindex`，不出现在导航里 |
| `404` | 404 | 兜底页 |

全站还挂了这些体验层的东西：主题切换（跟随系统 / 记住选择）、回到顶部、Astro View Transitions、全站 viewport 预取。

---

## 二次开发清单

相对官方模板，主要动了这些地方：

| # | 改动 | 说明 |
| --- | --- | --- |
| 1 | **双语 → 中文单语** | 删掉 `[...lang]` 路由、`src/i18n/` 和英文内容集合；旧的 `/en/*` 链接用 301 兜住 |
| 2 | **分类 / 标签分层** | 分类是受控词表（进 URL、进 RSS、生成页面）；标签纯展示，不生成页面 |
| 3 | **自研内容 loader** | 官方 `glob()` 在当前依赖组合下会踩 `require is not defined`，换成只依赖 `node:fs` + `js-yaml` 的 loader，并自己接了开发热更新 |
| 4 | **项目展示** | 新增 `project` 集合、卡片组件、`/projects/` 页面、首页精选模块和对应的 CMS 字段 |
| 5 | **主题重做** | 暖米色 / 深空蓝两套 CSS 变量、涂鸦风日月开关、自托管 Source Sans 3 |
| 6 | **浏览器后台** | Sveltia CMS 单文件放在 `public/admin/`，GitHub PAT 登录，Publish 即提交 `main` |
| 7 | **图片走 COS** | CMS 媒体库直传腾讯云 COS，图片不进仓库；给 `sveltia-cms.js` 打了 3 处腾讯云兼容补丁 |
| 8 | **部署适配** | Vercel 适配器 + 301 重定向写在 `astro.config.mjs`，由适配器写进 `.vercel/output` |

---

## 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Astro 7（静态输出）+ TypeScript |
| 内容 | Markdown / MDX 内容集合，自研 loader + Zod schema 校验 |
| 样式 | 手写 CSS + CSS 变量（无 UI 框架），自托管字体 |
| 图标 | `astro-icon`（`@iconify-json/mdi`）+ 内联 SVG 品牌图标 |
| 图片 | Sharp（Astro 内置 `<Image />`） |
| 后台 | Sveltia CMS（单文件、免构建，自托管） |
| 图床 | 腾讯云 COS（S3 兼容接口） |
| 部署 | Vercel（`@astrojs/vercel`）+ Speed Insights |
| 工程化 | ESLint（flat config）+ Prettier |

---

## 快速开始

环境要求：**Node ≥ 22.12**（见 `package.json` 的 `engines`），包管理器用 **npm**（仓库内带 `package-lock.json`）。

```bash
npm install
npm run dev        # http://localhost:4321
```

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动本地开发服务器（默认 4321 端口） |
| `npm run build` | 生产构建，产物交给 Vercel 适配器 |
| `npm run preview` | 本地预览构建结果 |
| `npm run lint` / `npm run lint:fix` | ESLint 检查 / 自动修复 `src/` |
| `npm run format` / `npm run format:check` | Prettier 格式化 / 只做检查 |

---

## 写一篇文章

文件放在 `src/content/blog/<slug>.md`，URL 就是 `/blog/<slug>/`。frontmatter 长这样：

```yaml
---
title: 标题
description: 摘要，列表和 RSS 会用
pubDate: 2026-11-18
updatedDate: 2026-11-20 # 可选，留空或整行删掉都可以
categories: [前端笔记] # 0–3 个，必须是白名单里的值；留空 = 未分类
tags: [Vue, 面试] # 纯展示的关键词，不生成页面
---
```

三条硬规则：

- **分类必须命中白名单**。`src/content.config.ts` 直接引用 `src/config.ts` 里的 `CATEGORIES`，写错值构建会当场失败并报出非法值——比静默长出一个新分类页要好。
- **最多 3 个分类**，可以一个都不选（那就是「未分类」）；标签不限个数，但只会显示在文章页，不参与路由。
- **增删分类要同步两处**：`src/config.ts` 的 `CATEGORIES`，以及 `public/admin/config.yml` 中 select 字段的 `options`。分类名会直接进 URL，别带 `/`、`#` 这类字符。

### 项目条目

`src/content/projects/*.md`，没有站内详情页，卡片本身就是全部信息：

```yaml
---
title: 项目名
description: 一句话简介，卡片上超过 3 行会截断
status: 维护中 # 维护中 / 开发中 / 已归档
platforms: [github] # github / gitee / npm，决定显示哪些平台图标
featured: true # 勾了才会进首页，且首页最多展示 4 个
techStack: Astro, TypeScript, Vercel # 中英文逗号、顿号都行
cover: https://example.com/icon.png # 可选，留空显示项目名首字
links: # 三个都留空时，卡片底部不显示链接区
  live: https://example.com
  repo: https://github.com/xxx/yyy
  npm: ""
---
```

---

## 在后台写文章（推荐）

1. 打开 `/admin/`，点 **Sign In Using Access Token**，粘贴 GitHub Personal Access Token（classic，勾 `repo` 权限）；
2. 新建「博客文章」，填标题、描述、日期、分类、标签。新建时会多一个 **Slug** 输入框，填英文短横线格式（如 `astro-content-collections`），它就是文件名和 URL；
3. 正文里插图直接上传，图片会进 COS，正文里写入的是 CDN 链接；
4. Publish → 提交到 `main` → Vercel 自动构建，通常几十秒上线。

几个边界：

- **本地打开 `/admin/` 也连着线上仓库**：`backend` 指向的是 GitHub 上的 `main`，本地调试时点 Publish 会真的提交。只想改字段看看效果的话，别点发布。
- CMS 只管理 `.md`；手写的 `.mdx` 能正常渲染，但不会出现在后台列表里，得用编辑器维护。
- 腾讯云的 **SecretKey 不进仓库**——首次上传时在界面上输入，只存在浏览器本地；`config.yml` 里只有 SecretId。
- Token 也只存在浏览器的 localStorage，换电脑或清缓存后需要重新登录。

---

## 图片与图床

图片一律走腾讯云 COS，仓库只留代码和文字。两条链路：

- **后台插图**：CMS 媒体库 → COS 桶（`img/` 前缀），正文里写自定义域名。
- **本地写作**：用 COS 控制台或 PicGo 上传，正文直接贴外链。

配置里有两点特别容易混，改之前先看清楚：

- `endpoint` 是**桶级域名**，负责列举和上传（浏览器直连，所以桶必须配 CORS），不能写成 path-style 域名；
- `public_url` 是自定义域名，只决定**写进正文的图片链接**。

另外，仓库里还留着早期文章的 16 张图（`public/images/`，正文有 9 处引用），迁移方案已经写好但还没执行，见 [《图片上传COS操作指南》](<docs/图片上传COS操作指南.md>)。

---

## 部署

推送到 `main` 即部署，Vercel 侧不需要额外配置：

- 构建命令 `npm run build`，适配器会把产物写进 `.vercel/output`；
- 老链接的 301 写在 `astro.config.mjs` 的 `redirects` 里，由适配器写进 `.vercel/output/config.json`。**不要改用 `vercel.json` 做重定向**——这条路走的是 Build Output API，`vercel.json` 里的重定向不生效；
- Speed Insights 已经在 `BaseHead.astro` 里接入，不需要额外埋点。

---

## 目录结构

```text
.
├── public/
│   ├── admin/                 # Sveltia CMS 三件套：index.html + config.yml + sveltia-cms.js
│   ├── images/                # 早期文章的图片（待迁 COS）
│   └── fonts/                 # 自托管字体
├── scripts/
│   ├── migrate-old-blog.ps1
│   └── patch-sveltia-cos.ps1  # 给 CMS 打腾讯云兼容补丁（幂等，可重复执行）
├── src/
│   ├── components/            # Header / Footer / Profile / ProjectCard / ThemeToggle …
│   ├── content/
│   │   ├── blog/              # 文章（.md）
│   │   ├── pages/about.md     # 「关于」页正文
│   │   └── projects/          # 项目卡片数据
│   ├── content.config.ts      # 三个集合的 schema + 自研 loader
│   ├── config.ts              # 站点信息、作者、分类白名单、项目词表 ← 改配置先看这里
│   ├── layouts/               # BaseLayout / BlogPost（目录、代码复制）
│   ├── pages/                 # 路由：首页、归档、分类、项目、RSS、404、/admin 之外的全部页面
│   └── styles/global.css      # 设计令牌（两套主题）
├── astro.config.mjs           # 集成、代码高亮、预取、301 重定向、Vercel 适配器
├── docs/                      # 二次开发过程文档
└── package.json
```

---

## 想改哪里：配置速查

| 想改什么 | 改哪里 |
| --- | --- |
| 站点标题 / 描述 / 网址、作者信息、社交链接 | `src/config.ts` |
| 分类白名单 | `src/config.ts` + `public/admin/config.yml` |
| 项目状态、平台词表、首页项目条数 | `src/config.ts`（`PROJECT_STATUSES` / `PROJECT_PLATFORMS` / `PROJECTS_ON_HOME`） |
| 主题配色 | `src/styles/global.css`（`:root` 与 `html.dark`） |
| 代码高亮主题 | `astro.config.mjs` 的 `markdown.shikiConfig` |
| 老链接 301 | `astro.config.mjs` 的 `redirects` |
| 后台字段 | `public/admin/config.yml`（与 `src/content.config.ts` 严格一一对应，改一边必须检查另一边） |
| RSS 输出内容 | `src/pages/rss.xml.ts` |
| 首页 / 归档 / 分类页布局 | `src/pages/` 下对应文件，样式都在同文件的 `<style>` 里 |

---

## 文档索引

`docs/` 是这个项目真正的「使用说明书」，按主题分：

| 文档 | 内容 |
| --- | --- |
| [博文编写实施文档](<docs/博文编写实施文档.md>) | 写作方案的最初设计、实施步骤与验收清单 |
| [博文编写方案分析](<docs/博文编写方案分析.md>) | VSCode / Obsidian / Web CMS 等几种写法的对比与选型 |
| [Sveltia CMS 配置与使用指南](<docs/Sveltia CMS 配置与使用指南.md>) | 后台怎么接上的、字段怎么改、日常怎么发文和排错 |
| [CMS 配置自学指南](<docs/CMS配置自学指南.md>) | 不靠猜：怎么用 schema 和源码查 CMS 支持哪些配置 |
| [分类标签体系改造方案](<docs/分类标签体系改造方案.md>) | 为什么分类是词表、标签只做展示，以及改造全过程 |
| [项目展示功能手册](<docs/项目展示功能手册.md>) | 项目模块的实现细节、踩坑记录与已知限制 |
| [项目展示配置与使用指南](<docs/项目展示配置与使用指南.md>) | 项目卡片的字段速查版 |
| [CMS 直传 COS 配置与维护指南](<docs/CMS直传COS配置与维护指南.md>) | 后台插图直传 COS 的 4 处改动、3 个补丁与排错 |
| [图片上传 COS 操作指南](<docs/图片上传COS操作指南.md>) | 存量图片迁移到 COS 的步骤（尚未执行） |
| [图片资源与博客编写 COS 联动方案](<docs/图片资源与博客编写COS联动方案.md>) | 图床与写作流程联动的整体规划 |
| [COS 配置原理讲解](<docs/COS配置原理讲解.md>) | S3 协议、COS 域名风格、SigV4 签名、CORS 的来龙去脉 |
| [图床自动化方案](<docs/图床自动化方案.md>) | GitHub / PicGo / VSCode 插件几种图床方案的对比 |
| [中英双语移除变更记录](<docs/中英双语移除变更记录.md>) | 双语功能为什么删、删了什么、怎么回滚 |

---

## 已知限制

- 没有站内搜索、分页和评论；首页与归档一次性渲染全部文章，文章量再涨需要补分页。
- 项目集合没有详情页——卡片即全部信息，正文只当备注。
- CMS 只管 `.md`，`.mdx` 需要手写维护。
- SEO 目前只有 `title` / `description`，没有 OG / Twitter 卡片；`@astrojs/sitemap` 装了依赖但没接入集成。
- 分类词汇表是硬编码的，加分类需要改代码并重新构建（这是刻意的：宁可在构建期报错，也不要悄悄多出一个分类页）。

---

## 致谢

- 起点是 Astro 官方的 [blog starter](https://github.com/withastro/astro/tree/main/examples/blog)，视觉风格源自 [Bear Blog](https://github.com/HermanMartinus/bearblog/)。
- 后台用 [Sveltia CMS](https://github.com/sveltia/sveltia-cms)，图标来自 [Iconify](https://iconify.design/) 的 `mdi` 图标集。
- 之后的所有改造——分类体系、项目展示、自研 loader、COS 图床、主题与阅读体验——都是在这个基础上二次开发的，过程记录见 `docs/`。

文章内容版权归作者所有。
