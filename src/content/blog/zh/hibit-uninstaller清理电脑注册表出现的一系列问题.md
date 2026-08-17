---
translationKey: ''
title: HiBit Uninstaller清理电脑注册表出现的一系列问题
description: HiBit Uninstaller的清理注册表给我电脑带来了很多体验上的问题，今天上网查各个攻略总算给我解决了
pubDate: 2026-08-17
updatedDate: 2026-08-17
tags:
  - 电脑问题
---

> 前天刷短视频，看到有up说这个卸载工具有bug不能使用。随后我就对自己电脑上早就出现的几个问题进行思索，应该是我用它清理注册表出现的一系列问题，接下来附上问题和我去网上搜索的解决方法。(一开始让agent修，一直没修好，虽然不是大毛病但是很影响体验)

## 1.VSCode 右键菜单中文乱码

[(35 封私信 / 1 条消息) 【Windows11独占】 VSCode 右键菜单中文乱码？ - 知乎](https://www.zhihu.com/question/2019777857736455403)
这篇应该是最有效的解决方法，并且这个是我第一个去查的问题于是就更加确认和HiBitUninstaller有联系了。

## 2.Win+R 找不到打不开Powershell

[【Windows】关于Windows Powershell找不到打不开修复方法_powershell找不到文件-CSDN博客](https://blog.csdn.net/qq_36693514/article/details/112097661)
我可以在win键搜到Powershell的并且打开，但是win+R打不开，于是我先用win键里的搜索找到Powershell的快捷方式所在文件路径再往里找一层到Powershell所在地，最后复制了整个文件夹到我自己电脑的用户目录下解决了这个问题。

## 3.文件资源管理器的地址栏中启动PowerShell时，会打开“我的文档”中的PowerShell目录，而不是启动控制台。

[尝试从文件资源管理器的地址栏中启动PowerShell时，会打开“我的文档”中的PowerShell目录，而不是启动控制台。 windows windows-explorer - Dev59](https://dev59.com/superuser/C0nYs4cB2Jgan1znUEYN)
第一个高赞回答解决了我的问题。这样启动PowerShell是可以直接在文件管理器里启动相对路径地址的。

## 4.Win+R 运行窗口没有历史记录

[windows11运行窗口显示历史记录 - GiveCookies - 博客园](https://www.cnblogs.com/GiveCookies/p/18517071)
因为这个问题每次都要手敲一遍cmd和powershell，但是我总记得我没有调这个相关设置，并且在公司我想使用Claude快速问题都是通过这个方法启动的，所以找到这个问题。这个在另一篇文章中有个作者也说应该是注册表的问题。

### 目前使用了这个软件出来了几个会影响到我的我已经修复，可能后续还会有别的被排查出来.... 希望网上已经有解决方案了！
