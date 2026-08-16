---
title: "我的新博客创建和运行的框架（新版）"
description: "从旧版 Next.js + 自建 CMS 迁移到 Astro + Vercel 的极简方案：Git 仓库即数据库，四种写作入口殊途同归。"
pubDate: "2026-08-16"
tags: ["博客构造"]
---

> 本文由 AI 根据当前项目代码与文档整理生成。

上一版博客（Next.js + 自建 Web CMS，完整介绍见旧文《我的博客创建和运行的框架》）因为阿里云服务器到期，我顺势重写成了「Astro + Vercel + Git-based CMS」的极简方案。本文主要介绍当前博客的框架与写作方案，也当给以后的自己留一份文档。

## 1. 我用的技术栈与运行形态

| 层 | 选型 |
|---|---|
| 框架 | Astro 7（静态站点生成） |
| 内容 | Content Collections（Markdown/MDX + zod schema 校验） |
| 部署 | Vercel（Git 集成，push 即自动构建）+ Cloudflare CDN（国内可直连） |
| 域名 | fartmonarch.xyz（DNS 托管在 Cloudflare） |
| 语言 | 中英双语（中文无前缀 / 英文带 /en/） |
| 图片 | 腾讯云 COS 图床（PicGo 粘贴即传，外链引用） |

页面结构：首页（侧栏简介 + 最近文章）、归档、文章页（自动目录 + 代码复制按钮）、标签页、关于、RSS、404。样式用纯 CSS 变量实现亮暗双主题，字体 Atkinson 本地化部署，图标走 astro-icon。

## 2. 我的内容是怎么组织的（核心：Git 仓库就是数据库）

这一版最关键的设计：**没有数据库，没有后台服务器，内容即代码**。

文章就是仓库里的 Markdown 文件 + YAML frontmatter：

```
src/content/blog/
├── zh/                          ← 中文（URL 无前缀）
│   ├── blog-framework.md
│   ├── ai-concepts.md
│   └── ...
└── en/                          ← 英文（URL 带 /en/）
    └── hello-world.md
```

每篇文章的 frontmatter 长这样：

```yaml
---
title: "我的新博客创建和运行的框架（新版）"
description: "文章摘要，用于列表页和 SEO"
pubDate: "2026-08-16"
tags: ["博客构造"]
translationKey: "blog-framework"   # 中英版本共用同一个 key 来关联
---
```

- 列表页、归档、标签、RSS 全部由 Astro 在构建时从文件自动生成，**不需要手动维护任何索引文件**（旧版需要 index.json / categories.json 两个索引）
- 中英双语靠 i18n 路由 + translationKey 关联，默认中文无前缀，英文走 /en/
- 图片两种形态：图床外链（日常写作走 COS）和仓库本地（public/images/，迁移自旧博客）

## 3. 我是怎么"写一篇文章并发布"的（四种入口，殊途同归）

所有写作路径最终都落到同一个 GitHub 仓库，Vercel 检测到 push 自动构建：

```
VSCode + PicGo ──┐
Sveltia CMS  ────┤  push → fartmonarch/astro_blog → Vercel 构建部署
GitHub.dev   ────┤
Obsidian（预留）──┘
```

| 入口 | 场景 | 登录/工具 |
|---|---|---|
| VSCode + Git | 日常深度写作，图片粘贴即传 COS | 本地 |
| Sveltia CMS（浏览器 /admin） | 快速发文、不想开编辑器 | GitHub PAT |
| GitHub.dev（仓库按 `.` 键） | 临时小改、手机平板 | GitHub 账号 |
| Obsidian | 知识库写作（预留，暂未启用） | Obsidian Git |

浏览器端用的是 **Sveltia CMS**（Git-based 无头 CMS）：它没有数据库，本质是一个跑在浏览器里的单页应用，拿着你的 GitHub Token 直接读写仓库文件——保存一篇文章就是生成一个 commit push 到 main。所以 CMS 和 VSCode 操作的是同一批文件，互不冲突：`.md` 文章用 CMS 可视化编辑，`.mdx` 创新文章（嵌组件/JSX）在 VSCode 里直接写源码。后台入口没有公开链接，直接访问 `/admin/` 即可。

