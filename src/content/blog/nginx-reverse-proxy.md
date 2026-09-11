---
title: "我的博客nginx反向代理配置全解析"
description: "部署博客时用到了这个技术想学习一下"
pubDate: "2026-03-21T23:12"
tags: ["学习笔记", "Nginx", "后端技术"]
---

>在博客部署的时候根据ai的指引，我使用了nginx来反向代理前端，但是还是对这个nginx和反向代理存在疑惑，所以今天这个博客是为了记录这次探究nginx的基础知识和反向代理的概念。

**Nginx**（读作 engine-x）是一款由 Igor Sysoev 开发的高性能 **Web 服务器**、**反向代理服务器**、**负载均衡器** 。
目前我先学习这三个主要功能。一个功能一个功能来细分着拆解
## 1.Web服务器
和使用的Apache差不多但是性能更好，甚至可以说是它的Promax版，同样可以处理静态文件比如(HTML,CSS,图片等)
## 2.反向代理和负载均衡
看到这里的时候我就想既然有反向代理，那肯定有正向代理，随后我又去查了查。
### 正向代理
正向代理好理解一些，就像我们国内不能直连Youtube网站，需要挂一个梯子(VPN)。具体一点的解释就是客户端将自己的请求率先发给代理服务器，通过代理服务器将请求转发给服务器。为了可以连上国外的网站，客户端需要使用一个可以连接外网的服务器作为代理，并且客户端能够连接上该代理服务器。
### 反向代理
这里我直接引用[一篇发在知乎上解释的原话](https://zhuanlan.zhihu.com/p/348513126)了反向代理与正向代理不同，正向代理是代理了客户端，而反向代理则是代理服务器端。在有多台服务器分布的情况下，为了能让客户端访问到的IP地址都为同一个网站，就需要使用反向代理。
为了更好理解，下面是我在CSDN里截的图
![](/images/nginx-reverse-proxy/ee61cfc09e46add5.png)
### 负载均衡
负载均衡（Load Balance）其意思就是分摊到多个操作单元上进行执行，例如Web服务器、FTP服务器、企业关键应用服务器和其它关键任务服务器等，从而共同完成工作任务。主要目的是为了解决高并发的问题。
以下再引用CSDN一位大佬的解释
Nginx给出来三种关于负载均衡的方式：
#### 轮询法（默认方法）：
每个请求按时间顺序逐一分配到不同的后端服务器，如果后端服务器down掉，能自动剔除。适合服务器配置相当，无状态且短平快的服务使用。也适用于图片服务器集群和纯静态页面服务器集群。
#### weight权重模式（加权轮询）：
指定轮询几率，weight和访问比率成正比，用于后端服务器性能不均的
情况。这种方式比较灵活，当后端服务器性能存在差异的时候，通过配置权重，可以让服务器的性能得到充分发挥，有效利用资源。weight和访问比率成正比，用于后端服务器性能不均的情况。权重越高，在被访问的概率越大
#### ip_hash：
上述方式存在一个问题就是说，在负载均衡系统中，假如用户在某台服务器上登录了，那么该用户第二次请求的时候，因为我们是负载均衡系统，每次请求都会重新定位到服务器集群中的某一个，那么已经登录某一个服务器的用户再重新定位到另一个服务器，其登录信息将会丢失，这样显然是不妥的。我们可以采用ip_hash指令解决这个问题，如果客户已经访问了某个服务器，当用户再次访问时，会将该请求通过哈希算法，自动定位到该服务器。每个请求按访问ip的hash结果分配，这样每个访客固定访问一个后端服务器，可以解决session的问题。
## 3.回顾一下我在博客项目使用的nginx 
服务器上的nginx并没有全局配置，仅仅对fartmonarch.xyz这个博客网站做了专门的配置，放在 /etc/nginx/sites-enabled/ 目录下的，通过 include 指令加载到/etc/nginx/nginx.conf。
下面是我博客的nginx配置(ai生成的也需要去理解一下)
```
# ------------------------
# 1️⃣ 禁止 IP 访问
# ------------------------
server {
    listen 80 default_server;
    server_name _;

    return 444;
}

# ------------------------
# 2️⃣ www → 主域名
# ------------------------
server {
    listen 80;
    server_name www.fartmonarch.xyz;

    return 301 https://fartmonarch.xyz$request_uri;
}

# ------------------------
# 3️⃣ HTTP → HTTPS（主域名）
# ------------------------
server {
    listen 80;
    server_name fartmonarch.xyz;

    return 301 https://fartmonarch.xyz$request_uri;
}

# ------------------------
# 4️⃣ HTTPS 主站
# ------------------------
server {
    listen 443 ssl;
    server_name fartmonarch.xyz;

    # ===== SSL（保留你原来的）=====
    ssl_certificate /etc/letsencrypt/live/fartmonarch.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fartmonarch.xyz/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ------------------------
    # gzip 压缩（性能优化）
    # ------------------------
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1k;
    gzip_comp_level 6;

    # ------------------------
    # 反向代理（你的Next项目）
    # ------------------------
    location / {
        proxy_pass http://localhost:3000;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;

        proxy_cache_bypass $http_upgrade;
    }
}

```
1️⃣ 禁止 IP 访问是为了防止别人用 IP 地址直接访问你的服务器，强制只能通过域名访问。
default_server：匹配所有未明确指定的请求，return 444 是 nginx 特有的状态码，表示直接关闭连接，不给任何响应。

2️⃣ www → 主域名 将带 www 的 HTTP 请求永久重定向到不带 www 的 HTTPS 主域名，统一规范 URL。这样URL就是https://fartmonarch.xyz

3️⃣ HTTP → HTTPS（主域名）nginx把所有 HTTP 流量强制升级为 HTTPS，保证安全

4️⃣ HTTPS 主站 
* SSL 部分：使用了 Let's Encrypt 的证书，实现了 HTTPS 加密，这是一家免费、开放、自动化的证书颁发机构。后续单独出一期来学习并且总结分享一下使用 Let’s Encrypt 免费申请泛域名 SSL 证书，并实现自动续期。

* gzip 压缩：对静态资源（CSS、JS、JSON 等）进行压缩，减少传输体积，提升加载速度。
以上两点我觉得可复用性特别高以后不管做什么网站都可以套来使用

* 反向代理核心：location / 将所有的请求转发到本地 3000 端口。

* 为什么需要反向代理？

Next.js 默认运行在 3000 端口，用户无法直接访问该端口，且没有 HTTPS 支持。nginx 作为前置服务器，处理了 HTTPS、压缩、安全头等，然后将请求交给 Node.js 应用，自己只负责“代理”和“分发”。
## 4.总结
我的博客构建中nginx主要起到以下几个作用
* Web服务器 运行着前端
* 反向代理：将客户端请求“反向”转发给后端的 Next.js 应用，客户端只知道 nginx 的地址，不知道内部服务。
* SSL 证书功能：统一管理证书和加密，让后端应用专注于业务逻辑
* 优化了一部分性能
