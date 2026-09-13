---
title: nvm、npm、pnpm、yarn
description: 整理前端常用的几个包管理工具
pubDate: 2026-06-24
updatedDate: ''
categories:
  - 前端笔记
tags:
  - 包管理工具
---

## nvm

- Node版本的切换器
- 常用指令 nvm list、nvm use （node版本）、nvm install （node版本）、nvm uninstall （node版本）

## npm

- 用于下载、管理项目依赖。
- 串行下载(速度慢)
- 锁文件：`package-lock.json`
- 依赖结构：早期采用嵌套结构（node_modules 层层嵌套），后来改为扁平化（平铺），但仍存在“幽灵依赖”（未声明的包也能被引用）的问题。

## yarn

- 为解决早期 npm 速度慢、稳定性差而诞生的第三方包管理器。
- 采用并行下载
- 锁文件：`yarn.lock`，锁定性极强。
- 创新：生成 node_modules，通过映射表寻址，启动更快，但兼容性有坑。

## pnpm

- 硬链接存储：所有包统一存在全局仓库（\~/.pnpm-store），项目里只存**硬链接**。装 100 个项目用了同一个版本的 React，磁盘只占一份空间。
- 非扁平化结构：node_modules 采用严格的符号链接结构。彻底解决了“幽灵依赖”问题——你必须在 `package.json` 里显式声明才能引用该包，否则报错。
- 速度：因为硬链接复用，安装速度极快（常被 benchmark 为第一）。
