---
title: "我的博客创建和运行的框架(ai整理生成)"
description: "我让ai总结了我的博客创建路程"
pubDate: "2026-03-16T21:30"
tags: ["总结"]
---

这是我给自己搭的一个“内容可自管理”的博客项目：页面用 Next.js 渲染与路由，内容以静态文件形式存进仓库里；当我想更新文章/图片/配置时，我在前端导入 GitHub App 私钥，前端会直接调用 GitHub API 把内容提交回仓库，然后触发部署更新。本期是ai总结的

## 1. 我用的技术栈与运行形态

我用的是 Next.js App Router 作为主框架（入口在 app），并配合：

- React + TailwindCSS 做 UI
- SWR 做前端数据拉取（例如文章索引）
- Zustand 管理鉴权态/编辑态（比如是否已导入私钥）
- Markdown 渲染：`marked` 解析 + Shiki 代码高亮 + KaTeX 数学公式（实现见 markdown-renderer.ts、use-markdown-render.tsx）

部署方面我给自己留了两条路：

- 常规 Next.js 部署（例如 Vercel）
- OpenNext 打包到 Cloudflare Workers（配置见 open-next.config.ts、wrangler.toml）

## 2. 我的内容是怎么组织的（核心：静态文件 + 两个索引）

我把“文章”当作一组静态资源，统一放在 blogs 下：

- 单篇文章目录：`public/blogs/{slug}/`
  - 正文：`index.md`
  - 元信息：`config.json`（标题、日期、标签、摘要、封面、隐藏、分类等）
  - 图片：同目录下若干图片文件（文件名用 hash，避免重复上传）
- 全站文章索引：index.json
  - 列表页会直接请求它（见 use-blog-index.ts）
- 分类配置：categories.json（你当前打开的就是 categories.json）
  - 分类读取逻辑见 use-categories.ts

这样做的好处是：页面渲染只需要读静态文件，速度快、结构直观；内容版本也天然跟着 Git 走。

## 3. 我是怎么“写一篇文章并发布”的

我在写作页编辑内容（页面在 page.tsx），点击发布/更新时，前端会做这些事（核心实现见 push-blog.ts）：

1. 如果我在正文里插入了本地图片：先算 hash，把图片上传到 `public/blogs/{slug}/{hash}.{ext}`，并把 Markdown 里 `local-image:{id}` 占位替换成真实路径。
2. 写入文章正文 `public/blogs/{slug}/index.md`。
3. 写入文章配置 `public/blogs/{slug}/config.json`（标题、日期、标签、封面等）。
4. 更新全站索引 index.json（生成逻辑见 blog-index.ts）。
5. 用 GitHub API 批量创建 tree → commit → update ref，把这一切作为一次提交推到目标分支（GitHub API 封装见 github-client.ts）。

## 4. 我为什么能“在网页上直接改仓库内容”（GitHub App 鉴权）

我用 GitHub App 来管理仓库写权限：

- 我在网页里导入 GitHub App 的私钥（`.pem` 文件），私钥会被 Zustand 保存，并可选地加密缓存到 sessionStorage（见 use-auth.ts、auth.ts）。
- 前端用私钥签发 JWT → 查询 installation id → 换取 installation token → 用这个 token 调 GitHub API 写文件/提交（API 逻辑见 github-client.ts）。
- 私钥非常敏感：我只在本地导入使用，绝不上传到公开仓库或任何不可信位置。

## 5. 我是怎么运行它的（本地与构建）

脚本都在 package.json：

- 本地开发：`pnpm dev` 
- 生产构建：`pnpm build`
- 生产启动：`pnpm start`
- Cloudflare（OpenNext）链路：`pnpm run build:cf` / `pnpm run preview` / `pnpm run deploy`

## 6. 文章如何被访问、以及 RSS/Sitemap 怎么来的

- 列表页在 page.tsx，从 `/blogs/index.json` 拉取文章列表并渲染。
- 详情页在 [src/app/blog/[id]/page.tsx](src/app/blog/[id]/page.tsx)，通过 load-blog.ts 去请求：
  - `/blogs/{slug}/config.json`
  - `/blogs/{slug}/index.md`
- RSS 输出在 route.ts，它读取 index.json 来生成 feed。
- Sitemap 在 sitemap.ts，同样从 index.json 生成文章 URL 列表。

## 7. 我给自己的一个小结

这个项目对我来说最关键的一点是：内容与站点同仓库管理、更新链路可追溯、并且我可以在前端完成“写作 → 提交 → 部署更新”的闭环。后续我会继续把写作体验、分类管理和站点配置逐步打磨好。我先把 README 里你提到的“云服务器 + Nginx + PM2 + webhook/hooks.json”那段原始步骤再精确读一遍，确保写进第一人称博客时不漏关键信息。

## 8. 我在云服务器上怎么部署（Nginx + PM2 + webhook + hooks.json 自动更新）

除了 Vercel / Cloudflare 这类平台部署，我自己也会在云服务器上跑一套更“可控”的部署与自动更新链路：Nginx 做反向代理，PM2 守护 Next.js 进程，同时用 webhook 服务监听 GitHub 推送事件，自动拉代码、构建并重启。

我自己的完整流程是这样的：

- 环境准备：安装 Node.js / pnpm / Git / webhook / PM2 + Nginx
- Nginx 配置：反向代理 80 端口到 Next.js（3000）、webhook（9000），并对静态资源做缓存策略
- 代码部署：克隆 GitHub 代码到 `/var/www/blog-public` → `pnpm install` → `pnpm build`
- 后台运行服务：
  - PM2 启动 Next.js：`pm2 start npm --name "blog" -- run "start"`（3000 端口）
  - PM2 启动 webhook：`pm2 start webhook --name webhook -- -hooks /var/www/blog-public/hooks.json -port 9000`（9000 端口）
- 配置开机自启：`pm2 save && pm2 startup` + `systemctl enable nginx`
- GitHub WebHook 配置：Payload URL 填 `http://我的域名或IP/hooks/deploy`（走 Nginx 的 80 端口），触发推送事件
- 自动更新链路：本地推送 → GitHub → Nginx 转发 → webhook 触发脚本 → 拉取代码/重构 → PM2 重启服务 → Nginx 对外提供访问

### hooks.json 我怎么写（示例）

我会在服务器的 `/var/www/blog-public/hooks.json` 放一个 webhook 配置文件，核心就是定义一个 id 为 `deploy` 的 hook，对应访问路径 `/hooks/deploy`。下面是一个“最小可用”的示例（具体字段你可以按自己的 webhook 工具版本调整）：

```json
[
  {
    "id": "deploy",
    "execute-command": "/var/www/blog-public/deploy.sh",
    "command-working-directory": "/var/www/blog-public"
  }
]
```

我通常还会加上签名校验/密钥（避免任何人都能打到这个接口触发部署），以及只允许特定分支/事件触发。

### deploy.sh 我怎么写（示例）

我会让 webhook 调用一个脚本来做拉取、安装、构建、重启（你可以按自己的分支名、包管理策略微调）：

```bash
#!/usr/bin/env bash
set -e

cd /var/www/blog-public

git pull origin main
pnpm install
pnpm build

pm2 restart blog
```

写到这里，这条“自建云服务器”链路对我来说就闭环了：内容一旦写回仓库（无论是我在前端发布，还是我本地 push），服务器都会自动同步并更新线上站点。

