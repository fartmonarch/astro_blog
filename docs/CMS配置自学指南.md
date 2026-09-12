# Sveltia CMS 配置自学指南

> 目的：不再问别人，自己找到「这个 CMS 能配什么、怎么配、改了会怎样」。
> 内容与版本无关，换任何版本都适用；文中的例子都是本项目实际用过的。

---

## 一、权威顺序（先记住这个）

遇到「能不能配 X」的问题，按这个顺序找，越靠前越可靠：

| 顺序 | 来源 | 特点 |
|---|---|---|
| 1 | **官方 JSON Schema** | 机器可校验，含类型、默认值、说明，还能自动补全 |
| 2 | 官方文档 | 有人话解释和示例，但可能滞后或不完整 |
| 3 | 源码 | 唯一真相。文档没写的它也有，也能证明「文档写了但你这版没有」 |
| 4 | 博客 / 第三方教程 | 只做参考，版本经常对不上 |

一句话：**文档告诉你「怎么用」，schema 告诉你「能不能用」，源码告诉你「到底是怎么实现的」。**

---

## 二、Schema：把「能配什么」变成可查的清单

Schema 就是一个 JSON 文件，地址固定（可换版本号）：

```
https://unpkg.com/@sveltia/cms/schema/sveltia-cms.json           # 跟随最新
https://unpkg.com/@sveltia/cms@0.210.3/schema/sveltia-cms.json   # 锁定版本
```

### 用法 1：写配置时自动补全 + 当场报错（性价比最高）

1. VS Code 装扩展 **YAML**（`redhat.vscode-yaml`）
2. 在 `public/admin/config.yml` 第一行加：

   ```yaml
   # yaml-language-server: $schema=https://unpkg.com/@sveltia/cms/schema/sveltia-cms.json
   ```

3. 之后敲键名有补全，鼠标悬停能看到官方说明和默认值，写错类型或键名当场标红。

### 用法 2：改完配置，命令行整体校验一遍

```powershell
# 1. 先把 schema 存到本地（只需一次，或想换版本时重下）
Invoke-WebRequest "https://unpkg.com/@sveltia/cms/schema/sveltia-cms.json" -OutFile "$env:TEMP\sveltia-schema.json"

# 2. 校验当前配置
node -e "const fs=require('fs'),yaml=require('js-yaml'),Ajv=require('ajv');const s=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));const c=yaml.load(fs.readFileSync('public/admin/config.yml','utf8'));const a=new Ajv({allErrors:true,strict:false});console.log(a.validate(s,c)?'PASS':'FAIL');if(a.errors)for(const e of a.errors)console.log(' -',e.instancePath||'/',e.message)" "$env:TEMP\sveltia-schema.json"
```

输出 `PASS` 就是合法配置；`FAIL` 会逐条列出哪个字段哪条规则不满足。

（`js-yaml`、`ajv` 目前是 Astro 的传递依赖，可直接用；哪天报找不到就 `npm i -D ajv js-yaml`。）

### 用法 3：当「能力清单」翻

| 我想知道 | 在 schema 里搜 |
|---|---|
| 根级能配哪些东西 | `CmsConfig` 的 `properties` 键列表 |
| 集合能配什么 | `EntryCollection` |
| 字段有哪些类型 | `VisibleField` 的 `anyOf` 列表，或各 `*Field` 定义 |
| 某个 widget 支持哪些参数 | 搜 widget 名，如 `DateTimeField`、`SelectField` |
| 默认值是什么 | 每个选项的 `description` 里一般直接写了 `Default: ...` |

**为什么不能靠猜键名**：schema 里大量节点写了 `additionalProperties: false`，意思是「这个对象只认列出来的键」。你猜一个不存在的键写进去，CMS 会告警并忽略它（见第六节），等于白写。

---

## 三、官方文档怎么读

地址：`https://sveltiacms.app/en/docs/`

| 我想改… | 看哪一页 |
|---|---|
| 加字段 / 换字段类型 | `fields/*`（每个 widget 一页） |
| 集合行为：排序、筛选、摘要、slug | `collections/entries` |
| 界面标题、logo、语言、退出跳转 | `customization` |
| 接图床 / 外部存储 | `media` 加 `media/*`（S3、R2、Cloudinary…） |
| 写作流程：草稿、评审、预览 | `workflows/*` |
| 输出格式：引号、空字段、换行 | `data-output` |
| 登录认证 | `backends/*` |
| 配置从哪加载、有哪些根级选项 | `config-basics` |

### 一个省事技巧

文档站是 VitePress，**在页面 URL 后面加 `.md`** 就能拿到无导航的纯 markdown，方便全文搜索和复制：

```
https://sveltiacms.app/en/docs/media.md
```

### 注意文档的版本口径

官网描述的是**最新版**行为。如果你手上的不是最新版，有些细节不适用。例：资源库里的「外部位置」浏览/改名/删除是 **0.211.0** 才有的，0.210.3 上不存在。所以：**文档 + 你的版本号一起看**。

---

## 四、源码怎么查：文档没写但确实支持的，都在这儿

### 方式 1：搜我们自己托管的 bundle（最快，离线可用）

`public/admin/sveltia-cms.js` 是压缩过的，**但字符串、i18n key、错误信息、正则不会变**，所以按这些搜就够：

```powershell
$c = Get-Content public\admin\sveltia-cms.js -Raw

# 1. 查某个配置项的真实实现（例：密钥长度校验）
[regex]::Matches($c, 'apiKeyPattern:[^,}]{0,40}') | ForEach-Object { $_.Value }

# 2. 查某个键到底有没有被读取（例：空字段省略）
[regex]::Matches($c, 'omit_empty_optional_fields') | ForEach-Object { $_.Index }

# 3. 查 URL 是怎么拼的（例：为什么多插了一段桶名）
[regex]::Matches($c, 'url:a\?(`[^`]+`)') | ForEach-Object { $_.Groups[1].Value }