## 4. 旧博客内容的迁移

旧博客的 9 篇文章和 16 张图片整体迁移到了新仓库（具体迁移工程旧文已述，这里只列结果）：

- 统一为 Markdown + frontmatter 格式，category 并入 tags
- 中文目录名映射成 ASCII slug，URL 干净
- 图片落地到 public/images/，正文路径改写为本地引用（后续升级 COS）
- 迁移脚本 scripts/migrate-old-blog.ps1 可复现

## 5. 和旧版的关键取舍

旧版的完整介绍见旧文，这里只列几个关键差异：

| | 旧版 | 新版 |
|---|---|---|
| 部署 | 阿里云服务器 + nginx/pm2 | Vercel，零服务器 |
| CMS | 自研前端应用调 GitHub API | Sveltia（现成 Git-based） |
| 认证 | GitHub App 私钥 JWT | GitHub PAT |
| 索引 | 手动维护 index.json | 构建时自动生成 |

其余差异（图片方案、移动端、安全等）旧文已有交代，不重复展开。

## 6. 部署与运维：从阿里云迁到 Vercel

旧博客跑在阿里云轻量应用服务器上（nginx + pm2），到期后不再续费，整体迁到 Vercel，运维方式从"SSH 上服务器"变成了"Git push 完事"。

### 6.1 域名接入：为什么换到 Cloudflare

Vercel 默认分配的 `*.vercel.app` 域名在国内基本无法直接访问，所以做了两件事：

1. 把域名的 **DNS 服务器从原注册商切到 Cloudflare**（改 NS 记录，等全球生效）
2. DNS 记录开启**橙色云朵（Cloudflare 代理）**，让流量走 Cloudflare CDN

切换之后，国内直接访问 `fartmonarch.xyz` 没有问题，速度也能接受。

### 6.2 现在的成本构成

| 项 | 花费 |
|---|---|
| Vercel（Hobby 免费版） | ¥0 |
| Cloudflare（免费版 DNS + CDN，橙云自带免费 SSL） | ¥0 |
| 腾讯云 COS 图床 | 按量计费，个人博客基本可忽略 |
| 域名 fartmonarch.xyz | 约 ¥109/年（.xyz 续费偏贵，后续可能会换域名） |

对比以前：阿里云轻量服务器 + 域名 + 证书 + 手动部署，现在服务器成本归零，只剩域名续费。

### 6.3 运维方式的变化

- 以前：SSH 上服务器 → pm2 看进程 → nginx 改配置 → 手动拉代码部署
- 现在：Git push → Vercel 自动构建部署，构建失败在仪表盘直接看日志；域名和证书交给 Cloudflare 托管，不用自己管

## 7. 踩过的坑

- **Vercel 无持久服务器**：不能跑后台进程监听文件变更，一切靠 Git push 触发——所以四种写作方案全部收敛到"push 到仓库"这一个动作
- **Sveltia 早期不识别 .mdx**（GitHub Issue #79，旧版 0.8.4 的 bug，现已修复）：当前策略是 CMS 管 .md、VSCode 管 .mdx，两者互不干扰
- **仓库名手滑**：config.yml 里 repo 名写错下划线/连字符，CMS 直接报"无访问权限"（本质是 GitHub 404 的另一种翻译），排查半天才发现是名字问题
- **CMS 把空字段写成 `''`**：Sveltia 保存文章会重写 frontmatter，空的可选字段会变成空字符串，zod 4 会把 Invalid Date 判为类型错误导致构建失败，需要在 schema 里用 `z.preprocess` 把空串转 `undefined` 根治

## 8. 结语

旧版那篇《我的博客创建和运行的框架》成了历史文档，这篇是它的续篇。内容从"自建一切"走向"用成熟的轮子"，写作从"一个入口"变成"四个入口"，部署从"养服务器"变成"零服务器"，但内核没变：**内容永远是 Git 仓库里的文件，可迁移、可追溯、可版本控制**。等 Obsidian 方案落地、图片全部迁到 COS 之后，我再回来更新这篇。
