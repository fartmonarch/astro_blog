# CMS 直传 COS 配置与维护指南

> 目标：在 CMS（`/admin/`）里写文章时直接把图片传到腾讯云 COS，图片不进 Git 仓库。
> 状态：**2026-09-12 实测通过**。Sveltia CMS 0.210.3。
> 相关：`public/admin/config.yml`、`scripts/patch-sveltia-cos.ps1`。

---

## 一、现在的上传链路

```
CMS 编辑器  ──签名 PUT──►  https://fartmonarch-cos-1344165548.cos.ap-shanghai.myqcloud.com/img/x.png
正文里写入的链接  ──────►  https://img.fartmonarch.xyz/img/x.png
```

两个地址分工不同，别混：

| 配置项 | 用途 |
|---|---|
| `endpoint` = 桶级域名 | 列举文件、上传文件（浏览器直接请求它，所以要配 CORS） |
| `public_url` = 自定义域名 | 只决定写进正文的图片链接 |

上传后的文件路径 = `prefix` + 原文件名 = `img/x.png`。

---

## 二、改动清单（一共 4 处）

| 位置 | 做了什么 |
|---|---|
| `public/admin/config.yml` | 加 `media_libraries.aws_s3`，删掉 `media_folder` / `public_folder` |
| `scripts/patch-sveltia-cos.ps1` | 给 `public/admin/sveltia-cms.js` 打 3 处补丁 |
| COS 控制台 → 安全管理 → 跨域访问 CORS 设置 | 允许站点域名请求 COS |
| COS 控制台 → 权限管理 → 存储桶访问权限 | 改成「公有读私有写」 |

---

## 三、config.yml 配置原文

```yaml
media_libraries:
  aws_s3:
    access_key_id: <你的 SecretId>   # 36 字符，AKID 开头；官方说明放配置里是安全的
    bucket: fartmonarch-cos-1344165548
    region: ap-shanghai
    endpoint: https://fartmonarch-cos-1344165548.cos.ap-shanghai.myqcloud.com
    prefix: img/
    public_url: https://img.fartmonarch.xyz
```

四个要点：

1. **不写 `media_folder`**：省略它就是关闭「仓库内置媒体存储」，媒体选择器里只剩 COS 一个去处。存量正文里的 `/images/...` 引用不受影响。
2. **SecretKey 不写在这里**：第一次打开媒体库时弹框输入，只存在浏览器 localStorage。
3. **`endpoint` 必须是桶级域名**（`<桶名>.cos.<地域>.myqcloud.com`）。COS 禁止 path-style 域名，补丁已把拼接改成 `${endpoint}/${key}`。
4. **`region` 必须与桶所在地域一致**，否则 SigV4 签名不匹配。

---

## 四、为什么需要打补丁（3 处）

| 补丁 | 原因 |
|---|---|
| SecretKey 长度校验 `{40}` → `{32,}` | Sveltia 只认 40 字符的 AWS 密钥；腾讯云 SecretKey 是 **32 字符**，会被判 `api_key_invalid`，输入框存不住 |
| 列表请求 URL 去掉 bucket 段 | COS 拒绝 path-style，返回 `<Code>PathStyleDomainForbidden</Code>` |
| 上传请求 URL 去掉 bucket 段 | 同上 |

执行方式（改动的是我们自己托管的 `public/admin/sveltia-cms.js`）：

```powershell
pwsh -File scripts/patch-sveltia-cos.ps1
```

脚本特性：**幂等**（重复跑不会叠加）、找不到目标字面量时**报错退出**而不是乱改。

---

## 五、COS 控制台怎么配

### 跨域访问 CORS

路径：COS 控制台 → 存储桶列表 → `fartmonarch-cos-1344165548` → 左侧 **安全管理 → 跨域访问 CORS 设置 → 添加规则**

| 字段 | 填什么 |
|---|---|
| 来源 Origin | `https://www.fartmonarch.xyz` 一行、`http://localhost:4321` 一行（每行一个，带协议，末尾不带 `/`） |
| 操作 Methods | 勾 **GET、PUT、HEAD**（想为将来云资源删除/改名留余地再加 DELETE） |
| Allow-Headers | `*` |
| Expose-Headers | `ETag` |
| 超时 Max-Age | `600` |
| 返回 Vary: Origin | 建议开启 |

