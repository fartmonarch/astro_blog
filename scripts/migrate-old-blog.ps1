# migrate-old-blog.ps1
# 一次性迁移脚本：把旧博客 (blog-public) 的文章迁移到当前 Astro 项目。
# 用法: pwsh scripts/migrate-old-blog.ps1
#
# 转换规则：
#   旧格式 public/blogs/<目录>/index.md + config.json + 本地图片
#   新格式 src/content/blog/zh/<slug>.md（YAML frontmatter）+ public/images/<slug>/ 图片
#   - category 并入 tags
#   - 去掉正文开头的 H1（布局已渲染 frontmatter 的 title）
#   - 图片路径 /blogs/<旧slug>/ -> /images/<新slug>/

$ErrorActionPreference = 'Stop'

$src    = 'D:\Code\blog-public\public\blogs'
$dstDir = 'D:\Code\astro_blog\src\content\blog\zh'
$imgDir = 'D:\Code\astro_blog\public\images'

if (-not (Test-Path $src)) { throw "旧博客目录不存在: $src" }

# 旧目录名 -> 新 ASCII slug 映射表
$map = [ordered]@{
  'Ai概念大串联'   = 'ai-concepts'
  'DNS_1'          = 'dns-notes'
  'ES6语法糖'      = 'es6-syntax'
  'jQuery学习笔记' = 'jquery-notes'
  'my_first_blog'  = 'my-first-blog'
  'Nginx1'         = 'nginx-reverse-proxy'
  'VScode快捷键'   = 'vscode-shortcuts'
  'Vue3指令'       = 'vue3-directives'
  '孵化营'         = 'incubator-camp'
}

function Esc([string]$s) { return $s.Replace('\', '\\').Replace('"', '\"') }

$summary = @()

foreach ($entry in $map.GetEnumerator()) {
  $oldSlug = $entry.Key
  $newSlug = $entry.Value
  $postDir = Join-Path $src $oldSlug

  if (-not (Test-Path $postDir)) { Write-Warning "跳过（目录不存在）: $oldSlug"; continue }

  $configPath = Join-Path $postDir 'config.json'
  $mdPath     = Join-Path $postDir 'index.md'
  if (-not (Test-Path $configPath) -or -not (Test-Path $mdPath)) {
    Write-Warning "跳过（缺少 config.json 或 index.md）: $oldSlug"
    continue
  }

  $config = Get-Content $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
  $body   = Get-Content $mdPath -Raw -Encoding UTF8

  # 1) 去掉正文开头的 H1（若文件以 # 开头）
  $body = $body -replace '^\s*#\s+[^\r\n]*\r?\n', ''

  # 2) 图片路径重写: /blogs/<旧slug>/ -> /images/<新slug>/
  $body = $body -replace [regex]::Escape("/blogs/$oldSlug/"), "/images/$newSlug/"

  # 3) 修复紧贴的两个图片标记 ![](...)![](...) -> ![](...) ![](...)
  $body = $body -replace '\)(?=!\[)', ') '

  # 4) 构造 frontmatter
  $title = Esc ([string]$config.title)
  $desc  = Esc ([string]$config.summary)
  $date  = [string]$config.date
  $tags  = @()
  if ($config.category) { $tags += [string]$config.category }
  if ($config.tags)     { $tags += @($config.tags) }
  $tags = @($tags | Select-Object -Unique)
  if ($tags.Count -gt 0) {
    $tagsStr = '[' + (($tags | ForEach-Object { '"' + (Esc $_) + '"' }) -join ', ') + ']'
  } else {
    $tagsStr = '[]'
  }

  $fm = "---`ntitle: `"$title`"`ndescription: `"$desc`"`npubDate: `"$date`"`ntags: $tagsStr`n---"

  # 5) 写入文章
  New-Item -ItemType Directory -Force -Path $dstDir | Out-Null
  $outPath  = Join-Path $dstDir "$newSlug.md"
  $content  = $fm + "`n`n" + $body.TrimStart("`r", "`n")
  if (-not $content.EndsWith("`n")) { $content += "`n" }
  [System.IO.File]::WriteAllText($outPath, $content, [System.Text.UTF8Encoding]::new($false))

  # 6) 复制图片
  $imgs   = Get-ChildItem $postDir -File | Where-Object { $_.Extension -in '.png', '.webp', '.jpg', '.jpeg', '.gif' }
  $copied = 0
  if ($imgs.Count -gt 0) {
    $outImgDir = Join-Path $imgDir $newSlug
    New-Item -ItemType Directory -Force -Path $outImgDir | Out-Null
    foreach ($img in $imgs) { Copy-Item $img.FullName $outImgDir -Force; $copied++ }
  }

  $summary += [pscustomobject]@{
    旧目录 = $oldSlug
    新文件 = "src/content/blog/zh/$newSlug.md"
    标题   = $config.title
    日期   = $date
    标签   = ($tags -join ', ')
    图片数 = $copied
  }
}

$summary | Format-Table -AutoSize
"`n共迁移 $($summary.Count) 篇文章"
