# 图片资源与博客编写 · COS 联动方案（计划）

> 状态：**计划阶段，未实施**。本文是后续落地的路线图与配置预案，暂不改动任何现有代码/配置。
> 关联文档：《图床自动化方案.md》（PicGo + COS 配置）、《图片上传COS操作指南.md》（存量 9 张图的一次性迁移）。

---

## 1. 目标与背景

### 1.1 现状

| 写作入口 | 图片处理方式 | 状态 |
|---|---|---|
| VSCode + PicGo | 粘贴即传 COS，自动出外链 | ✅ 已可用 |
| Sveltia CMS（/admin） | **无上传能力**，只能手贴 COS 链接 | ❌ 待实现 |
| GitHub.dev / 网页编辑 | 手动上传 COS 再贴链接 | ⚠️ 可用但不便 |
| 未来照片墙 | 需要统一的上传入口 | ❌ 未规划 |

### 1.2 目标

1. **CMS 编写时直传 COS**：编辑器内点按钮或拖拽图片 → 上传到 COS → 自动把外链插入 Markdown，全程不离开编辑页
2. **图片资源统一**：所有图片（博文、未来的照片墙/生活记录）统一存在 COS，仓库保持轻量
3. **安全**：COS 密钥不进入公开仓库

### 1.3 结论（已调研核实）

**Sveltia CMS 原生支持 S3 兼容存储直传，腾讯云 COS 可用**。要点：

- 浏览器直传（AWS SigV4 签名），**不需要后端代理**，符合 Vercel 无服务器约束
- 源码已确认支持 `endpoint` 选项（S3 兼容专用），可指向 COS 的 S3 端点
- **SecretId 可写入 config.yml（官方声明可公开）**；**SecretKey 首次使用媒体库时在 CMS 界面输入，存浏览器 localStorage，绝不写入仓库**

---

## 2. 技术方案：Sveltia CMS 直传 COS

### 2.1 原理

```
CMS 编辑器（上传按钮 / 拖拽）
        │  浏览器直传（SigV4 签名，无后端）
        ▼
腾讯云 COS（S3 兼容端点 cos.ap-shanghai.myqcloud.com）
        │
        ▼
自动生成外链插入 Markdown：![](https://fartmonarch-cos-1344165548.cos.ap-shanghai.myqcloud.com/img/xxx.webp)
        │
        ▼
保存文章 → commit push → Vercel 构建部署
```

### 2.2 配置预案（config.yml 追加，当前**不改**）

```yaml
media_libraries:
  tencent_cos:
    access_key_id: "<SecretId，AKID开头，待提供>"   # 可公开，官方文档确认
    bucket: fartmonarch-cos-1344165548
    region: ap-shanghai
    endpoint: https://cos.ap-shanghai.myqcloud.com   # COS 的 S3 兼容端点
    prefix: img/                                     # 上传路径前缀
    public_url: https://fartmonarch-cos-1344165548.cos.ap-shanghai.myqcloud.com
```

> SecretKey 不写在这里：CMS 首次使用媒体库时会弹出输入框，存浏览器 localStorage。

### 2.3 前置条件（需要用户操作，CORS 无法代码代办）

1. **COS 子账号密钥**：腾讯云 CAM 创建子账号，仅授予 COS `PutObject/GetObject/ListBucket` 权限；拿到 SecretId + SecretKey（SecretKey 只有创建时显示一次）
2. **COS CORS 配置**（没有它浏览器直传会被拦）：存储桶 → 权限管理 → 跨域访问 CORS 规则：