# 4. 查哪些选项会被官方忽略
[regex]::Matches($c, 'unsupported_ignored_option') | ForEach-Object { $_.Index }

# 5. 查某个报错的来源
$c.IndexOf('S3 secret access key is required')
```

**核心心法**：**不要搜变量名**（压缩后会变成 `a`、`t`、`e`），**要搜字符串、i18n key、错误码、正则片段**。

判断「某个选项是真被用了，还是只在 schema 里挂着」的方法：看它出现的位置。只在 `type:` / `Description` 附近出现 = 仅 schema 声明；出现在 `{xxx=默认值}=...` 这种解构赋值里 = 真的被读取。

### 方式 2：拿 npm 包里的完整资料

```powershell
npm pack @sveltia/cms@0.210.3 --pack-destination $env:TEMP
tar -xzf $env:TEMP\sveltia-cms-0.210.3.tgz -C $env:TEMP
```

解开后值得看的：

| 路径 | 用途 |
|---|---|
| `package/schema/sveltia-cms.json` | 配置全量说明（就是第二节那个 schema） |
| `package/types/public.d.ts` | TypeScript 类型声明，查「JS API 能干什么」最准 |
| `package/locales/zh-CN.json` | 界面中文文案，可反推某个按钮/字段的语义 |
| `package/dist/sveltia-cms.js` | 压缩后的实现本体 |

**一个很实用的反查技巧**：界面上看到不认识的词 → 去 `locales/zh-CN.json` 搜中文拿到 key → 再拿 key 去 `dist` 里搜实现。

例：界面上的「**别名**」对应 key `slug`（英文原文是 `Slug`）；「**集合**」对应 `collections`；「**内容**」对应 `contents`。

### 方式 3：上游仓库

`github.com/sveltia/sveltia-cms`，可以按 tag 切到你用的版本读未压缩源码，比读压缩包舒服。

---

## 五、怎么跟版本和破坏性变更

```powershell
npm view @sveltia/cms version     # 当前最新版
npm view @sveltia/cms versions    # 所有版本
```

变更看 GitHub 的 **Releases**。重点扫三类字眼：

1. `POTENTIAL BREAKING CHANGE`
2. 配置项的**新增 / 改名**
3. **默认值变化**

### 升级的稳妥流程（本项目踩过坑，照这个来）

1. 确认 `public/admin/sveltia-cms.js` 在 git 里是干净的 → 它就是你的一键回滚点
2. 下载新版覆盖
3. `node --check public\admin\sveltia-cms.js`（语法自检）
4. **重跑本地补丁脚本**：`pwsh -File scripts/patch-sveltia-cos.ps1`（本项目改过 3 处，升级会覆盖掉）
5. 本地打开 `/admin/`（**强刷**），**开着 DevTools 看控制台**
6. `npm run build`
7. 没问题再提交

回滚：`git checkout -- public/admin/sveltia-cms.js`

---

## 六、改配置的标准动作

1. **先在本地试**，不动线上仓库：

   ```
   astro dev --background
   http://localhost:4321/admin/index.html  →  Work with Local Repository
   ```

2. **看浏览器控制台**，两类告警含义完全不同：

   | 告警 | 含义 |
   |---|---|
   | `schema_unknown_option` | 你写了 schema 里没有的键 → 会被忽略，等于没写 |
   | `unsupported_ignored_option` | 官方明确不支持该选项（如 `local_backend`、`locale`、`search`） |
   | 登录页直接列红字 | 致命配置错误，CMS 加载不了，必须改 |

3. **`npm run build`**：字段和内容 schema 不一致这类问题会在这一步炸出来
4. 都通过再提交推送

---

## 七、几条判断准则（省时间）

| 你看到的情况 | 结论 |
|---|---|
| schema 里**没有**这个键 | 写了会被忽略并告警，等于不存在 |
| schema 里**有**、文档里**没写** | 能生效但没官方背书（本项目的 `media_libraries.aws_s3.endpoint` 就是）。当「未文档化功能」对待，必须自己实测 |
| 文档写了、你的版本里**搜不到** | 那是新版本才有的功能。先用 `npm view` 确认版本，再决定升不升 |
| 界面文案很奇怪 / 看不懂 | 那是语言包翻译问题。去 `locales/zh-CN.json` 找 key，再看英文包，通常更清楚 |
| 改了没反应 | 先看控制台有没有 unknown option 告警；再看是不是需要刷新页面（`config.yml` 改完要重新加载） |

---

## 八、本项目现有资料索引

| 文件 | 内容 |
|---|---|
| `docs/Sveltia CMS 配置与使用指南.md` | 全量配置与使用（含本地调试、升级、排错） |
| `docs/CMS直传COS配置与维护指南.md` | CMS 直传 COS 的操作步骤与维护清单 |
| `docs/COS配置原理讲解.md` | COS/S3 的原理（讲解版） |
| `scripts/patch-sveltia-cos.ps1` | 本地补丁，**每次升级 CMS 后必须重跑** |
| `public/admin/config.yml` | CMS 配置本体，第一行可加 schema 注释开启自动补全 |

### 三句话总结这套方法

1. **想知道能不能配** → 搜 schema。
2. **想知道怎么配** → 读文档（URL 加 `.md`）。
3. **想知道到底怎么实现的 / 文档没写的** → 搜 bundle 里的字符串，或翻 npm 包里的 `schema`、`types`、`locales`。
