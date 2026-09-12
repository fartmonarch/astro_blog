# COS 配置原理讲解

> 目的：讲清「为什么这么配」。看懂之后，换一个桶、换一家对象存储你也能自己推导出配置。
> 操作步骤版见 `docs/CMS直传COS配置与维护指南.md`。

---

## 一、先建立一个模型

CMS 上传一张图，本质上是：

> **浏览器拿你的密钥，按 AWS S3 协议，给 COS 发一个「签过名」的 HTTP 请求。**

所有配置项都在回答四个问题：

| 问题 | 对应配置 | 例子 |
|---|---|---|
| 发给谁 | `endpoint` + `bucket` + `region` | `https://<桶>.cos.ap-shanghai.myqcloud.com` |
| 我是谁 | `access_key_id`（配置里）+ SecretKey（浏览器里） | `AKID...` |
| 放在哪 | `prefix` | `img/` |
| 别人怎么看到 | `public_url` + 桶的读权限 | `https://img.fartmonarch.xyz` |

记住这张表，剩下的都是细节。

---

## 二、S3 是协议，COS 是它的实现

- AWS S3 是一套 HTTP 接口规范：`PUT` 上传、`GET` 列举、SigV4 签名。
- 腾讯云 COS 声明**兼容**这套接口，所以任何「支持 S3 的客户端」改一下地址就能连 COS。Sveltia 就是这样一个客户端。
- 但**兼容 ≠ 完全一样**。COS 有一处明确的差异，见下。

### 两种域名风格（最容易踩的坑）

同一个对象 `img/a.png`，两种写法：

| 风格 | URL | COS 接受吗 |
|---|---|---|
| 虚拟主机风格 virtual-hosted | `https://<桶>.cos.ap-shanghai.myqcloud.com/img/a.png` | ✅ 唯一被接受 |
| 路径风格 path-style | `https://cos.ap-shanghai.myqcloud.com/<桶>/img/a.png` | ❌ 报 `PathStyleDomainForbidden` |

实测到的原始报错（匿名请求也一样）：

```xml
<Error>
  <Code>PathStyleDomainForbidden</Code>
  <Message>The bucket you are attempting to access must be addressed using COS virtual-styled domain.</Message>
</Error>
```

AWS S3 两种都支持（很多老工具只会路径风格），所以 S3 客户端默认常常是路径风格，到了 COS 就撞墙。**这就是为什么 `endpoint` 必须填桶级域名**——Sveltia 拿到 endpoint 后会固定拼成 `${endpoint}/${key}`。

---

## 三、SigV4 签名：为什么 region 不能错、SecretKey 不能泄露

签名做的事：把「请求方法 + 路径 + 查询串 + 几个关键请求头（含 `Host`）+ 请求体哈希」串起来，用 **SecretKey** 当密钥做一轮 HMAC，得到 `Authorization: AWS4-HMAC-SHA256 ...`。COS 收到后用你的 SecretId 查出对应 SecretKey，重算一遍比对。

由此可以推导出所有「必须一致」的东西：

| 签名覆盖了什么 | 所以 |
|---|---|
| `Host`（域名） | `endpoint` 填错 → `SignatureDoesNotMatch` |
| 路径 | URL 拼接被改变（比如多插一段桶名）→ 签名对不上 |
| `region` 与 `service` | `region` 必须与桶地域一致，`service` 固定是 `s3` |
| 时间戳 | 本机时间偏差大 → 签名过期 |

**为什么配置里只有 SecretId，SecretKey 要手动输？**

- SecretId ≈ 用户名，公开无妨（官方也说放配置里是安全的）。
- SecretKey ≈ 密码，它本身就是签名用的密钥。而 `config.yml` 是**公开可访问**的（浏览器要能读它才能渲染后台，你直接打开 `/admin/config.yml` 也能看到），放进去等于把密码贴到网上。
- 所以 Sveltia 的设计是：SecretKey 由你在界面输一次，存在**你自己浏览器的 localStorage**，签名在浏览器本地完成。

---

## 四、CORS：为什么「配了自定义域名」也不能省

浏览器的铁律：**页面 A 的脚本不能随便读另一个域 B 的响应**，除非 B 明确允许（返回 `Access-Control-Allow-Origin`）。

| 动作 | 谁请求谁 | 需要 CORS？ |
|---|---|---|
| CMS 列目录 / 上传 | 页面 `www.fartmonarch.xyz` → COS API `<桶>.cos...myqcloud.com` | **必须** |
| 页面显示 `<img src="https://img.fartmonarch.xyz/...">` | 浏览器加载图片，`<img>` 不做跨域检查 | 不需要 |

而且这些 API 请求带了 `Authorization`、`x-amz-date`、`x-amz-acl` 这类自定义头，浏览器会先发一个 **OPTIONS 预检**问 COS「允许吗」。桶上没配跨域规则 → 预检失败 → 真正的请求根本发不出去（控制台报 `blocked by CORS policy`）。

结论两条：

1. **自定义域名只改变图片链接长什么样，不改变「API 主机 ≠ 页面主机」**，跨域规则照样要配。
2. **CORS 是浏览器行为，不是 COS 的权限。** 用 curl、SDK、服务端脚本调同一个 API 完全不需要 CORS。所以「命令行传得了、网页传不了」基本都是 CORS 问题。

