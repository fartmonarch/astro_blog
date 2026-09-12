# Sveltia CMS 配置与使用指南

> **定位**：`/admin/` 就是这个博客的写作后台。GitHub Token 登录 → 填字段 → Publish → 自动 commit 到 `main` → Vercel 构建上线。不用碰终端和 Git 命令。
> **仓库内置版本**：Sveltia CMS **0.191.1**（单文件，无需构建）；npm 当前最新 **0.210.3**，升级见 [第七节](#七升级-sveltia-cmsjs)。
> **核对时间**：2026-09-12，HEAD `45d5075`。
> **相关文档**：[《博文编写实施文档.md》](./博文编写实施文档.md)（最初实现方案）、[《分类标签体系改造方案.md》](./分类标签体系改造方案.md)（分类与标签的语义）、[《图片上传COS操作指南.md》](./图片上传COS操作指南.md)（图片迁移，**尚未执行**）。

---

## 一、现状速览

| 项 | 值 |
|---|---|
| 线上后台 | <https://www.fartmonarch.xyz/admin/>（已实测 HTTP 200，标题「博客管理后台」） |
| 本地后台 | <http://localhost:4321/admin/> |
| 登录方式 | GitHub Personal Access Token（classic，scope 勾 `repo`）。登录页按钮文案是 **Sign In Using Access Token** |
| 后端 | `backend.name: github`，仓库 `fartmonarch/astro_blog`，分支 `main` |
| 管理范围 | 只识别 `src/content/blog/*.md`。当前 11 个 `.md` 在列表里；`hello-world.mdx` 不在（`extension: md`），继续用 VSCode 维护 |
| 图片 | **CMS 内没有开启图片上传**。正文图片现状是仓库内 `/images/<slug>/xxx`（9 处引用，对应 `public/images/` 16 个文件）；迁 COS 外链的方案已写好但**还没执行** |
| 发布链路 | CMS → GitHub API 提交 → Vercel 检测 `main` 变化 → 自动构建。改动通常几十秒上线 |

三件套都在 `public/admin/`，构建时原样拷进 `dist/admin/`（已核对产物与本目录内容一致）：

| 文件 | 作用 | 注意 |
|---|---|---|
| `index.html` | 后台入口页 | 12 行，**只有一个 `<script>`**。不要加 CSS `<link>`，也不要给 `<script>` 加 `type="module"`（当前版本不是 ES module，加了会让 JS API 行为异常） |
| `sveltia-cms.js` | CMS 本体，单文件 1.9 MB | 仓库自带、不参与打包。想改成 CDN 引用见 [6.10](#610-两个可选开关) |
| `config.yml` | CMS 配置 | 字段定义与 `src/content.config.ts` 的 schema 是一对一映射，**改一边必须检查另一边** |

`config.yml` 默认从与 `index.html` 同目录加载（线上就是 `/admin/config.yml`），改完刷新页面生效。

```
浏览器 /admin/  ──►  sveltia-cms.js（读同目录 config.yml）
                        │  GitHub REST API（用你的 PAT）
                        ▼
              fartmonarch/astro_blog  main 分支
                        │  push 触发
                        ▼
                 Vercel 构建 → fartmonarch.xyz
```

---

## 二、它是怎么接上的

### 2.1 `config.yml` 逐段说明

```yaml
backend:
  name: github
  repo: fartmonarch/astro_blog   # 必须与实际仓库名完全一致（曾因写成 astro-blog 直接登录失败）
  branch: main

media_folder: "public/images"    # 占位用：不配云存储时 Sveltia 要求给一个媒体目录，
public_folder: "/images"         # 但本项目没在 CMS 里用它上传图片（见 2.2）

site_url: https://fartmonarch.xyz

collections:
  - name: "blog"                 # 集合内部名，列表左侧显示 label
    label: "博客文章"
    folder: "src/content/blog"   # 就是 Astro 的 blog collection 目录
    create: true                 # 允许新建
    delete: true                 # 允许删除
    extension: md                # 新建文件保存为 .md（.mdx 因此不在列表里）
    format: frontmatter          # YAML frontmatter + 正文
    slug: "{{fields._slug}}"       # 文件名 = slug，也就是文章 URL；编辑器里有必填的 Slug 输入框（见 6.4.1）
    editor:
      preview: false             # 关掉预览 iframe，Astro 没有对应的预览地址，开着会报错
    fields: [ ... ]
```

字段部分（`fields`）目前 7 个，顺序就是 frontmatter 的写入顺序：

| CMS 字段 | widget | 写入 frontmatter | schema 约束（`src/content.config.ts`） |
|---|---|---|---|
| 标题 | `string` | `title` | `z.string()` 必填 |
| 描述 | `text` | `description` | `z.string()` 必填 |
| 发布日期 | `datetime`（`YYYY-MM-DD`，无时间） | `pubDate` | `z.coerce.date()` 必填 |
| 更新日期（可选） | `datetime` | `updatedDate` | 可选，空值经 `preprocess` 转 `undefined` |
| 分类 | `select` 多选，最多 3 | `categories` | `z.enum(CATEGORIES).max(3).default([])`，**留空 = 未分类** |
| 标签（仅展示，不参与分类） | `list` | `tags` | `z.array(z.string()).default([])`，不生成页面 |
| 正文 | `markdown` | frontmatter 之外的正文 | — |

两个易错点：

- **`required` 默认是 `true`。** 只有显式写 `required: false` 的字段才能留空。当前「更新日期」「分类」「标签」都写了。
- **`categories` 与 `tags` 是两层东西**：只有 `categories` 会生成 `/tags/<分类>/` 页面、详情页里可点击；`tags` 只做关键词弱化展示。分类词表有**两个来源必须同步**：`src/config.ts` 的 `CATEGORIES` 和本文件 select 的 `options`。

### 2.2 为什么是现在这个配置（三个决策）

| 决策 | 原因 |
|---|---|
| 用 PAT 而不是 OAuth App | 单人博客场景，PAT 是零额外服务的最短路径：不需要 client_id、不需要自建 OAuth 中转。代价是 token 有效期到了要重新贴一次 |
| CMS 内不开图片上传 | 图片存量和后续规划都走外链（详见 3.3），仓库保持轻量。CMS 只当编辑器用，`media_folder` 纯属满足配置校验的占位 |
| `extension: md` + `preview: false` | 现有内容没有 MDX 组件语法；关预览是因为 Astro 没有可供 CMS 嵌 iframe 的预览路由 |

### 2.3 配置边界：改什么要动哪些文件

CMS 本体只需要 `public/admin/` 三个文件；另外两个是 Astro 侧"必须跟着改"的：

| 文件 | 属于谁 | 什么时候动它 |
|---|---|---|
| `public/admin/index.html` | CMS | 基本不动。只有改用 CDN 引用时才动（[6.10](#610-两个可选开关)） |
| `public/admin/sveltia-cms.js` | CMS | 只在升级版本时动（[第七节](#七升级-sveltia-cmsjs)） |
| `public/admin/config.yml` | CMS | 增删字段、改分类选项、改界面 / slug / 输出设置 |
| `src/content.config.ts` | Astro | **增删字段必须同步**，否则 CMS 存得进去、构建会失败 |
| `src/config.ts` | Astro | 分类白名单的代码侧来源，**增删分类必须同步**（[6.11](#611-新增--删除分类)） |

再往下就是展示层：新字段想在页面上显示，还需要改 `src/layouts/BlogPost.astro`（详情页）、`src/pages/index.astro` 与 `archive.astro`（列表）、`src/pages/rss.xml.ts`。到这一步就不止五个文件了。

---

## 三、快速上手：发一篇文章

### 3.1 首次准备：生成 GitHub Token（约 2 分钟）

1. 打开 <https://github.com/settings/tokens> → **Generate new token (classic)**
2. 勾权限 **`repo`**（读写仓库内容必需），有效期自选（建议 90 天）
3. 生成后**立刻复制**（只显示一次）
4. 打开 <https://www.fartmonarch.xyz/admin/> → **Sign In Using Access Token** → 粘贴 → 登录
   （官方文档把这个按钮写作 "Sign In with Token"，当前 0.191.1 界面上的实际文案是前者）

Token 只存在浏览器 local storage，不进代码、不上服务器。怀疑泄露就去 GitHub 设置里 revoke 重建。GitHub Token 页面上的 scope 名称官方文档没有逐条列出，但 `repo` 一定够用。

### 3.2 发文五步

1. 左侧选 **博客文章** → 右上 **New 博客文章**
2. 填字段（参考 2.1 的表）：
   - **标题**：中文随便写，不影响显示
   - **描述**：一句话，会用在列表页、SEO、RSS
   - **发布日期**：默认今天，`YYYY-MM-DD`
   - **更新日期**：可以留空
   - **分类**：从 4 个白名单里勾 0~3 个。**不确定就留空**，文章落到「未分类」，之后随时回来补
   - **标签**：自由关键词，能留空；它只是展示
3. 写正文。Markdown 语法；代码块支持语言高亮
4. **填 Slug（文件名/URL）**：编辑器里有一个必填的 **Slug** 输入框，填英文短横线（如 `hibit-uninstaller-registry-cleanup-issues`）。空着、含空格或 `/`、或与已有文章重名都会被拦住。这是 2026-09-12 起的行为（配置见 [6.4.1](#641-解决先保存再改文件名这个两步操作)），不再需要"保存后再改名"
5. 右上 **Publish** → 自动 commit 到 `main`

### 3.3 正文里放图片

CMS 内没有图片上传按钮，直接贴 Markdown 图片链接：

```markdown
![说明文字](https://fartmonarch-cos-1344165548.cos.ap-shanghai.myqcloud.com/img/xxx.webp)
```

存量图片还在仓库里，引用形如 `![](/images/incubator-camp/xxx.webp)`，能正常显示。新图用 PicGo 粘贴上传到 COS 拿外链（配置见[《图床自动化方案.md》](./图床自动化方案.md)），存量迁移步骤见[《图片上传COS操作指南.md》](./图片上传COS操作指南.md)。想直接让 CMS 传图到 COS，见 [6.8](#68-可选让-cms-直接传图到-cos)。

### 3.4 发布后验证

| 检查 | 方式 |
|---|---|
| 有没有提交 | 本地 `git pull` 后 `git log --oneline -3`，CMS 会产生独立 commit |
| 构建成功没 | Vercel 面板 / 仓库的 Deployments |
| 线上效果 | 打开 `https://www.fartmonarch.xyz/blog/<slug>/` |

### 3.5 改 / 删 / 补分类

- **改文章**：列表点进去改，Publish。有实质更新就填「更新日期」
- **回填分类**：打开文章 → 勾选分类 → Publish
- **删除**：列表项右侧菜单 → Delete（会真的删仓库文件）
- **找没归类的**：打开 `/tags/未分类/`，当前 11 篇在那里等分类

---

## 四、本地调试（不碰线上仓库）

改 `config.yml` 或试排版时用本地模式，改动只落在本地文件，不会 commit：

1. 起本地服务：`astro dev`（本项目按 `AGENTS.md` 用后台模式 `astro dev --background`）
2. 用 **Chromium 内核浏览器**（Chrome / Edge / Brave）打开 <http://localhost:4321/admin/index.html>
   - 必须带 `index.html`，别用 `/admin/`
   - Firefox / Safari **不支持**（依赖 File System Access API）
3. 点 **Work with Local Repository** → 在弹出的选择框里选**项目根目录**（含 `.git` 的那层）
4. 正常编辑，直接落盘到 `public/admin/`、`src/content/blog/` 等真实文件
5. 自己用 Git 提交：`git diff` 看完再 `git add -A && git commit -m "..."`

要点：

- 本地模式**不做任何 Git 操作**，也不会帮你 push
- 本地模式**不需要认证**，也不用贴 token；只改本地文件的话，`backend` 里的 `repo` 甚至可以是随意一个仓库名
- 官方明确：`local_backend` 选项**已被忽略**，也不需要 `netlify-cms-proxy-server` / `decap-server`（Sveltia 不含这类代理服务）。0.191.1 的 bundle 里同样把 `local_backend` 归入「不支持、已忽略」的选项
- 改完 `config.yml` 要刷新页面才生效
- 只想试界面、不想动本地文件：把 `backend.name` 临时改成 `test`，用浏览器内的虚拟文件系统练手
- Account 菜单里会显示一个"正在用本地工作流"的指示器

### 4.1 选不中项目根目录时

CMS 的验证逻辑（0.191.1 bundle 内已确认）：弹出目录选择器拿到你选的目录后，用 `getDirectoryHandle('.git')` 检查**这一层里有没有 `.git`**（`.git` 是目录或文件都算，文件的情况来自 worktree / submodule）。找不到就报 `The selected folder is not a repository root directory. Please try again.`。

按你实际看到的现象对照：

| 现象 | 原因 | 处理 |
|---|---|---|
| 登录页看不到这个按钮，或按钮是灰的 | 不是 Chromium 内核；或不是从 `localhost` / `127.0.0.1` 打开的（比如用局域网 IP、自定义域名访问 dev server） | 换 Chrome / Edge / Brave；网址用 `http://localhost:4321/admin/index.html` |
| 选择框里那个目录选不中 / 是灰的 / 提示"此文件夹包含系统文件" | Chrome 不允许把虚拟目录、网络盘、系统目录、WSL 路径交给网页 | 换成真实本地路径；项目别放在 OneDrive 同步目录或映射网络盘里；WSL 场景见[官方 issue](https://github.com/sveltia/sveltia-cms/issues/38) |
| 选完报 `not a repository root directory` | 选的那层里没有 `.git` | 选**直接包着 `.git` 的那一层**。本项目是 `D:\Code\project\astro_blog`，不是 `D:\Code\project`，也不是 `src` |
| 报 `A repository root directory could not be selected` | 你在选择框里取消了（或对话框没正常弹出） | 重来一次，选中文件夹后点对话框的确认按钮 |
| 刷新页面后登录失败，提示拿不到目录句柄 | IndexedDB 里记着的旧句柄失效了（目录被移动/改名/权限被撤） | 再点一次 "Work with Local Repository" 重新选；仍不行就清掉 `localhost:4321` 的站点数据 |
| 项目是从 ZIP 解压出来的 | 没有 `.git`，验证必然失败 | 先 `git init`（或改用 `git clone`）再选 |

顺带说一句：**本地工作流是可选的**。你本来就习惯 VSCode + `git push` 的话完全不用碰它，本地改完推上去，让 Vercel 出个 Preview 部署看效果，比调这个选择框省事。

---

## 五、从零重建（换仓库 / 换电脑 / 重装）

### 5.1 建目录与入口页

```powershell
New-Item -ItemType Directory -Force public\admin | Out-Null
```

`public/admin/index.html`：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex" />
  <title>博客管理后台</title>
</head>
<body>
  <script src="sveltia-cms.js"></script>
</body>
</html>
```

### 5.2 下载 CMS 本体

```powershell
# Windows PowerShell
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/@sveltia/cms@0.191.1/dist/sveltia-cms.js" -OutFile public\admin\sveltia-cms.js
```

```bash
# bash / Git Bash
curl -L -o public/admin/sveltia-cms.js https://cdn.jsdelivr.net/npm/@sveltia/cms@0.191.1/dist/sveltia-cms.js
```

下完确认文件是单行 IIFE（约 1.9 MB）即可：

```powershell
(Get-Item public\admin\sveltia-cms.js).Length   # 0.191.1 约 1908085
(Get-Content public\admin\sveltia-cms.js -TotalCount 1).Substring(0,20)   # (function(e){Objec
```

### 5.3 写 `config.yml`

完整内容（与当前仓库一致，可直接复制）：

```yaml
backend:
  name: github
  repo: fartmonarch/astro_blog
  branch: main

# 认证：GitHub Personal Access Token（登录页点 "Sign In with Token" 粘贴即可）
# 无需 OAuth App；Token 仅保存在浏览器 local storage。

# 图片继续走 COS 图床外链，CMS 内不启用仓库图片上传
# （media_folder / public_folder 为满足配置要求而保留）
media_folder: "public/images"
public_folder: "/images"

site_url: https://fartmonarch.xyz

collections:
  - name: "blog"
    label: "博客文章"
    folder: "src/content/blog"
    create: true
    delete: true
    extension: md
    format: frontmatter
    # {{fields._slug}} 是 Sveltia 的特殊 token：编辑器里会多出一个必填的 Slug 输入框，
    # 新建文章时直接填英文短横线，省掉「先保存、再 ⋮ → Edit Slug 改名」这一步。
    # 保存前会校验：不能为空、不能含 "/" 或空格、不能与已有文章重名。
    # 想退回按标题自动生成文件名，改回 slug: "{{slug}}"
    slug: "{{fields._slug}}"
    editor:
      preview: false          # Astro 无现成预览 iframe，关闭避免报错
    fields:
      - { label: "标题", name: "title", widget: "string" }
      - { label: "描述", name: "description", widget: "text" }
      - { label: "发布日期", name: "pubDate", widget: "datetime", format: "YYYY-MM-DD", date_format: "YYYY-MM-DD", time_format: false }
      - { label: "更新日期（可选）", name: "updatedDate", widget: "datetime", format: "YYYY-MM-DD", date_format: "YYYY-MM-DD", time_format: false, required: false }
      - { label: "分类", name: "categories", widget: "select", multiple: true, min: 0, max: 3, required: false, default: [], options: ["技术笔记", "博客建设", "生活记录", "问题排查"], hint: "留空 = 未分类，之后可以随时回来补。只有这里选中的分类才会生成分类页面。" }
      - { label: "标签（仅展示，不参与分类）", name: "tags", widget: "list", default: [], required: false, hint: "只做关键词展示，不会生成分类页面。" }
      - { label: "正文", name: "body", widget: "markdown" }
```

### 5.4 两条认证路线，选一条

| | PAT（当前方案，推荐） | OAuth App |
|---|---|---|
| 额外服务 | 无 | 需要自建 OAuth 中转（官方推荐 Cloudflare Worker 版 [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth)） |
| 配置 | 什么都不用加，登录页直接贴 token | `backend` 下只加一行 `base_url: https://<你的中转域名>`（`auth_endpoint` 默认 `auth`） |
| 密钥放哪 | 你手动生成、只存浏览器 | Client ID / Secret 放中转服务的环境变量（sveltia-cms-auth 用 `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`），**不写进 `config.yml`** |
| 体验 | 每次 token 过期要重新贴 | 一次授权，长期可用 |
| 适合 | 单人写博客 | 多人协作、不想管理 token |

> 官方目前**不支持** PKCE 授权（schema 里 `auth_type: pkce` 标注为尚未支持）；`app_id` 这个键存在，但 GitHub 场景用不到。

**只想要"贴 token"这一种登录方式**，可在 `backend` 下加：

```yaml
  auth_methods: [token]   # 默认是 oauth + token 都开；空数组会直接报配置错误
```

这条在本项目有实际意义：`base_url` 默认指向 `https://api.netlify.com`（Netlify 作为 OAuth provider 的默认路径），而本站不部署在 Netlify，登录页上那颗 "Sign In with GitHub" 按钮点了会失败。只留 token 方式可以让登录页更干净。

### 5.5 验证清单

- [ ] `astro dev` 后打开 `/admin/index.html` 能出现登录页
- [ ] 贴 PAT 能进后台，左侧出现「博客文章」
- [ ] 新建一篇：分类留空能保存，Publish 后仓库出现 `src/content/blog/<slug>.md`
- [ ] frontmatter 顺序与 `config.yml` 字段顺序一致，`pubDate` 是 `YYYY-MM-DD`
- [ ] 线上 `/admin/` 打开正常，`/blog/<slug>/` 能看到新文章

---

## 六、个性化配置速查

以下片段都加到 `config.yml`（根级配置放最外层，`backend` 下的缩进两格）。**建议先在本地 [第四节](#四本地调试不碰线上仓库) 试，确认无误再推线上。**

### 6.1 界面

```yaml
app_title: 沫之白的小窝 · 后台        # 登录页标题 + 浏览器标签页标题（默认 Sveltia CMS）
logo:
  src: /avatar.png                  # 图片放 public/ 下，用绝对路径；方图最佳，512×512 推荐
  show_in_header: true              # 同时用作登录页、页头、favicon、PWA 图标
site_url: https://www.fartmonarch.xyz   # 建议改成实际访问域名（裸域会 301 到 www）
display_url: https://www.fartmonarch.xyz  # UI 上"查看站点"链接的目标，默认取 site_url
logout_redirect_url: https://www.fartmonarch.xyz  # 退出后跳哪
show_preview_links: false           # 关掉"预览"链接（本项目没配预览路由）
```

> `logo_url`（旧写法）仍可用但已废弃，新配置用 `logo.src`。
> 注意 `public/avatar.png` 有 1.6 MB，当 favicon 太重。建议另存一张 512×512 的小图（比如 `public/admin-logo.png`）给 CMS 用，页面的头像继续用原图。

### 6.2 字段：增删改

```yaml
    fields:
      # 加个"草稿"开关：true 时详情页不展示（需要同步改 schema 与页面模板）
      - { label: "草稿", name: "draft", widget: "boolean", default: false, required: false }

      # 加个"封面图"：只存外链字符串，不触发 CMS 上传
      - { label: "封面图 URL", name: "cover", widget: "string", required: false, hint: "填 COS 外链" }

      # 给已有字段加输入提示（显示在输入框下方，支持粗体/斜体/链接）
      - { label: "描述", name: "description", widget: "text", hint: "会用在列表页、SEO 和 RSS" }
```

- **加字段必须同步 `src/content.config.ts`**，否则 CMS 能保存、`astro build` 会因多余字段或类型不符报错（严格模式下会失败）
- 必填/可选：不写 `required: false` 就是**必填**
- 想让字段只读：`readonly: true`；想给默认值：`default: xxx`
- 改 `content.config.ts` 时，`z` 从 **`astro/zod`** 导入，别从 `astro:content` 导（见 8.2 第一行）

### 6.3 列表页更好用（文章多了以后加）

```yaml
    identifier_field: title          # 用哪个字段当条目标题（默认就是 title）
    summary: "{{title}} · {{pubDate}}"   # 列表行显示的内容
    sortable_fields: [pubDate, title, updatedDate]   # 允许点击排序的列
    view_filters:                    # 预设筛选按钮（pattern 是正则或精确值）
      - { label: "有更新", field: updatedDate, pattern: ".+" }
    view_groups:                     # 按年份分组
      - { label: "年份", field: pubDate, pattern: "\\d{4}" }
```

- `sortable_fields` 默认是 `title` / `name` / `date` / `author` / `description`，Git 后端还会自动带上 commit 作者与日期。想指定默认排序方向用扩展写法：`sortable_fields: { fields: [pubDate, title], default: { field: pubDate, direction: descending } }`
- `view_filters` / `view_groups` 的 `field` 指向**标量字段**最稳妥；`categories` 这类数组字段能否直接筛，官方没有示例，建议先在本地试
- **没有** `default_sort` 这个键，也**没有**集合级 `search_fields`：搜索是内置的全文搜索，不提供配置
- 字段名写错不会报错，只会静默失效。改完看一眼列表页是否符合预期

### 6.4 slug（文件名 / URL）

```yaml
slug:
  encoding: unicode        # 默认；中文标题会生成中文文件名
  # encoding: ascii        # 改成 ascii 只允许 0-9 a-z A-Z - _ ~，中文会被替换掉，慎用
  clean_accents: false     # true 时 é→e、ß→ss
  sanitize_replacement: "-"
  lowercase: true          # false 保留原大小写
  trim: true               # 去掉首尾的替换字符
  maxlength: 80            # 限制文件名长度，避免超长 URL
  timezone: utc            # 影响 {{day}} {{hour}} 这类日期标签，可改 local
```

- 集合里还能写自己的 `slug: "{{year}}-{{slug}}"`，可用标签：`{{slug}}`、`{{year}}`…`{{second}}`（条目创建日期）、`{{uuid}}`/`{{uuid_short}}`/`{{uuid_shorter}}`、以及任意字段名（嵌套用点号，如 `{{author.name}}`）。**slug 模板不能含 `/`**，要分子目录得用 `path`
- `slug.encoding: ascii` 只做"删掉非 ASCII 字符"，**没有拼音转换**。纯中文标题会被清成空串，代码随后兜底塞一个随机短 id，URL 变成 `/blog/392bdcf3b642/`，比中文还糟。别指望它

#### 6.4.1 解决"先保存、再改文件名"这个两步操作

成因：集合默认 `slug: "{{slug}}"`，而 `{{slug}}` 取 `identifier_field`（默认 `title`）再做 slug 化。中文标题 slug 化后仍是中文，文件名于是变成中文，只能保存完再 ⋮ → Edit Slug 改一次。

**方案 A：让 Slug 在编辑器里就能填（已应用）**

```yaml
    slug: "{{fields._slug}}"
```

`{{fields._slug}}` 是 Sveltia 的特殊 token（bundle 里对应 `slugEditor`）：模板里出现它，编辑器就会多出一个**必填的 Slug 输入框**，新建文章时直接填英文短横线，保存即用，不存在"事后改名"。它在保存前会挡三种情况：空（`The slug cannot be empty.`）、含 `/` 或空格、与已有文章重名（`This slug is used for another entry.`）。因为空值会被拦住，所以不会出现"忘了填、文件名变成一串随机字符"的情况。

本项目已于 2026-09-12 应用（`public/admin/config.yml`）。第一次用时建议在本地模式确认一下它有没有预填内容，再决定怎么用。想退回原行为就把这一行改回 `slug: "{{slug}}"`。

> **这个输入框的标题是"别名"，不是"文件名"。** 标题来自 Sveltia 内置的中文界面文案（英文原文是 `Slug`），由远程语言包提供，`config.yml` 里改不了，也没有对应的配置项。想换标题只有两条路：
>
> 1. **换界面语言**：CMS 里进偏好设置（Preferences）→ Language → User Interface Language，切成 English，它就会显示 `Slug`。功能完全不变。
> 2. **不用内置控件**：改成下面的方案 B，标题就是你写的 `label`。代价是**改名只能走 ⋮ → Edit Slug**（那个字段只负责创建时定名），而且 frontmatter 里会多一个键。
>
> **已决定（2026-09-12）：保留内置控件，接受"别名"这个译名。** 理由是这个控件能随时改名，而方案 B 失去这个能力、还要往每篇 frontmatter 里塞一个冗余键；文案上的别扭不值得换。哪天改用英文界面就顺手解决了。

**方案 B：加一个普通字段，用它的值当文件名**

```yaml
    slug: "{{fields.slugEn}}"
    fields:
      - { label: "英文文件名", name: "slugEn", widget: "string", hint: "英文短横线，如 my-post-title" }
```

效果与 A 接近，区别是这个值会写进 frontmatter（Astro 的 `z.object` 默认丢掉未声明的键，不会构建失败），而且能像其他字段一样配 `required` / `hint`。

⚠️ 方案 B 有一个 A 没有的限制：文件名只在**创建那一刻**按这个字段算。之后再改这个字段的值，文件不会被重命名（Sveltia 对已存在的条目直接用现文件名），只会让 frontmatter 和文件名对不上。要改名仍得用 **⋮ → Edit Slug**。

**方案 C：改 `identifier_field`**

把条目标识字段换成一个英文标题字段：`identifier_field: slugTitle`，再用 `summary: "{{title}}"` 让列表仍然显示中文标题。文件名全自动，代价是每篇多填一个英文标题。

**方案 D：不改，接受中文文件名**

Astro 用文件名当路由，中文文件名照样能构建和访问，只是 URL 会被百分号编码，分享和 SEO 都难看。不在意就不用动配置。

无论用哪种方案，改 slug 都会让旧链接 404。Sveltia 可以用 `aliases_field` + `preview_path` 把旧路径写进 frontmatter 的 `aliases`，但 Astro 不读这个字段，本项目没接这套；要保旧链接只能在 `astro.config.mjs` 的 `redirects` 里补 301。

### 6.5 输出稳定性（本项目的重点）

Sveltia 与 Decap 有个关键差异：**所有字段都会被写出来，空的写成 `''` 或 `[]`，而不是省略**。本项目就栽过一次，CMS 保存文章时写了 `updatedDate: ''`，zod 判成 Invalid Date，Vercel 构建失败。当时的修法是在 `content.config.ts` 里用 `z.preprocess` 兜住。

现在可以在源头关掉这个行为：

```yaml
output:
  omit_empty_optional_fields: true   # 空的 optional 字段直接从输出里省略（0.191.1 已支持）
  yaml:
    quote: none                      # none / single / double；想统一双引号就写 double
    indent_size: 2
    indent_sequences: true           # false 会变成紧凑换行风格
```

`omit_empty_optional_fields: true` 是比 `preprocess` 更根治的做法，加上它以后 `content.config.ts` 的 `preprocess` 仍然可以留着当第二层保险（手写 frontmatter 时依然有用）。

### 6.6 提交信息与部署

```yaml
backend:
  # ...
  commit_messages:                   # 让 CMS 产生的 commit 更好认
    create: "cms: 新建 {{collection}} 「{{slug}}」"
    update: "cms: 更新 {{collection}} 「{{slug}}」"
    delete: "cms: 删除 {{collection}} 「{{slug}}」"
  # skip_ci: true                    # 提交时加 [skip ci]，本次不触发构建（谨慎用）
```

> Vercel 是"检测 push 就构建"，所以 CMS 每次 Publish 都会触发一次部署，这是预期的。

### 6.7 编辑器与工作流

```yaml
    editor:
      preview: false      # 现状。等以后有了预览路由，可以配 preview_path 打开真预览
    # preview_path: "blog/{{slug}}"   # 配合上面的 preview 使用
```

```yaml
publish_mode: editorial_workflow   # 草稿 → 审核 → 发布（走 PR）
```

⚠️ **0.191.1 不支持 `editorial_workflow`**：bundle 内置的警告列表里明确把它标为不支持，写了会在界面上提示。官方当前 schema 标注该模式仅 GitHub / GitLab 后端可用。想要"先存草稿再发布"的流程，先升级 bundle（[第七节](#七升级-sveltia-cmsjs)）。

### 6.8 可选：让 CMS 直接传图到 COS

当前正文图片是外链，够用。若想让 CMS 直接把文件传到 COS：COS 提供 S3 兼容接口，而 Sveltia 的媒体库支持自定义 `endpoint` 的 S3 兼容服务。`media_libraries` 是**按库名索引的映射**，键包括 `all`（共享基础配置）、`default`（默认库）和各 provider 名（`aws_s3`、`cloudinary`、`uploadcare`、`cloudflare_r2` 等），任一项写成 `false` 即禁用：

```yaml
media_libraries:
  aws_s3:
    access_key_id: <你的 SecretId>     # 只放 SecretId；SecretKey 不写这里
    bucket: fartmonarch-cos-1344165548
    region: ap-shanghai
    endpoint: https://cos.ap-shanghai.myqcloud.com   # 自定义 endpoint，COS 的 S3 兼容入口
    prefix: img/                       # 上传落到桶内 img/ 目录
    force_path_style: true
    public_url: https://fartmonarch-cos-1344165548.cos.ap-shanghai.myqcloud.com
```

已在官方 schema 与 0.191.1 bundle 中确认的点：

- **SecretKey 不要写进 `config.yml`**。首次使用媒体库时在 CMS 界面里输入，存在浏览器 local storage（缺了会报 `S3 secret access key is required`）。配置文件本身是公开可访问的
- 生成链接的规则：设了 `public_url` 就用 `{public_url}/{key}`，否则 `{endpoint}/{bucket}/{key}`。按上面的配置上传 `img/a.webp`，得到的 URL 与现有正文里的 COS 外链格式一致
- 桶需要开 CORS（允许 `GET`/`PUT`/`HEAD`，暴露 `ETag`），并保证资源可公共读

**仍未背书的两点，接入前自己验证**：

1. 官方 provider 清单里**没有腾讯云 COS**（只有 Amazon S3、Azure Blob、Cloudflare R2、Backblaze B2、DigitalOcean Spaces、Scaleway、Supabase、Cloudinary、Uploadcare）。COS 走 `aws_s3` + 自定义 `endpoint` 是**基于"S3 兼容"的推断**，官方没写这种情况。先在本地模式试上传，成功再上线上。
2. 本项目的 `media_folder` / `public_folder` 是为了满足配置校验而留的占位。若确认走外部媒体库，可以把 `media_folder` **整个删掉**来关闭内置媒体存储（官方文档明确这是关闭方式），避免以后误把图片提交进仓库。

没验证清楚前，保持现状（PicGo → 外链）是更稳的选择。

### 6.9 不要写的选项

这些键不在官方 schema 里，运行时会被当作"未定义、已忽略"并给出配置警告，写了没用还多噪音：

| 选项 | 说明 |
|---|---|
| `local_backend` | 本地工作流已改为浏览器直接读写文件，不再需要代理服务 |
| `locale` | UI 语言跟随浏览器，不是配置项 |
| `search` | 已由内置搜索取代，官方明确不实现 |
| `client_id` | 后端配置里**没有**这个键（OAuth 的 Client ID/Secret 放在中转服务的环境变量里，见 5.4） |
| `default_sort` | 不存在；默认排序用 `sortable_fields.default.{field,direction}` 表达 |
| 集合级 `search_fields` | 不存在；搜索是全库全文搜索，不可配置 |

### 6.10 两个可选开关

**① YAML 校验与补全**（强烈建议，零成本）。在 `config.yml` 第一行加：

```yaml
# yaml-language-server: $schema=https://unpkg.com/@sveltia/cms/schema/sveltia-cms.json
```

配合 VS Code 的 **YAML** 扩展（`redhat.vscode-yaml`），写错键名/类型会当场标红，也有补全提示。

**② 改用 CDN 引用**（可选）。若不想在仓库里存 1.9 MB 的单文件，可以把 `index.html` 的 `<script src="sveltia-cms.js">` 换成：

```html
<script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>
```

再删掉本地 `sveltia-cms.js`。代价：永远跟随最新版（可能突然有破坏性变更）、离线不可用、多一个外部依赖。**本项目选择 vendored（仓库自带）**，版本可控。

### 6.11 新增 / 删除分类

分类是**受控白名单**，两个地方必须同时改，缺一处就出问题：

| 文件 | 改什么 | 只改一处的后果 |
|---|---|---|
| `src/config.ts` | `CATEGORIES` 数组 | 只在 CMS 加：构建失败（值不在枚举里）；只在代码加：CMS 下拉里选不到 |
| `public/admin/config.yml` | 「分类」字段的 `options` | 同上，方向相反 |

**新增一个分类**（以 `踩坑记录` 为例），两处都追加：

```ts
// src/config.ts —— 数组顺序 = /tags/ 页面上卡片的显示顺序
export const CATEGORIES = ["技术笔记", "博客建设", "生活记录", "问题排查", "踩坑记录"] as const;
```

```yaml
# public/admin/config.yml —— options 顺序与上面保持一致
options: ["技术笔记", "博客建设", "生活记录", "问题排查", "踩坑记录"]
```

改完刷新 CMS 页面，新建文章的「分类」下拉里就能勾到它；`npm run build` 会多一个 `/tags/踩坑记录/` 页面（0 篇也会生成，索引页上显示成灰色卡片）。

**删除一个分类**：先把用了它的文章改掉，再从这两处删名字。顺序反了会直接构建失败并指出非法值：

```
[InvalidContentEntryDataError] blog → xxx data does not match collection schema.
  categories.0: Invalid option: expected one of "技术笔记"|"博客建设"|...
```

改文章两种方式：在 CMS 里逐篇打开、改勾选、Publish；或者直接在 VSCode 改 frontmatter 的 `categories`。删掉的分类对应的 `/tags/<旧分类>/` 页面会消失（404），本项目的 `redirects` 没为它补 301。

几个容易踩的点：

- **别把「未分类」写进 `CATEGORIES`**。它是"`categories` 为空"这个状态，由 `UNCATEGORIZED` 常量单独提供，塞进白名单会造出"同时勾未分类和某分类"的脏状态（详见[《分类标签体系改造方案.md》](./分类标签体系改造方案.md)）
- **分类名不能含 `/` 或 `#`**，它直接进 `/tags/<分类>/` 路由
- **单篇最多 3 个分类**：schema 的 `max(3)` 与 CMS 的 `max: 3` 是双保险，改词表不影响这个上限
- **重命名分类 = 删旧的 + 加新的**，同样遵循"先改文章、再改词表"

---

## 七、升级 `sveltia-cms.js`

仓库自带意味着升级要手动做一次。当前 0.191.1，最新 0.210.3。

```powershell
# 1. 备份当前文件（出问题能立刻换回）
Copy-Item public\admin\sveltia-cms.js public\admin\sveltia-cms.js.bak

# 2. 拉新版（把版本号换成目标版本）
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/@sveltia/cms@0.210.3/dist/sveltia-cms.js" -OutFile public\admin\sveltia-cms.js

# 3. 确认是单行 bundle
(Get-Item public\admin\sveltia-cms.js).Length
```

升级后按这个顺序验证：

1. 本地 `astro dev` → `/admin/index.html` → 用 **Work with Local Repository** 打开，确认能读到 11 篇文章、字段渲染正常
2. 试一次新建 / 编辑 / 保存（本地模式不动线上）
3. 打开浏览器控制台，确认没有配置警告（旧版本不支持的选项在新版可能变成错误）
4. 都正常再提交：

```powershell
Remove-Item public\admin\sveltia-cms.js.bak
git add public/admin/sveltia-cms.js
git commit -m "build: 升级 Sveltia CMS 0.191.1 -> 0.210.3"
git push
```

升级前建议看一眼 [Release Notes](https://github.com/sveltia/sveltia-cms/releases)，确认没有影响现有配置的破坏性变更（重点关注 `slug`、`output`、字段默认值）。

---

## 八、排错

### 8.1 本项目踩过的坑

| 现象 | 原因 | 处理 |
|---|---|---|
| 登录页贴了 token 仍报错 / 找不到仓库 | `backend.repo` 写成了 `astro-blog`（正确是 `astro_blog`） | 对齐仓库实际名称（commit `7ee4415`） |
| 保存文章后 Vercel 构建失败，报 Invalid Date | CMS 把空的 `updatedDate` 写成了 `''` | 已在 `content.config.ts` 用 `z.preprocess` 兜住；并建议加 `output.omit_empty_optional_fields: true`（commit `f6fd8d1`） |
| 打开编辑器提示预览错误 | Astro 没有预览路由，`preview` 默认开着 | 保持 `editor.preview: false` |
| 新建文章 URL 一长串百分号编码 | 旧配置 `slug: "{{slug}}"` 让中文标题变成中文文件名 | 已配 `slug: "{{fields._slug}}"` 根治（[6.4.1](#641-解决先保存再改文件名这个两步操作)）；已有中文文件名的老文章仍可用 **⋮ → Edit Slug** 改名 |
| `hello-world.mdx` 在 CMS 里看不到 | `extension: md`，CMS 只列 `.md` | 预期行为；该文继续用 VSCode 管，或转成 `.md` |
| 「标签」以前会被强制填写 | 字段默认 `required: true`，原配置没写 `required: false` | 已修；写新字段时记得显式声明 |
| 分类怎么选都存不下 / 构建报非法分类 | `src/config.ts` 的 `CATEGORIES` 与 `config.yml` 的 `options` 不一致 | 两处必须同步；schema 是硬校验，写错会直接构建失败 |

### 8.2 通用排查

| 现象 | 排查方向 |
|---|---|
| TS 提示 `z`（来自 `astro:content`）已废弃 | Astro 官方把 `astro:content` 的 `z` 标为废弃，提示改用 `astro/zod`。本项目已改成 `import { z } from "astro/zod"`（2026-09-12，构建 22 页通过）。两者是同一个 zod 实例，纯改名，无行为差异 |
| 登录页只有 GitHub 按钮 / 按钮点了没反应 | `base_url` 默认是 `https://api.netlify.com`，本站不在 Netlify 上。加 `auth_methods: [token]` 只保留贴 token 的登录方式 |
| 改了 `config.yml` 界面没变化 | 刷新页面；再确认线上 `https://www.fartmonarch.xyz/admin/config.yml` 的内容是你改的那份（Vercel 是否构建成功） |
| Publish 后线上没变化 | 看 Vercel 构建状态；构建失败通常是 frontmatter 与 schema 不符，报错会指出具体字段 |
| 图片 403 | COS 桶权限不是"公有读"（若已迁 COS） |
| 图片 404 | `public/images/` 路径或大小写不对 |
| 本地模式选目录报"not a repository root directory" | 选的目录里没有 `.git`；选项目根目录 |
| 本地模式按钮点不动 / 灰的 | 用的不是 Chromium 内核浏览器；Brave 需要开 `brave://flags/#file-system-access-api` |
| 登录页直接列出配置错误、登不进去 | 致命配置问题（如 `auth_methods: []` 空数组、字段定义非法）会拦在登录页；按提示改 `config.yml` 后刷新 |
| 控制台出现 "not defined in the Sveltia CMS configuration schema… It will be ignored" | 写了 schema 里没有的键（见 [6.9](#69-不要写的选项)），删掉即可 |
| Token 过期 | 回 GitHub 重新生成，登录页重贴一次 |

---

## 九、参考

- [Sveltia CMS 官方文档](https://sveltiacms.app/en/docs/intro)
- [Start Guide（安装与最小配置）](https://sveltiacms.app/en/docs/start)
- [GitHub Backend（PAT / OAuth）](https://sveltiacms.app/en/docs/backends/github)
- [Configuration Basics（配置基础）](https://sveltiacms.app/en/docs/config-basics)
- [Customization（logo / app_title 等）](https://sveltiacms.app/en/docs/customization)
- [Entry Collections（slug / 排序 / 筛选）](https://sveltiacms.app/en/docs/collections/entries)
- [Data Output（`output` 选项，空字段处理）](https://sveltiacms.app/en/docs/data-output)
- [Local Development Workflow（本地调试）](https://sveltiacms.app/en/docs/workflows/local)
- [Media Storage（含 S3 兼容媒体库）](https://sveltiacms.app/en/docs/media)
- [配置 JSON Schema（可直接用于 yaml 校验）](https://unpkg.com/@sveltia/cms/schema/sveltia-cms.json)
- [sveltia-cms-auth（自建 OAuth 中转）](https://github.com/sveltia/sveltia-cms-auth)
- [@sveltia/cms on npm（版本与 bundle 下载源）](https://www.npmjs.com/package/@sveltia/cms)
- [Release Notes](https://github.com/sveltia/sveltia-cms/releases)
