---
title: 跨域和跨站、Cookie传递和设置
description: 记录Nuxt全栈项目的处理跨站、跨域问题的笔记
pubDate: 2026-08-19
updatedDate: ''
categories:
  - 运维笔记
tags:
  - 计算机网络
---

> 例如一个url http://**api**.example.com/data 由协议(http)+主机名(子域名+主域名)+端口号

#### 学习文章链接

- [chenxinzhi](https://www.cnblogs.com/chenxinzhi/articles/18994422)
- [深入解析 httpbin.org：一个全能 HTTP 请求与响应测试服务-CSDN博客](https://blog.csdn.net/2501_93565959/article/details/159290456)
- [同源、跨域、同站、跨站、Cookie访问限制跨域、跨站讲解，在同源、跨域中同站/跨站中的Cookie访问限制以及对应的想 - 掘金](https://juejin.cn/post/7233698667848777787)
- [浏览器系列之 Cookie 和 SameSite 属性 · Issue #157 · mqyqingfeng/Blog](https://github.com/mqyqingfeng/Blog/issues/157)

### 跨域

即协议、主机名、端口号任意一项不一样都是跨域的。

### 跨站

主域名(注册域名)不一样才算跨站，只要主域名一样都不是跨站。

### 前言

之前遇到浏览器请求带不上Cookie的情况比较多，比如发送请求时，浏览器控制台会出现以下报错

```plain
Access to fetch at 'https://www.xxx.com/' from origin 'https://www.xxx.com' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.

```

以及前段时间遇到的跨域携带Cookie问题，还有开发时本地设置的host都或多或少和Cookie的访问限制扯上关系了，并且这里既有浏览器相关知识点又有服务器相关知识点，所以我想通过这篇笔记把全部情况都一次性梳理清楚。

### 限制Cookie的策略

#### 同源策略中的限制JS读取Cookie(document.cookie)

- 为了不让别的恶意网页通过JS脚本获取本地其他网站的登录态等Cookie，防XSS（跨站脚本）
- 规则为：一个网页只能通过`document.cookie`读取同源页面设置的Cookie。

#### 同源策略中的限制请JS读取跨域请求的响应体

- 为了限制恶意脚本读取跨域请求返回的数据包，偷看其他网站的数据
- 规则为：发送跨域请求时(这里可以携带Cookie)，服务器也会根据有Cookie给浏览器响应发回数据包，但是浏览器会阻止JS读取响应的数据包。

#### Cookie的Domain属性

- 这个是为了业务方便，撕开了同源策略的一点口子。比如大型网站通常有多个子域（如`www.example.com`和`api.example.com`），但它们是不同源的，共享不了登录态。
- 为了让子域共享，服务器发送Cookie时会设置`Domain=.example.com`；服务器会把自动携带Cookie的权限给`example.com`的所有子域。
- 如果`Set-Cookie`中没有包含Domain属性，浏览器默认设置为当前网页的主机名。

#### Cookie的Path属性

- 为了控制哪些路径可以接收此 Cookie，比如Set-cookie时设置了`Path=/`，这是最常用的全路径有效；设置`Path=/admin`，只有只有 /admin 及其子路径的请求才会携带。
- Path属性 仅用于性能优化（减少不必要传输），不提供安全隔离——同源页面即使路径不匹配，仍可通过 `document.cookie` 读取。

#### Cookie的SameSite属性

- 上面两种同源策略是为了不让恶意脚本读取数据或者去别处登录，限制了GET的请求，但是还是可以通过Cookie进行别的操作。比如恶意网站eavi.com向bank.com发送转账的请求并且携带了Cookie，虽然不会响应消息是否成功，但是可以执行这个操作。所以SameSite限制了Cookie在跨站请求中带出去。
- 服务器第一次给浏览器发Cookie的时候，会定义该Cookie后续能否在跨站请求中发送。这里再明确另一点我之前搞混了的，浏览器携带Cookie判断的依据是目标请求地址而不是请求发自哪个地址。
- SameSite的出现防止了CSRF攻击。
- SameSite的设置又有三个值
    - Strict：跨站点（cross‐site）的任何请求都不发送，只有顶级导航才会。
    - Lax（默认）：允许顶级导航的 GET 请求带 Cookie，但 AJAX／fetch／POST 等子资源请求不带。
    - None：放行所有请求（包括跨站点的 AJAX），但必须配合 Secure（HTTPS）才能生效。

***

### 绕过限制

_目前看来Cookie随着Web安全的发展时间线，每一个新特性的诞生，都是为了解决上一个时代留下的特定问题。但是同时也为实际开发带来了一些限制。比如同一家公司的不同项目，所处的主机名不一样或者说本地开发调试的是线上环境的后端接口，这些都会带来Cookie是否能跨域或者跨站携带的问题。_

#### 实际业务中为了实现内部安全的跨域跨站的需求

主要围绕三个地方的设置前端api请求的配置、后端CORS的配置、Set-cookie的配置

#### 同源请求

- a.com -> a.com
- Set-Cookie 无需设置额外设置保持默认(Lax/Strict)
- CORS无需设置额外属性
- 前端无需设置withCredentials（这里前端配置fetch、axios、jQuery.ajax不一样，以axios为例）

#### 跨域但同站携带Cookie

- a.site.com -> b.site.com
- Set-Cookie中设置SameSite为默认的Lax
- 前端需要设置withCredentials:true

#### 跨域且跨站携带Cookie

- a.com -> b.com
- Set-Cookie中设置SameSite为none，并且得设置**Secure**(浏览器绑定的行为)目的是为了使用https协议
- 后端的CORS需要设置Access-Control-Allow-Credentials: true和Access-Control-Allow-Origin: <具体域名>
- 前端需要设置withCredentials:true
- 但是浏览器中仍可能被拦截，因为它们出于隐私保护默认阻止第三方 Cookie，并且都在逐步限制，实际业务中使用自定义请求头携带Cookie(负责人官网项目的抠图接口)、服务端代理发送(前端先发同源服务器，再由服务器代转发到实际请求地址)、

#### 本地开发配的真实后端接口

首先本地本来就是和线上真实接口存在跨域且跨站的问题的，并且因为localhost是http协议，无法通过samesite=none;secure来进行跨站传cookie。所以一般有以下几种实现方法。

#### 方法一：直接配置 Dev Server HTTPS

1. 安装 mkcert（本地 CA 工具）
2. 安装本地 CA
3. 生成证书(这一步也需要修改 hosts 文件)
4. 根据项目启动证书

#### 方法二：使用反向代理获得统一的 HTTPS 访问

- 核心思想
    1. 使用Nginx / Caddy（反向代理）
    2. 前端和后端 API 在**同一个域名**下
    3. 反向代理负责将请求转发到正确的服务
    4. 浏览器看到的都是同源请求，没有跨域问题

#### 方法三：改本地的 Host 文件

1. 找到文件C:\Windows\System32\drivers\etc\hosts（Windows)；/etc/hosts（Linux/Mac)
2. 添加域名映射 比如 127.0.0.1 dev.wyins.net.cn

#### 建议方案一配合方案三一起使用
