---
title: Git分支发版时的两种提交方法
description: 在实习中学到，发版时往往不需要并入整个分支而是只需要挑选部分提交即可
pubDate: 2026-05-18
updatedDate: ''
categories:
  - 实习笔记
tags:
  - git
---

## 方法一：cherry-pick 挑选提交

**适用**：改动少、提交少（1\~2 个）、紧急修复

```plain
# 1. 确保本地分支最新
git checkout master
git pull origin master

git checkout develop
git pull origin develop

# 2. 从 master 拉出功能分支进行开发
git checkout -b feature/修复-master
# ... 写代码、改文件 ...
git add .
git commit -m "feat: 某某修复"

# 3. 切换到 develop，cherry-pick 那个提交
git checkout develop
git cherry-pick <commit-hash>

# 4. 推送到远程
git push origin develop

```

### 核心原理

cherry-pick 只看单个提交的 diff，把它重新应用到目标分支上，不管历史差异。

### 多提交时

```plain
# 逐个 cherry-pick
git cherry-pick <hash1>
git cherry-pick <hash2>
git cherry-pick <hash3>

# 或批量范围 cherry-pick
git cherry-pick <oldest-hash>^..<newest-hash>

```

### 优缺点

| 优点 | 缺点 |
| --- | --- |
| 冲突概率低 | 多次提交时需要逐个 cherry-pick，容易漏 |
| 操作简单直接 | master 和 develop 差异大时可能仍有冲突 |
| 不引入额外 merge 历史 | cherry-pick 后生成新 commit，hash 不同 |

***

## 方法二：分别拉分支，再合并

**适用**：改动多、提交多、需要联调的功能开发

### 完整步骤

```plain
# ===== 第一步：从 master 和 develop 各拉一条分支 =====

git checkout master
git pull origin master
git checkout -b feature/管家-master

git checkout develop
git pull origin develop
git checkout -b feature/管家-develop

# ===== 第二步：在 master 功能分支上开发（可多次提交） =====

git checkout feature/管家-master
# ... 写代码 ...
git add .
git commit -m "feat: 增加待入职资料列表"

git add .
git commit -m "feat: 增加驳回按钮"
# ... 继续开发、继续提交 ...

# ===== 第三步：把 master 功能分支合并到 develop 功能分支 =====

git checkout feature/管家-develop
git merge feature/管家-master
# 如果有冲突，在这里解决（只解决一次）
git commit  # 完成 merge commit

# ===== 第四步：把 develop 功能分支合入 develop =====

git checkout develop
git merge feature/管家-develop
# 解决可能出现的冲突
git commit

# ===== 第五步：推送 =====

git push origin develop
```

### 常见问题：为什么不直接合并到 develop？

方法二的第三步是 `feature/管家-master` → `feature/管家-develop`，第四步才是 `feature/管家-develop` → `develop`。你可能会问：**为什么不直接把 feature/管家-master 合并到 develop 呢？冲突不是照样有吗？**

**冲突数量确实一样，区别在于处理冲突的时机和上下文：**

|  | 直接合并到 develop | 先合并到 develop 功能分支 |
| --- | --- | --- |
| **处理时机** | 测试还没验证就合入 develop，如果合并出问题（冲突解决错误、代码异常），develop 就被污染了 | 先在 feature/管家-develop 上解决冲突、验证通过，再干净地合入 develop |
| **回滚成本** | 合并后发现问题，需要 revert develop 上的合并，影响其他功能 | 只在功能分支上出问题，不影响 develop |
| **协作影响** | 如果多人同时往 develop 合，一旦出问题阻塞所有人 | 每个功能独立处理冲突，互不影响 |
| **冲突本身** | 冲突内容一样，该解的还得解 | 冲突内容一样，该解的还得解 |

**总结**：冲突确实不可避免，两条路要解的冲突量是一样的。多一步功能分支的价值在于**风险隔离**——在安全的地方解冲突、测通过，再往 develop 合。如果你的团队信任度高、develop 挂了也无所谓，直接合也是完全可以的。

### 优缺点

| 优点 | 缺点 |
| --- | --- |
| 多提交一次合并带走，不用逐个挑 | 步骤较多，需要管理两条功能分支 |
| 完整保留提交历史 | 合并时冲突概率稍高（但集中处理） |
| master/develop 差异只在一处解决 |  |

***

## 两种方法对比总结

| 特性 | 方法一 cherry-pick | 方法二 分支合并 |
| --- | --- | --- |
| 适用场景 | 紧急修复、1\~2个小改动 | 功能开发、多次提交、联调 |
| 冲突概率 | 低（只挑单个 diff） | 中（但集中在 merge 时解决） |
| 提交历史 | cherry-pick 生成新 commit，原 hash 丢失 | 完整保留原始提交历史 |
| 多提交处理 | 逐个或范围 cherry-pick | 一次 merge 全部带走 |
| 操作复杂度 | 简单 | 步骤稍多 |
| master/develop 差异处理 | 每次 cherry-pick 都可能触发 | 在 merge 点集中解决一次 |
