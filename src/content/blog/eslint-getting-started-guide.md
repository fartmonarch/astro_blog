---
title: ESLint新手入门指南
description: |-
  适用版本：ESLint 9+（flat config）  
  推荐方案：`@antfu/eslint-config`
  该文章结合我个人项目和Claude code生成
pubDate: 2026-06-19
updatedDate: ''
categories:
  - 前端笔记
tags: []
---

## 一、ESLint 是什么？

ESLint 是 JavaScript/TypeScript 的**静态代码分析工具**。它在**不运行代码**的情况下，检查你的代码是否符合预设规则。

**它能做什么：**

| 功能 | 示例 |
| --- | --- |
| 发现潜在 bug | 未使用的变量、未定义就使用的变量 |
| 统一代码风格 | 强制使用单引号、禁止多余空格 |
| 强制最佳实践 | 禁止使用 `var`、推荐使用 `const` |
| 自动修复 | 大部分格式化和简单规则问题可以一键修复 |

**它不能做什么：**

- 不能替代 TypeScript 的类型检查
- 不能替代代码测试
- 不能修复所有问题（逻辑错误等需要手动处理）

***

## 二、核心概念

### 2.1 规则（Rule）

每条规则定义了代码的一种约束。例如：

```plain
// .eslintrc 或 eslint.config.js 中配置
{
  "no-unused-vars": "error"  // 未使用的变量 → 报错
}

```

规则有三个级别：

| 值 | 含义 |
| --- | --- |
| `"off"` 或 `0` | 关闭规则 |
| `"warn"` 或 `1` | 警告（不影响构建） |
| `"error"` 或 `2` | 报错（可能阻断构建） |

### 2.2 配置继承（Extends）

不需要从零开始写规则。可以继承别人写好的配置集：

- **`eslint:recommended`** — ESLint 官方推荐的基础规则
- **`@antfu/eslint-config`** — Anthony Fu 的全家桶配置（推荐）
- **`@vue/eslint-config-typescript`** — Vue + TypeScript 专用

### 2.3 插件（Plugin）

插件提供额外的规则集：

| 插件 | 用途 |
| --- | --- |
| `eslint-plugin-vue` | Vue SFC 文件规则 |
| `@typescript-eslint/eslint-plugin` | TypeScript 专用规则 |
| `eslint-plugin-format` | 让 ESLint 承担格式化职责（替代 Prettier） |

### 2.4 Flat Config（扁平配置）

ESLint 9+ 使用 **flat config**，配置文件名为 `eslint.config.js`（或 `.ts`/`.mjs`/`.cjs`）。

旧版 `.eslintrc.js` 已废弃，新项目统一使用 flat config。

***

## 三、从零配置 ESLint（推荐方案）

### 3.1 安装依赖

```plain
# 核心
npm install -D eslint @antfu/eslint-config eslint-plugin-format

```

> `@antfu/eslint-config` 已经内置了 Vue、TypeScript、Node.js 等常用规则，不需要单独安装一堆插件。
> `eslint-plugin-format` 让 ESLint 同时承担代码格式化，不再需要 Prettier。

### 3.2 创建配置文件

在项目根目录创建 `eslint.config.js`：

```plain
import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,         // 启用 Vue SFC 规则
  typescript: true,  // 启用 TypeScript 规则
  formatters: true,  // 启用格式化（替代 Prettier）
})

```

就这么简单。`@antfu/eslint-config` 会自动处理所有细节。

### 3.3 添加 npm scripts

在 `package.json` 中添加：

```plain
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}

```

- `npm run lint` — 检查所有文件
- `npm run lint:fix` — 检查并自动修复

***

## 四、VSCode 集成（保存时自动修复）

### 4.1 安装扩展

在 VSCode 扩展商店搜索并安装：

- **ESLint**（`dbaeumer.vscode-eslint`）

> 不需要安装 Prettier 扩展。`eslint-plugin-format` 已经包含格式化能力。

### 4.2 配置 VSCode settings

打开 VSCode 设置（`Ctrl + ,`），点击右上角的「打开设置(JSON)」图标，添加：

```plain
{
  // 保存时自动执行 ESLint 修复
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  // 让 ESLint 作为默认格式化器
  "[javascript]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
  },
  "[typescript]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
  },
  "[vue]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
  },
  "[json]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
  },
  // 禁用 VSCode 默认格式化（避免与 ESLint 冲突）
  "editor.formatOnSave": false
}

```

**配置说明：**

| 配置项 | 作用 |
| --- | --- |
| `source.fixAll.eslint` | Ctrl+S 时自动运行 ESLint fix |
| `editor.defaultFormatter` | 指定 ESLint 为各语言的默认格式化器 |
| `editor.formatOnSave: false` | 关闭 VSCode 内置格式化，避免冲突 |

### 4.3 验证是否生效

1. 打开任意 `.ts` 或 `.vue` 文件
2. 故意写一些格式问题（多余空格、缺少分号等）
3. 按 `Ctrl+S`
4. 如果代码自动被修复 → 配置成功

如果没反应，按 `Ctrl+Shift+P` → 输入 `ESLint: Restart ESLint Server`，重启 ESLint 服务。

***

## 五、常见问题排查

### 5.1 ESLint 输出面板报错

按 `Ctrl+Shift+U` 打开输出面板，下拉选择「ESLint」，查看具体错误。

**常见错误及解决：**

| 错误 | 原因 | 解决 |
| --- | --- | --- |
| `Cannot find module 'eslint'` | 未安装依赖 | `npm install -D eslint` |
| `Parsing error` | TypeScript 配置问题 | 确认安装了 `typescript` 且版本兼容 |
| `Cannot read properties of undefined (reading 'Intrinsic')` | TypeScript 版本太新，`ts-api-utils` 不兼容 | 降级 TypeScript 到 6.x |
| `ESLint config file not found` | 缺少配置文件 | 创建 `eslint.config.js` |

