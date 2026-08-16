# 图片资源上传 COS 操作指南

> 背景：博客当前有 16 张图片存放在仓库 `public/images/`（迁移自旧博客，正文以 `/images/<slug>/xxx.webp` 引用）。
> 目标：把图片上传到腾讯云 COS，正文改为 COS 外链，最终删除仓库内图片目录，让仓库保持轻量、图片走 COS 分发。
> PicGo + COS 的完整配置见《图床自动化方案.md》（方案 2/3），本文只讲"存量图片迁移"的步骤。

---

## 1. 现状盘点（已核实，2026-08）

| 目录 | 图片数 | 正文引用数 | 被引用的文件名 |
|---|---|---|---|
| ai-concepts | 3 | 2 | 1124ff4d0871491c.png、c667fb6e298313d6.png |
| dns-notes | 1 | 0 | （未引用） |
| incubator-camp | 10 | 6 | bd0874fd7b3973f4.webp、fc7d843d403790b8.webp、d75c52ef839d63f8.webp、64abe477068366e4.webp、7bfffb1d38a450d9.webp、cd993d8da44d5838.webp |
| jquery-notes | 1 | 0 | （未引用） |
| nginx-reverse-proxy | 1 | 1 | ee61cfc09e46add5.png |
| **合计** | **16** | **9** | |

**结论**：只需上传被引用的 **9 张**；其余 **7 张**（dns-notes 的 64bd846b29d88cda.webp、jquery-notes 的 5c3b8d9d6ac88037.png、ai-concepts 的 4ae3c50727a80d1f.webp、incubator-camp 的 54a47470e8b740b9.webp / 8c4c443e8878d919.webp / cf281125b8b82c19.webp / e5cdae27e22afce3.webp）是旧版封面或未使用图，**直接删除即可，不必上传**。

## 2. 前置条件

- [ ] 腾讯云 COS 已开通，Bucket：`fartmonarch-cos-1344165548`（区域 ap-shanghai）
- [ ] 自定义域名可用：`https://fartmonarch-cos-1344165548.cos.ap-shanghai.myqcloud.com/img/`
- [ ] PicGo 已按《图床自动化方案.md》配置好 COS（或可直接用 COS 控制台）

## 3. 步骤一：上传图片到 COS

**推荐：COS 控制台批量上传**（9 张一次搞定，比 PicGo 逐个快）：

1. 登录 [腾讯云 COS 控制台](https://console.cloud.tencent.com/cos) → 打开 `fartmonarch-cos-1344165548` → 进入 `img/` 目录
2. 建议按博客目录分子目录，与本地结构一致，便于日后管理：

```
img/
├── ai-concepts/
│   ├── 1124ff4d0871491c.png
│   └── c667fb6e298313d6.png
├── incubator-camp/
│   ├── bd0874fd7b3973f4.webp
│   └── ...（6 张）
└── nginx-reverse-proxy/
    └── ee61cfc09e46add5.png
```

3. **保留原文件名**（hash 命名，天然去重，且正文引用无需改文件名，只改前缀）
4. 上传后每个文件得到 URL：`https://fartmonarch-cos-1344165548.cos.ap-shanghai.myqcloud.com/img/<slug>/<文件名>`

> 备选：PicGo 桌面端 → 拖拽 9 张图 → 上传（会自动带 img/ 前缀，但 PicGo 默认扁平存储，不会自动分 slug 目录；若用 PicGo 则后续 URL 路径按实际上传位置为准）。

## 4. 步骤二：批量替换正文引用

把 9 处 `![](/images/<slug>/xxx)` 前缀替换为 COS URL。**先 dry-run 看结果，再执行**：

```powershell
# 在项目根目录运行
$COS_BASE = "https://fartmonarch-cos-1344165548.cos.ap-shanghai.myqcloud.com/img"

# —— Dry-run：只打印将要替换的行 ——
Get-ChildItem "src/content/blog" -Recurse -Filter *.md | ForEach-Object {
  $c = Get-Content $_.FullName -Raw -Encoding UTF8
  [regex]::Matches($c, '\]\(/images/[^)]+\)') | ForEach-Object {
    "$($_.Filename): $($_.Value)"
  }
}

# —— 执行：/images/<slug>/ -> <COS_BASE>/<slug>/ ——
Get-ChildItem "src/content/blog" -Recurse -Filter *.md | ForEach-Object {
  $path = $_.FullName
  $c = Get-Content $path -Raw -Encoding UTF8
  $repl = "]($COS_BASE/" + '$1/'
  $new = [regex]::Replace($c, '\]\(/images/([^/]+)/', $repl)
  if ($new -ne $c) {
    [System.IO.File]::WriteAllText($path, $new, [System.Text.UTF8Encoding]::new($false))
    Write-Host "已替换: $($_.Name)"
  }
}
```

替换后效果示例：
```
![](/images/incubator-camp/bd0874fd7b3973f4.webp)
→ ![](https://fartmonarch-cos-1344165548.cos.ap-shanghai.myqcloud.com/img/incubator-camp/bd0874fd7b3973f4.webp)
```

## 5. 步骤三：本地验证

1. 用浏览器逐个打开替换后的 COS URL，确认 9 张图都能访问（403/404 说明权限或路径不对——检查 COS 桶是否公有读、路径是否带 img/）
2. `npm run build` 确认构建通过
3. 本地 `npm run dev` 打开相关文章页，确认图片正常显示

## 6. 步骤四：清理仓库图片

线上验证通过后再删：

```powershell
# 删除 public/images 下 5 个目录（16 张图全部移除）
git rm -r public/images
```

> 注意：第 3 节说了 7 张未引用图不必上传 COS，直接随 public/images 一起删除即可。

## 7. 步骤五：提交部署

1. `git add -A` → commit（建议信息：`feat: 图片迁移至COS图床`）→ push
2. Vercel 自动构建部署
3. 线上抽查 `https://fartmonarch.xyz/blog/<slug>/` 各页面图片加载正常
4. 仓库体积下降约 2.4MB

## 8. 常见问题

| 问题 | 排查 |
|---|---|
| 图片 403 | COS 桶 ACL 不是"公有读私有写"，去控制台 → 权限管理 → 存储桶访问权限改成公有读 |
| 图片 404 | URL 路径与实际上传位置不一致（是否有 img/ 前缀、slug 目录名大小写） |
| PicGo 上传后文件名变了 | 在 PicGo 设置里关闭"时间戳重命名"，保证原文件名 |
| 替换后构建报错 | 检查是否误改了 frontmatter（替换脚本只匹配 `](/images/` 前缀，不会碰 frontmatter） |
| 想回滚 | `git revert` 对应提交即可，本地图片还在 git 历史里，随时能找回 |

## 9. 后续建议

- **新文章图片**：直接用 PicGo 粘贴即传 COS（见《图床自动化方案.md》方案 3），不需要再进仓库
- **COS 加速**：默认域名国内访问尚可；如果后续觉得慢，可以在 COS 控制台开启 CDN 加速域名（额外配置，非必须）
- **图片瘦身**：7 张未引用图删除后，仓库只保留代码，public/images 目录不再存在