`Allow-Headers` 必须用 `*`：CMS 会发 `Authorization`、`x-amz-date`、`x-amz-content-sha256`、`x-amz-acl`、`Content-Type`，逐个列容易漏。

### 存储桶权限

路径：桶 → **权限管理 → 存储桶访问权限** → 改为 **公有读私有写**

不开这个，图能上传成功但页面上一律 403。

---

## 六、日常使用：插图那 4 个框怎么填

编辑器里插入图片后会弹出 4 个输入框：

| 框 | 填什么 | 生成的 Markdown |
|---|---|---|
| 图片 / 来源（地址） | 图片 URL（点上传、粘贴或拖入后自动填） | `![替代文本](地址)` |
| 替代文本 | 一句话描述图片；图片加载失败时显示，读屏软件会朗读，SEO 也算 | 填进 `![这里]` |
| 标题 | 鼠标悬停在图片上的小提示，可留空 | `![替代文本](地址 "标题")` |
| 链接 | 想让人点图片跳转就填（大图、相关文章都行）；留空则图片不可点 | `[![替代文本](地址 "标题")](链接)` |

对照例子：

```markdown
![](https://img.fartmonarch.xyz/img/a.png)                                   # 只填地址
![示意图](https://img.fartmonarch.xyz/img/a.png "悬停提示")                    # 加了替代文本 + 标题
[![示意图](https://img.fartmonarch.xyz/img/a.png "悬停提示")](https://x.com)   # 再加链接
```

建议：**替代文本尽量填**，标题和链接按需。

---

## 七、维护清单

1. **每次升级 `sveltia-cms.js` 后必须重跑补丁**，否则密钥被拒和 path-style 两个问题立刻回来：

   ```powershell
   pwsh -File scripts/patch-sveltia-cos.ps1
   ```

2. **换 SecretId**：只改 `config.yml` 里的 `access_key_id`。
3. **换 SecretKey**：在 CMS 界面里重新输入（它不在配置里）。
4. **换桶或换域名**：改 `bucket`、`region`、`endpoint`、`public_url` 四处。
5. **清了浏览器站点数据后**：第一次打开媒体库会重新要求输入 SecretKey。
6. **上线**：`npm run build` 通过 → 提交推送 → Vercel 重新部署后线上才生效。

---

## 八、已知限制

- 上传文件名 = `img/<原文件名>`，**同名会直接覆盖**，也不按文章分子目录。
- 媒体库只列 `prefix` 下的文件（当前是 `img/`）。
- SecretKey 存在浏览器里，换设备或换浏览器要重新输。
- 用主账号密钥时权限是全账号的；想收窄可换子账号，只给这个桶 ListBucket / PutObject / 对象 ACL 权限。

---

## 九、出问题按现象查

| 现象 | 原因 / 处理 |
|---|---|
| 输入 SecretKey 后提示无效、框里存不住 | 补丁没打 → 跑补丁脚本；或填的是 SecretKey 而 `access_key_id` 填成了别的 |
| 提示「搜索资源出错」 | 打开 DevTools → Network，看那条请求的 URL 和状态码，对照下面几行 |
| 请求 URL 里出现 `/桶名/` 两段 | 补丁没打（还是 path-style）→ 跑补丁脚本 |
| 403 `SignatureDoesNotMatch` | SecretId / SecretKey 抄错、`region` 不是 `ap-shanghai`、本机时间偏差大 |
| 403 且 XML 是 `PathStyleDomainForbidden` | 补丁没打，或 `endpoint` 填的不是桶级域名 |
| `blocked by CORS policy` | CORS 没配，或 Origin 里没有当前访问的域名 |
| 上传成功但页面图片 403 | 桶不是公有读 |
| 404 `NoSuchKey` | 路径或文件名不对（注意要有 `img/` 前缀）。顺带说明：能返回 404 说明桶已是公有读 |
| 图片地址是 `...myqcloud.com/...` 而不是自己的域名 | `public_url` 没配或写错 |