### 5.2 文件被忽略

ESLint 默认忽略 `node_modules` 和 `.git`。如果你的文件不被检查：

```plain
// eslint.config.js
import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  typescript: true,
  formatters: true,
  // 自定义忽略规则
  ignores: [
    'dist/**',        // 构建产物
    '.nuxt/**',       // Nuxt 生成
    '.output/**',     // 输出目录
  ],
})

```

### 5.3 规则冲突

如果同一规则被多个配置定义，**后面的配置覆盖前面的**：

```plain
import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  typescript: true,
  formatters: true,
}, {
  // 自定义规则覆盖
  rules: {
    'no-console': 'off',           // 允许 console
    'vue/multi-word-component-names': 'off',  // 允许单词组件名
  },
})

```

***

## 六、`@antfu/eslint-config` 特性速查

### 6.1 内置能力

| 能力 | 说明 |
| --- | --- |
| TypeScript 支持 | 完整的 TS 规则集 |
| Vue 支持 | Vue 3 SFC 规则 |
| Node.js 支持 | Node.js 最佳实践 |
| JSON/JSONC 支持 | JSON 文件格式化 |
| YAML 支持 | YAML 文件格式化 |
| Markdown 支持 | Markdown 代码块检查 |
| 格式化 | 内置 stylistic 规则，替代 Prettier |
| Import 排序 | 自动排序 import 语句 |
| 单元测试 | Vitest/Jest 规则 |

### 6.2 配置选项

```plain
export default antfu({
  // 基础
  vue: true,              // Vue 支持
  typescript: true,       // TypeScript 支持
  formatters: true,       // 格式化能力

  // 可选
  json: true,             // JSON 支持（默认开启）
  yaml: true,             // YAML 支持（默认开启）
  markdown: true,         // Markdown 支持（默认开启）
  test: true,             // 测试文件规则
  ignores: ['dist/**'],   // 忽略目录

  // 高级
  stylistic: {
    indent: 2,            // 缩进
    quotes: 'single',     // 引号风格
    semi: false,          // 分号
  },
})

```

### 6.3 默认代码风格

`@antfu/eslint-config` 的默认风格：

| 规则 | 默认值 |
| --- | --- |
| 分号 | 不使用 |
| 引号 | 单引号 |
| 缩进 | 2 空格 |
| 尾逗号 | 全部添加 |
| 行宽 | 无硬限制 |
| 箭头函数括号 | 始终添加 |

***

## 七、完整示例：Nuxt + Vue + TypeScript 项目

### 7.1 安装

```plain
# 核心 ESLint
npm install -D eslint @antfu/eslint-config eslint-plugin-format

```

### 7.2 `eslint.config.js`

```plain
import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  typescript: true,
  formatters: true,
  ignores: [
    '.nuxt/**',
    '.output/**',
    'dist/**',
  ],
})

```

### 7.3 `package.json` scripts

```plain
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}

```

### 7.4 `.vscode/settings.json`

```plain
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[javascript]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
  },
  "[typescript]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
  },
  "[vue]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
  },
  "[json]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
  },
  "editor.formatOnSave": false
}

```

### 7.5 `.vscode/extensions.json`（团队共享推荐扩展）

```plain
{
  "recommendations": [
    "dbaeumer.vscode-eslint"
  ]
}

```

***

## 八、工作流程总结

```plain
新项目中配置 ESLint 的完整流程：

1. npm install -D eslint @antfu/eslint-config eslint-plugin-format
   ↓
2. 创建 eslint.config.js
   ↓
3. 在 package.json 添加 lint scripts
   ↓
4. VSCode 安装 ESLint 扩展
   ↓
5. 配置 .vscode/settings.json（保存自动修复）
   ↓
6. 打开文件 → Ctrl+S → 验证自动修复生效
   ↓
完成 ✓

```

***

## 九、FAQ

### Q: ESLint 和 Prettier 怎么选？

**用 `@antfu/eslint-config` + `eslint-plugin-format`，不需要 Prettier。**

原因：

- 少一个依赖、少一套配置
- 避免 ESLint 和 Prettier 规则冲突
- Anthony Fu 的方案已经是社区主流

### Q: 团队里有人不用 VSCode 怎么办？

在 `package.json` 添加 `lint` script，CI/CD 中运行 `npm run lint`，不通过的代码不能合并。编辑器无关。

### Q: 旧项目 `.eslintrc.js` 需要迁移吗？

不急。ESLint 仍然兼容旧配置，但新项目建议直接用 flat config。迁移指南见 [ESLint 官方文档](https://eslint.org/docs/latest/use/configure/migration-guide)。

### Q: 为什么 TypeScript 版本要注意？

ESLint 的 TypeScript 插件（`@typescript-eslint/*`）依赖 `ts-api-utils`，而 `ts-api-utils` 可能尚未适配最新的 TypeScript 版本。如果遇到 `Cannot read properties of undefined` 类错误，先降级 TypeScript 一个主版本试试。

***

## 十、参考资源

| 资源 | 链接 |
| --- | --- |
| ESLint 官方文档 | [https://eslint.org/docs/latest/](https://eslint.org/docs/latest/) |
| Flat Config 指南 | [https://eslint.org/docs/latest/use/configure/configuration-files](https://eslint.org/docs/latest/use/configure/configuration-files) |
| @antfu/eslint-config | [https://github.com/antfu/eslint-config](https://github.com/antfu/eslint-config) |
| VSCode ESLint 扩展 | [https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) |
| TypeScript ESLint | [https://typescript-eslint.io/](https://typescript-eslint.io/) |