```json
[
  {
    "AllowedOrigins": ["https://fartmonarch.xyz", "http://localhost:4321"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

3. **桶公有读**：存储桶访问权限为"公有读私有写"（当前博文图片已是 COS 外链，大概率已满足，实施时确认）

### 2.4 待实测点（实施时验证）

| 疑点 | 说明 | 备选方案 |
|---|---|---|
| endpoint 模式下 COS 的 path-style 兼容性 | Sveltia 带 endpoint 时用 `cos.ap-shanghai.myqcloud.com/<bucket>/<key>` 路径风格请求，COS S3 网关理论上支持但需实测一次上传 | 若失败，尝试省略 endpoint 改用 `force_path_style` 组合，或联系 Sveltia 社区确认 COS 用法 |
| 编辑器上传 UI 形态 | Sveltia 的 markdown 工具栏图片按钮 + 拖拽的准确交互，实施时本地验证 | 官方文档：媒体库通过 File/Image 字段访问 |

---

## 3. 实施步骤（分阶段路线图）

### 阶段 0：准备（用户操作，约 10 分钟）
- [ ] 创建 COS 子账号密钥（SecretId + SecretKey，最小权限）
- [ ] COS 控制台配置 CORS（见 2.3）
- [ ] 确认桶为"公有读私有写"

### 阶段 1：CMS 直传 COS 落地（约 30 分钟）
- [ ] `config.yml` 追加 `media_libraries`（填入 SecretId）
- [ ] 本地 `astro dev` → 打开 `/admin/index.html` → 首次使用媒体库时输入 SecretKey
- [ ] 新建测试文章，上传 1 张图片，验证：①上传成功 ②外链自动插入 ③URL 格式正确 ④图片可访问
- [ ] 验证通过后 push，线上 `/admin/` 复测

### 阶段 2：存量图片迁移（约 30 分钟，按《图片上传COS操作指南.md》执行）
- [ ] 上传 9 张被引用图片到 COS `img/<slug>/`
- [ ] 跑替换脚本把正文 `/images/<slug>/` 改为 COS 外链
- [ ] 本地 build + 线上验证
- [ ] `git rm -r public/images` 清理（7 张未引用图随目录删除）

### 阶段 3：规范与收尾
- [ ] 约定图片目录规范（见第 4 节）
- [ ] 更新《图片上传COS操作指南.md》：主流程改为"CMS 直传"，原手动上传流程降级为备选

### 阶段 4（未来，可选）
- [ ] **照片墙**：基于 CMS 媒体库做生活照片上传，照片墙页面从 COS 读取展示
- [ ] Sveltia Asset Library：统一管理 COS 与仓库内媒体资源
- [ ] COS CDN 加速（若国内访问变慢再开）

---

## 4. 图片资源规范（建议约定）

| 项 | 建议 |
|---|---|
| 目录结构 | `img/<slug>/<文件名>`（博文配图按文章分目录）；照片墙预留 `img/life/` |
| 文件名 | 保留 PicGo 的 hash 命名（自动去重）或 `slug-描述.webp`；**禁止中文/空格** |
| 格式 | 照片用 `.webp`（体积小）；截图/矢量用 `.png`/`.svg` |
| 尺寸 | 博文插图建议宽度 ≤1600px，单张 ≤300KB |

---

## 5. 风险与回滚

| 风险 | 应对 |
|---|---|
| SecretKey 泄露 | SecretKey 只在浏览器 localStorage；疑似泄露 → 腾讯云 CAM 禁用重建。SecretId 在 config.yml 可公开，泄露无碍 |
| CORS 配错 | 上传报 CORS 错误 → 检查 AllowedOrigins 是否含当前域名、Methods 是否含 PUT |
| endpoint 兼容问题 | 见 2.4 备选方案；最坏情况退回"CMS 内部存储（Git 仓库）"方案，仅损失"仓库轻量"一项 |
| 存量迁移出错 | 图片在 git 历史可找回；替换脚本先 dry-run |

---

## 6. 待办与所需输入

- [ ] **COS 子账号 SecretId**（`AKID` 开头字符串；注意：`fartmonarch-cos-1344165548` 是桶名不是密钥）
- [ ] SecretKey：实施时由用户在 CMS 界面输入，无需提供给我
- [ ] 确认图片目录规范（第 4 节）是否按建议执行
- [ ] 确认实施时机（阶段 1-3 一次做完，还是分次）
