# patch-sveltia-cos.ps1
#
# 作用：让 Sveltia CMS 的 aws_s3 媒体库能对接腾讯云 COS，从而在 CMS 里直接上传图片。
#
# 背景（两个问题都是 COS 与 Sveltia 的既有实现不兼容，非配置写错）：
#
#  1) SecretKey 长度：Sveltia 对媒体库面板里输入的 "Secret Access Key" 做长度校验，
#     aws_s3 的规则是 /^[A-Za-z0-9/+=]{40}$/（AWS 的 secret 正好 40 字符），
#     而腾讯云 COS 的 SecretKey 是 32 字符 → 被判 api_key_invalid，输入被清空。
#     补丁把 {40} 放宽成 {32,}。
#
#  2) 域名风格：设了 endpoint 后，Sveltia 强制拼成 path-style：${endpoint}/${bucket}/${key}，
#     但 COS 明确拒绝 path-style，返回：
#         <Code>PathStyleDomainForbidden</Code>
#         The bucket you are attempting to access must be addressed using COS virtual-styled domain.
#     所以要把列表和上传两处 URL 里的 bucket 段去掉，改用虚拟主机风格：
#         endpoint 填桶域名 https://<bucket>.cos.<region>.myqcloud.com
#         列表  ->  ${endpoint}?list-type=2&prefix=...
#         上传  ->  ${endpoint}/${key}
#
# 注意：第 2 条补丁改的是「endpoint 分支」的 URL 拼接，因此 endpoint 必须是**桶级域名**。
#       B2/R2/Spaces 等 provider 会把 endpoint 覆盖成区域级域名、依赖 path-style，
#       本项目只用 aws_s3 + COS 桶域名，所以是预期行为；将来若改用别的 provider 要留意。
#
# 用法：每次升级 public/admin/sveltia-cms.js 之后跑一次。幂等，可重复执行。
#   pwsh -File scripts/patch-sveltia-cos.ps1

[CmdletBinding()]
param(
  [string]$File = (Join-Path $PSScriptRoot '..\public\admin\sveltia-cms.js')
)

$ErrorActionPreference = 'Stop'

$bt = [char]96   # 反引号，避免在字符串里被 PowerShell 当转义符

$patches = @(
  @{
    Name = '放宽 aws_s3 的 SecretKey 长度校验（COS 32 / AWS 40 都放行）'
    From = '[A-Za-z0-9/+=]{40}'
    To   = '[A-Za-z0-9/+=]{32,}'
  },
  @{
    Name = '列表请求改虚拟主机风格（去掉 URL 里的 bucket 段）'
    From = $bt + '${a}/${r}?${t}' + $bt
    To   = $bt + '${a}?${t}' + $bt
  },
  @{
    Name = '上传请求改虚拟主机风格（去掉 URL 里的 bucket 段）'
    From = $bt + '${a}/${r}/${d}' + $bt
    To   = $bt + '${a}/${d}' + $bt
  }
)

if (-not (Test-Path -LiteralPath $File)) {
  Write-Error "找不到文件：$File"
  exit 1
}

$resolved = (Resolve-Path -LiteralPath $File).Path
$bytesBefore = (Get-Item -LiteralPath $resolved).Length
$content = [System.IO.File]::ReadAllText($resolved)
$original = $content

$applied = 0
$already = 0
$failed = @()

foreach ($p in $patches) {
  $fromCount = ([regex]::Matches($content, [regex]::Escape($p.From))).Count

  if ($fromCount -eq 0) {
    if (([regex]::Matches($content, [regex]::Escape($p.To))).Count -gt 0) {
      Write-Host ("[已是补丁版] {0}" -f $p.Name) -ForegroundColor DarkGray
      $already++
      continue
    }
    Write-Host ("[失败] {0} —— 找不到目标字面量，上游可能改过实现" -f $p.Name) -ForegroundColor Red
    $failed += $p.Name
    continue
  }

  if ($fromCount -ne 1) {
    Write-Host ("[失败] {0} —— 目标字面量出现 {1} 次（预期 1 次），为避免误改已跳过" -f $p.Name, $fromCount) -ForegroundColor Red
    $failed += $p.Name
    continue
  }

  $content = $content.Replace($p.From, $p.To)
  Write-Host ("[已打补丁] {0}" -f $p.Name) -ForegroundColor Green
  $applied++
}

if ($applied -gt 0) {
  [System.IO.File]::WriteAllText($resolved, $content, [System.Text.UTF8Encoding]::new($false))
}

$bytesAfter = (Get-Item -LiteralPath $resolved).Length

Write-Host ""
Write-Host ("文件：{0}" -f $resolved)
Write-Host ("结果：本次修改 {0} 项 / 已是补丁版 {1} 项 / 失败 {2} 项" -f $applied, $already, $failed.Count)
Write-Host ("字节数：{0} -> {1}" -f $bytesBefore, $bytesAfter)

if ($failed.Count -gt 0) {
  Write-Host ""
  Write-Host "有补丁没打上，请人工确认对应文件后再继续。" -ForegroundColor Red
  exit 1
}

exit 0