---

## 五、读权限和写权限是两件事

| 动作 | 需要什么 |
|---|---|
| 上传（PUT） | 密钥有 PutObject 权限 |
| 列目录（GET） | 密钥有 ListBucket 权限 |
| 在浏览器/页面里直接看到图 | 对象**可匿名读** |

配置里那个「公有读私有写」改的是**桶级别的读权限**。这就是「上传成功但图片 403」的原因：**能写 ≠ 能读**。

顺带：CMS 上传时会固定带一个 `x-amz-acl: public-read` 头（给单个对象设公有读 ACL）。但桶级别没开公有读时，容易出现「新图能看、旧图不能看」这种混乱，直接把桶设成公有读最省心。

---

## 六、每个配置项从哪儿取

| 配置项 | 去哪儿拿 |
|---|---|
| `bucket` | COS 控制台 → 存储桶列表，桶名形如 `名字-APPID` |
| `region` | 同上，就是地域，如 `ap-shanghai` |
| `endpoint` | 自己拼：`https://<bucket>.cos.<region>.myqcloud.com`（别用路径风格那条） |
| `public_url` | 桶 → 域名与传输管理：COS 内置域名，或你绑的自定义域名 |
| `access_key_id` / SecretKey | 访问管理 → 访问密钥 → API 密钥管理（SecretKey 只在创建时显示一次） |
| CORS | 桶 → 安全管理 → 跨域访问 CORS 设置 |
| 读权限 | 桶 → 权限管理 → 存储桶访问权限 |

---

## 七、换一个新桶时，自己推导的固定流程

1. 建桶，记下**桶名**和**地域**
2. 拼 `endpoint`：`https://<桶名>.cos.<地域>.myqcloud.com`
3. 定 `prefix`（想放哪个「目录」，如 `img/`；留空就是根目录）
4. 定 `public_url`：先用 COS 内置域名跑通，之后想换自定义域名再换
5. 建密钥，复制 SecretId（填配置）和 SecretKey（立刻保存，只显示一次）
6. 配 CORS：Origin 填**你实际访问 CMS 的域名**（线上域名 + `http://localhost:4321`）
7. 桶权限改成**公有读私有写**
8. 按下一节的顺序验证

---

## 八、独立验证：由外到内三层，读错误码

**第 1 层：图片能匿名读吗？**（不看密钥）

```powershell
Invoke-WebRequest "https://img.fartmonarch.xyz/__missing__.png" -SkipHttpErrorCheck
```

- 404 `NoSuchKey` → 桶确实是公有读（只是这个键不存在）✅
- 403 `AccessDenied` → 桶还不是公有读 ❌

**第 2 层：域名风格对吗？**（还是不看密钥）

```powershell
Invoke-WebRequest "https://<桶>.cos.<地域>.myqcloud.com/__missing__.png" -SkipHttpErrorCheck
```

- 404 或 403 `AccessDenied` → 域名形态被接受 ✅
- `PathStyleDomainForbidden` → 你用了路径风格 ❌

**第 3 层：签名和权限对吗？**（在浏览器里看）

- 打开 `/admin/`，上传一次，DevTools → Network 找那条 `PUT`，看状态码和响应 XML
- 另一个好帮手：**访问管理 → API 密钥管理 → 更多访问记录**。它记录最近三个月最近 20 条调用，能区分「请求根本没到 COS（CORS/网络问题）」和「到了但被拒（权限/签名问题）」

### 错误码速查

| 错误码 | 含义 | 该查哪里 |
|---|---|---|
| `AccessDenied` | 匿名读没开，或密钥没权限 | 桶读权限 / 密钥权限 |
| `NoSuchKey` | 对象不存在（同时也说明桶可以匿名读） | 路径、文件名、`prefix` |
| `PathStyleDomainForbidden` | 用了路径风格域名 | `endpoint` 必须是桶级域名 |
| `SignatureDoesNotMatch` | 签名对不上 | SecretId/SecretKey、`region`、本机时间 |
| `NoSuchBucket` | 桶名写错 | `bucket`（别漏 APPID） |
| 浏览器 `blocked by CORS policy` | 预检被拒 | 桶的跨域规则、Origin 是否含当前域名 |

**读错误码是这项技能的核心**——COS 每次都会在 XML 里写清原因，比猜快得多。

---

## 九、几个「为什么这么设计」

- **SecretKey 只能看一次**：腾讯云自 2023-11-30 起关闭了查询功能，创建时必须保存；丢了只能新建一对（主账号最多 2 个）。
- **不建议用主账号密钥**：它的权限是整个账号的。收窄办法是子账号 + 只授这个桶的 ListBucket / PutObject / 对象 ACL。
- **上传同名文件是覆盖**：S3 的 `PUT` 语义就是「写到这个 key」，不存在则创建，存在则覆盖。所以文件名要能区分。
- **S3 里的「目录」是假的**：`img/` 只是对象 key 的前缀，不是真文件夹；`prefix` 就是这个前缀，列目录时用它过滤。
