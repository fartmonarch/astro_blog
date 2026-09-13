---
title: URL中路径(Path)参数和查询(Query)参数
description: 记录实习中在使用Nuxt时路由选择上产生对URL的疑问，所以记录一下这两种url参数
pubDate: 2026-05-10
updatedDate: ''
categories:
  - 运维笔记
tags:
  - 计算机网络
---

> [URL参数传递的两种方式：查询参数与路径参数详解在现代Web开发中，URL设计是前后端交互的重要桥梁。当我们需要在URL - 掘金](https://juejin.cn/post/7488596151995269183)

### 路径参数

**定义**：路径参数是直接嵌入在URL路径中的变量部分，成为URL路径结构的一部分。
**语法格式**：`http://example.com/资源类型/资源ID/子资源`

### 查询参数

**定义**：查询参数是附加在URL末尾的键值对，以问号`?`开始，多个参数间用`&`连接。
**语法格式**：`http://example.com/path?参数1=值1&参数2=值2`
