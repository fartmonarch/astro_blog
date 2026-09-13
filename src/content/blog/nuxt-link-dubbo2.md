---
title: Nuxt调用Dubbo2
description: Nuxt项目中学习到的调用Dubbo2服务，这个不比Dubbo3,要配置的东西比较多
pubDate: 2026-08-15
updatedDate: ''
categories:
  - 前端笔记
  - 服务端笔记
tags: []
---

## 整体架构

Nuxt 的 server 端（Nitro）作为 **Dubbo consumer**，通过 `dubbo2.js` 库直接与 Java provider 进行 RPC 通信，省去了传统 BFF 层。

## 联通三要素

### 1. 服务发现 — ZooKeeper

- 启动时连接 ZooKeeper 注册中心
- ZK 维护着所有 provider 的地址列表（IP:Port）
- dubbo2.js 每次调用时从 ZK 拿到的列表中选一个 provider 发起 TCP 连接

### 2. 协议通信 — Hessian 序列化 + Dubbo 协议

- JS 值必须包装成 Java 类型（`java.String()`、`java.Long()`）
- 复合 DTO 用 `{ $class: '全限定类名', $: { 字段 } }` 结构编码
- 走 TCP 长连接，二进制协议传输

### 3. 鉴权 — Provider Token 注入（需自定义实现）

Java provider 通常开启 token 鉴权，每个 provider 实例注册独立随机 token 到 ZK。
`dubbo2.js` 本身不解析 token，需要自己实现：

1. 从 ZK 拉取 provider URL，解析出 `host:port → token` 映射
2. monkey-patch `SocketWorker.write`，在发请求前按目标地址注入 token 到 `ctx.attachments`
3. watch ZK 节点变化 + 定时兜底刷新（provider 重启 token 会变）

## 调用流程

```plain
Nuxt server 发起调用
   ↓
dubbo2.js 调度器选 provider
   ↓
patched SocketWorker.write 注入 token
   ↓
Hessian 编码 → TCP 发送到 Java provider
   ↓
provider 校验 token → 执行 → 返回 { res, err }
```

## 关键点

| 问题 | 解法 |
| --- | --- |
| Nuxt HMR 热重载创建多个 ZK 连接 | 懒加载单例 + `globalThis` 缓存 |
| `dubbo2.js` 是 CJS 老库 | ESM 下用 `createRequire` 加载 |
| 库不解析 provider token | 另起 `node-zookeeper-client` 专门拉 token |
| 进程退出时资源泄漏 | 挂 Nitro 的 `close` 钩子销毁客户端和 ZK 连接 |

## 总结

> Nuxt 通过 `dubbo2.js` + ZooKeeper 服务发现直连 Java provider，用 Hessian 序列化通信；因为库不支持 provider token 鉴权，需要自己从 ZK 解析 token 并 monkey-patch 注入到每次 RPC 请求中。
