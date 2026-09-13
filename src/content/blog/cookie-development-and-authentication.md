---
title: cookie、session、token 发展史与请求响应鉴权
description: 在接手Nuxt全栈项目的时候，我一直对使用调用dubbo2登录接口的登录态、编辑中图片上传和自动扣背景图的cookie和认证问题有些许疑问，在两次下班后向涛哥请教后，记录了这次学习过程
pubDate: 2026-08-17
updatedDate: ''
categories:
  - 运维笔记
tags:
  - 计算机网络
---

### 基于学习该视频个人总结

参考视频：[【全栈】cookie、session、token 发展史与请求响应鉴权](https://www.bilibili.com/video/BV1b14y1J7Yv)

#### Cookie

HTTP 是一个无状态协议，每一次请求在协议层面都是相互独立的，服务器默认不会因为你上一次访问过某个页面，就自动知道你是谁。
为了让客户端能够保存一些状态，并在后续请求中再次携带这些状态，**Cookie** 应运而生。
举个例子就是，一个网站拥有三个页面 `/home`、`/user`、`/welcome`，welcome 页设计初衷就是为了第一次访问该网站的用户查看的（不管第一次访问的是哪个页面都跳转过来），后续已经访问过的用户，不管是访问 home 页还是 user 页，都不会来到这个页面。
第一次访问的时候，服务器可以通过响应头告诉浏览器保存一个 Cookie：

```plain
Set-Cookie: visited=true

```

浏览器保存之后，下一次访问这个网站的时候，就会自动在请求头中带上这个 Cookie：

```plain
Cookie: visited=true

```

服务器看到这个 Cookie，就可以知道这个浏览器之前访问过，从而决定是否需要跳转到 welcome 页面。
当然，Cookie 能做的事情不只有记录“是否访问过”，比如记录用户的一些偏好、语言设置、购物车信息以及登录状态等。

***

#### Session

Cookie 是方便了，但是如果我们把一些比较重要的用户信息全部直接放在 Cookie 里面，又会出现一些问题。
比如用户第一次向 `/api/login` 请求登录，服务器认证成功之后，可以返回一个 Cookie：

```plain
Set-Cookie: username=zhangsan

```

之后浏览器访问网站的时候，就会自动带上这个 Cookie。但是这里有一个问题：**Cookie 是保存在浏览器客户端的，而且 Cookie 本身并不是一种加密机制。** 用户可以通过浏览器开发者工具看到 Cookie 的内容，某些情况下还可以修改 Cookie。所以，如果我们把比较重要的信息甚至敏感信息直接存放在 Cookie 里面，就会存在一定的安全风险。
这时候就出现了 **Session**。Session 的核心思路其实也比较简单：重要的用户状态放在服务器，浏览器只保存一个用于标识这次会话的 Session ID。
比如用户第一次请求：

```plain
POST /api/login

```

服务器验证用户名和密码成功之后，在服务器创建一个 Session：

```plain
Session ID：abc123
用户 ID：10001
用户名：张三
登录状态：已登录

```

然后服务器只需要把这个 Session ID 返回给浏览器：

```plain
Set-Cookie: session_id=abc123

```

之后浏览器再次访问：

```plain
GET /user
Cookie: session_id=abc123

```

服务器拿到 `session_id=abc123` 后，再去自己的 Session 存储中查找：

```plain
abc123
  ↓
用户 ID：10001
用户名：张三
登录状态：已登录

```

这样服务器就知道当前请求对应的是哪个用户。所以可以简单理解为：

```plain
Cookie
负责：把 Session ID 保存到浏览器，并在后续请求中带给服务器
Session
负责：把真正的用户会话状态保存到服务器

```

所以 **Session 一般会和 Cookie 配合使用**。当然，Session 也不是说用了之后就绝对安全了。如果攻击者能够获取到用户的 `session_id`，同样有可能冒充这个用户，这种情况叫做**会话劫持（Session Hijacking）**。所以实际开发中还会结合 HTTPS、`HttpOnly`、`Secure`、`SameSite` 等机制来提高安全性。

***

#### Token

看到这里，`Cookie + Session` 看起来已经可以很好地解决登录状态的问题了。但是随着前后端分离、移动端(app无浏览器意味着无法存cookie)、微服务以及分布式系统的发展，我们又遇到了另外一个问题：
**用户的登录状态如果全部保存在服务器，那么服务器就需要维护这些 Session。**
假设现在有很多台服务器：如果用户第一次登录的时候请求到了 Server A，那么 Session 可能保存在 Server A 上。但是下一次请求如果被负载均衡分配到了 Server B。这就产生了**分布式环境下的 Session 共享问题**。
当然，这个问题并不是没有办法解决。例如可以使用 Redis 统一保存 Session，这样所有服务器都可以去 Redis 中查询 Session。这是其中一种中心化的思路，另外一种思路就是**token**。
Token让客户端自己携带一个身份凭证，服务器通过验证这个凭证来确认用户身份，而不一定需要在服务器保存对应的 Session 状态。
比如用户登录成功之后，服务器返回：

```plain
token = abc123xyz

```

之后客户端请求其他接口的时候在请求头中的Authorization主动携带 Token：

```plain
GET /user
Authorization: Bearer abc123xyz

```

服务器拿到 Token 后进行验证，如果验证通过，就可以知道这个请求对应的是哪个用户。
和 Session 最大的区别，可以简单理解成：

```plain
Session：

客户端
  ↓
Session ID
  ↓
服务器
  ↓
查询 Session
  ↓
得到用户信息

Token：

客户端
  ↓
携带 Token
  ↓
服务器
  ↓
验证 Token
  ↓
得到用户身份

```

Session+cookie比Token多了一般去查询。所以 Token 的一个重要特点就是可以实现无状态认证。Session 认证依赖服务器保存的会话状态，而无状态 Token 认证主要依赖客户端携带的、服务器可以独立验证的凭证。

***

#### JWT

讲到 Token，这里还容易产生一个误区：Token 和 JWT 不是一个东西。Token 更像是一种概念：我给客户端一个身份凭证，你以后拿着这个凭证来证明你是谁。至于这个凭证具体长什么样，可以有很多种方式。比如：abc123xyz，也可以是任意的字符。而 **JWT（JSON Web Token）** 是一种具体的 Token 格式。一个 JWT 通常长这样：

```plain
xxxxx.yyyyy.zzzzz

```

由三部分组成：

```plain
Header.Payload.Signature

```

其中Header：记录 Token 的类型以及签名算法等信息。Payload：存放一些需要传递的数据，例如用户 ID、过期时间等。Signature：用于验证前面的内容有没有被修改。
有一个重要的点JWT 的 Payload 默认不是加密的。它只是经过 Base64URL 编码，所以拿到 JWT 的人通常可以直接解析 Payload。因此Base64 ≠ 加密，签名 ≠ 加密。JWT 的签名主要解决的是**防篡改和完整性验证**问题，而不是让 Payload 变得不可读取。

***

#### Access Token 和 Refresh Token

实际开发中，我们还经常会看到两个 Token：

```plain
Access Token
Refresh Token

```

为什么要搞两个 Token？因为如果 Access Token 永不过期，那么一旦泄露，攻击者可能长期使用这个 Token。所以一般会让 Access Token 的有效时间比较短，比较多的是15分钟。而 Refresh Token 的有效时间更长，一般有效期：7 天 / 30 天
当 Access Token 过期之后，客户端可以拿 Refresh Token 去请求服务器：

```plain
Access Token 过期
        ↓
携带 Refresh Token
        ↓
服务器验证
        ↓
重新返回新的 Access Token

```

这样既可以让 Access Token 的生命周期比较短，又不需要让用户频繁重新输入账号密码登录。

***

### Cookie、Session、Token、JWT 到底是什么关系？

```plain
Cookie
→ 浏览器保存和携带数据的一种机制

Session
→ 服务器保存用户会话状态的一种机制

Token
→ 客户端携带的身份凭证

JWT
→ Token 的一种具体数据格式

```

所以它们并不是简单的前一种技术被后一种技术淘汰的关系。

```plain
Cookie → Session → Token → JWT

```

实际项目中也完全可以Cookie + Session，也可以Cookie + JWT，或者Authorization Header + JWT。具体使用哪一种，要看项目的架构、客户端类型以及安全需求。

***

### 总结

从最开始的 HTTP 无状态，到后面的 Cookie、Session，再到 Token 和 JWT，其实解决的都是同一个大问题：**服务器到底怎么知道“你是谁”？**
只是随着应用场景越来越复杂，解决这个问题的方式也越来越多。最开始可以让浏览器帮我们记住一些东西，然后把真正的用户状态放到服务器，再后来，也可以让客户端自己携带身份凭证。
后面还会涉及 OAuth 2.0、SSO、第三方登录，以及 XSS、CSRF、Token 泄露等一系列问题。这些内容其实都可以继续从“**服务器到底怎么确认你是谁**”这个问题往下展开。
