---
title: 我用一个Skill在云上养了只QQ大肥鱼
description: |-
  最近经常刷到QQ聊天机器人大肥鱼，搜了一圈，发现现成的方案都卡在「装」这一步——AstrBot、NapCat、DeepSeek、语音、记忆、表情包，六七样东西要拼在一起，任何一环配错都聊不起来。
  后来找到一条捷径：有个叫 **dafeiyu-install** 的 Skill，把整套流程包成了「你回答问题、它来装」。我照着试了一遍，最后真的跑起来了，而且是 24 小时在线的那种。
pubDate: 2026-11-02
updatedDate: 2026-11-02
categories:
  - 服务端笔记
tags: []
---

> 文中 `<服务器IP>`、`<工作目录>`、`<大号QQ>`、`<小号QQ>` 这些都是占位符，换成你自己的就行。
> 全文不含任何真实密钥、IP 和账号。

## 写在前面

我不是那种能从零手搓机器人的人。会复制命令、会看报错、知道 Docker 是个啥，仅此而已。

事情的起因很简单：最近经常刷到QQ聊天机器人大肥鱼，搜了一圈，发现现成的方案都卡在「装」这一步——AstrBot、NapCat、DeepSeek、语音、记忆、表情包，六七样东西要拼在一起，任何一环配错都聊不起来。

后来找到一条捷径：有个叫 **dafeiyu-install** 的 Skill，把整套流程包成了「你回答问题、它来装」。我照着试了一遍，最后真的跑起来了，而且是 24 小时在线的那种。

这篇文章写两件事：

1. **怎么装这个 Skill**——有基础的人看到第一节就可以自己跑了；
2. **它到底是怎么工作的**——我把它拆开看了一遍，这比「装好了」本身更有意思。

## 一、先装 Skill（大多数人到这步就够了）

### 1.1 你需要准备什么

- 一台 Windows 10/11 电脑；
- 已经装好 **DeepSeek Harness**（或 WorkBuddy），能正常对话；
- 一个 **QQ 小号**——千万别用大号，后面第七节会说为什么；
- 一个 DeepSeek 的 API key（要充值，按聊天量扣，几块钱能聊很久）。

### 1.2 一句话安装

新开一个对话，把下面这段原样粘进去：

> 帮我装一个叫 dafeiyu-install 的技能，装好直接用它帮我装大肥鱼：从 [https://gh.dpik.top/https://github.com/zexuanw958-svg/dafeiyu-config-pack/releases/latest/download/dafeiyu-install.zip](https://gh.dpik.top/https://github.com/zexuanw958-svg/dafeiyu-config-pack/releases/latest/download/dafeiyu-install.zip) 下载压缩包（下不动就去掉开头的 [https://gh.dpik.top/](https://gh.dpik.top/) 再试），解压后把里面的 dafeiyu-install 文件夹放进你读技能的文件夹（DeepSeek Harness 是 %USERPROFILE%.agents\skills\，WorkBuddy 是 %USERPROFILE%.workbuddy\skills\，没有就新建；里面已经有 dafeiyu-install 的，先把旧的挪到别处）。放好后读一遍它的 SKILL.md，照着开始。

然后你就不用管了。它会自己：

1. 下载压缩包（那个 `gh.dpik.top` 是加速前缀，下不动会自动去掉重试）；
2. 解压，把 `dafeiyu-install` 放进技能目录；
3. 读一遍 `SKILL.md`，开始按里面的流程带你装。

技能装好后，在技能列表里能看见 `dafeiyu-install`。之后再想装/重装，直接说「帮我装大肥鱼」它就会接着干。

### 1.3 这一节的前提

这套东西只支持 Windows。另外，`dafeiyu-install` 是个 **Skill**，不是一个双击就装的 exe——它的本质是一份写给 AI 看的操作手册，加上一堆帮你干活的脚本。所以你必须有 DeepSeek Harness 这类能读 Skill 的 Agent，不然它没法「照着做」。

### 1.4 来源

- Skill 和配置包：[`zexuanw958-svg/dafeiyu-config-pack`](https://github.com/zexuanw958-svg/dafeiyu-config-pack)，MIT 协议。仓库简介写得很直白：「把接进 QQ 的 AstrBot 调成『大肥鱼』：人格、表情包、语音、唱歌、长期记忆、主动聊天，一键导入」。
- 原始教程：泽轩的「大肥鱼」系列（视频/专栏）。我按的是 Vol.04 那期的思路，Skill 里的文档也大量引用那期的实测结论。
- 我这篇只是把「用 Skill 装」的过程和原理记下来，配置、人设、脚本的功劳都是原作者的。

## 二、拆解：这个 Skill 是怎么把「装机器人」拆成流程的

用下来最直观的感受是：它不像那种「一键脚本」，跑完给你一堆红字；它更像一个**有经验的人坐在旁边**，先看你的机器、再问你想要什么、然后一步一步做，做完一步说一声。

我把它的设计拆成了六条，这六条其实也是「怎么写出一个靠谱安装类 Skill」的答案。

### 2.1 先体检，再开口

第一步跑的是 `probe.ps1`，只读不写，二三十秒。它看的东西很具体：

- 系统版本、CPU 架构、内存、每个盘剩多少；
- 显卡型号和显存（决定本机语音能不能跑）；
- GitHub、加速站、DeepSeek 通不通，多少毫秒；
- 电脑上装过什么：AstrBot 实例、NapCat、桌面 QQ、Ollama、Breeze；
- 有没有「别的路线」留下的东西（Docker、qq-bridge、MaiBot 之类）。

这一步的意义不是炫技，而是**让后面的每个建议都有依据**。比如它建议你装在 D 盘，是因为体检看到 D 盘剩得最多；建议你用 Breeze 在线版，是因为你的显卡没被验证过。

### 2.2 三问：把选择权交回给人

体检完它不会自己决定，而是问三件事：

1. **装在你电脑上，还是云服务器上**——各自的好处、代价都摆出来；
2. **装在哪个盘**——把每个盘剩多少列成表，不默认 C 盘；
3. **五项功能**——登 QQ 用 NapCat 还是 SnowLuma、语音用哪种、记忆用哪种、角色是谁、要不要看视频。

每一问的每个选项都写了优缺点，最后还会补一句「拿不准就选 X，因为……」。这点我很受用：它不是替你决定，而是**把决定需要的信息补全**。

### 2.3 复述确认，才真的开装

问完会复述一遍：装在哪、用什么登 QQ、哪些功能、大概占多少 G、哪些步骤要你亲手做（扫码、注册、充值）、哪些它来。

你回「开始」，它才动手。这个设计看着啰嗦，但避免了「装到一半发现方向错了」。

### 2.4 分块交付，一块失败不牵连全局

真正装的时候，它不是一口气跑到底，而是切成块：

| 块 | 干什么 | 失败会怎样 |
| --- | --- | --- |
| `core` | 人设、分段回复、认主人 | 主路，必须过 |
| `plugins` | 11 个配套插件（记忆、表情包、群聊、主动聊天……） | 重跑一次 |
| `memes` | 两套表情包，500 多 MB | 跳过，聊天不受影响 |
| `voice` | 语音提供商 | 先关着，以后补 |
| `memory` | 长期记忆 | 先关着，以后补 |
| `video` | 看视频、听语音 | 跳过 |

每块最后会打一行 `RESULT <块>=ok|partial|fail`，失败了还会告诉你「怎么补」。这比「一键装完，然后某个功能悄悄不工作」友好太多——你至少知道现在缺什么。

### 2.5 密钥纪律

这一点是我觉得最值得学的：所有密钥（DeepSeek key、Breeze key、硅基流动 key、后台密码、QQ 号）都只放在 `<工作目录>\private\` 下的文本文件里。

- 它只读文件，**不在对话里打印、不写进别的地方**；
- 需要你提供密钥时，它建一个空文件、用记事本打开，让你粘进去保存；
- 回答文件、脚本里只出现**文件路径**，不出现密钥本身。

用的时候没什么感觉，但事后想想：如果它把 key 打在聊天记录里，截图、录屏、发出去，都是事故。

### 2.6 权限和边界

它会明确告诉你哪些事它不做：

- 不替你建 DeepSeek key、不替你充值、不替你实名；
- 不替你点 UAC、SmartScreen、防火墙弹窗；
- 不替你同意 SnowLuma 的用户协议；
- 不替你买服务器、不替你点支付。

要提权的时候它会说清楚「我要往哪写文件、为什么」，而不是默默要权限。

## 三、我的云端部署实录

我最后选的是**云服务器**。原因很实际：电脑不可能一直开着，而我想让她 24 小时在线。

### 3.1 服务器

- 2 核 4 G、40 G 盘，国内地域，Ubuntu 24.04。
- 买之前一定要看**续费价**，很多机器首年便宜、续费翻几倍。
- 只跑机器人、不开网站，不用备案。

### 3.2 连上去

用密钥，不用密码：

```plain
 ssh-keygen -q -t ed25519 -N "" -C dafeiyu -f "<工作目录>\private\cloud_key"
```

> 这里有个坑：`-N ""` 在某些 PowerShell 版本里会被当成「给密钥加一个空字符串密码」，结果 ssh 用不了。生成完一定要用 `ssh-keygen -y -P "" -f <私钥>` 验一下，能直接打出公钥才算没密码。

把公钥贴进服务器（云控制台的网页终端里跑一次）：

```plain
 mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo 'ssh-ed25519 AAAA...' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo "OK $(whoami)"
```

### 3.3 Docker 和目录

```plain
 sudo apt-get update && sudo apt-get install -y docker.io docker-compose-v2
 sudo systemctl enable --now docker
 mkdir -p /home/ubuntu/astrbot/{private,kit,logs}
 chmod 700 /home/ubuntu/astrbot/private
```

### 3.4 两个容器 + 一个临时工具箱

核心是 `compose.yml`，三个服务：

- `napcat`：登小号、收发消息；
- `astrbot`：大脑；
- `tools`：平时不启动，只在改配置、导入时临时跑一下（用同一个 AstrBot 镜像，自带 Python）。

关键的一点：\*\*端口只绑 `127.0.0.1`\*\*。

```plain
 ports:
   - "127.0.0.1:6099:6099"   # NapCat 网页后台
   - "127.0.0.1:6185:6185"   # AstrBot 后台
```

不写 `127.0.0.1:` 直接 `6099:6099` 的话，Docker 会把它暴露到公网，而且**绕过 ufw**——这是很多人后台被人进去的原因。

### 3.5 扫码登小号

NapCat 起来后二维码在容器里 `/app/napcat/cache/qrcode.png`，日志里也有字符画。

最舒服的看法是开一条隧道，用浏览器看 NapCat 的网页后台：

```plain
 ssh -i "<工作目录>\private\cloud_key" -o BatchMode=yes -N `
     -L 16099:127.0.0.1:6099 -L 16185:127.0.0.1:6185 ubuntu@<服务器IP>
```

然后打开 `http://127.0.0.1:16099/webui?token=<token>`。

**扫码前一定要在手机 QQ 里切到小号。** 我第一次就是手快，直接拿大号扫，差点把大号登成机器人——脚本检测到了会退掉让你重扫，但别赌这个。

二维码有效期很短，我过期了两次，后来干脆开着网页后台，过期就点刷新。

### 3.6 白名单

`private/owner-qq.txt` 写大号，`private/group.txt` 一行一个群号（可选），然后跑 `whitelist`。

不开白名单的话，谁 @ 她都能用，花的都是你的 DeepSeek 余额。

### 3.7 六块导入

导入工具在 `tools` 容器里跑，回答文件里写清楚：后台地址、账号密码文件、大号文件、语音/记忆/看视频的选择。然后一块一块来：

```plain
 T=kit/dafeiyu-install/pack/dafeiyu-config-pack/tools/import_dafeiyu.py
 sudo docker compose run --rm -T tools $T --answers /dafeiyu/private/answers.json --only core </dev/null
 sudo docker compose run --rm -T tools $T --answers /dafeiyu/private/answers.json --only plugins </dev/null
 # memes 五百多兆，放后台下
 nohup sudo docker compose run --rm -T tools $T --answers /dafeiyu/private/answers.json --only memes </dev/null > logs/import-memes.log 2>&1 &
```

> 那个 `</dev/null` 是血的教训：`docker compose run` 会吃掉标准输入，如果脚本是通过 `bash -s` 喂进去的，第一条之后的命令会凭空消失。

六块的样子：

| 块 | 结果 |
| --- | --- |
| core | 人格切到大肥鱼，默认回复分段 |
| plugins | 11 个插件 |
| memes | 两套，331 张 |
| voice | Breeze 在线版，机灵版音色，约 33% 回复带语音 |
| memory | 硅基流动 bge-m3 |
| video | 看画面 + 在线听声音 |

### 3.8 收尾

最后跑 `finish.ps1`，它会：

- 往 `<工作目录>` 放一份便携 Python；
- 装一个「云端大肥鱼工作台」（桌面上有快捷方式）；
- 后台起一个掉线提醒。

工作台是我觉得这套东西里最实用的部分：状态、日志、重启、扫码重登、备份、批量导入，都在一个页面里。

## 四、日常怎么用

### 4.1 工作台

双击桌面「云端大肥鱼工作台」，它会在本地起一个小服务，只用 `127.0.0.1`。

> 小提示：如果你用管理员权限启动过它，之后再用普通权限打开，Edge 会弹「现有实例正在以提升的权限运行」——点「是」重启浏览器就好。工作台本身不需要管理员权限。

### 4.2 隧道是什么

服务器上的两个网页后台只监听 `127.0.0.1`，公网进不去。隧道就是把它们「搬」到你电脑上：

```plain
 你电脑 127.0.0.1:16185  ──ssh──▶  服务器 127.0.0.1:6185（AstrBot 后台）
 你电脑 127.0.0.1:16099  ──ssh──▶  服务器 127.0.0.1:6099（NapCat 网页）
```

- 工作台开着的时候，隧道是它自己开的，不用管；
- 想单独开，双击 `tools\打开后台.cmd`；
- 纯命令行就是上面那条 `ssh -L`。

**关掉隧道**：结束那个 `ssh.exe` 进程就行；**关机**隧道自然断，但服务器上的机器人照常跑。

### 4.3 掉线

云上的小号掉线是常态，机房 IP 尤其容易被踢。掉线会弹通知，点进去就是二维码，手机切小号扫一下就好。

### 4.4 备份和升级

- 备份：工作台里点一下，会打一个包含 `private`、`compose.yml`、`data`、`napcat/config` 的 zip。换服务器时解压回去就能用。
- 升级：工作台有「一键更新」，会换 Skill、配置包和容器；也可以 `docker compose pull && up -d`。

## 五、以后想改什么

这部分是给「装完之后」准备的，都是后台点几下或者跑一条命令的事。

| 想改 | 怎么做 |
| --- | --- |
| **加插件** | 后台 →「插件」→「插件市场」安装；本地插件传 zip 或丢进 `data/plugins` |
| **换音色** | 后台语音提供商里改 `voc_` 开头的音色 ID；现成的有「机灵版」「迷糊版」，也能在 BreezeBlue 网站捏新的 |
| **换语音方案** | Edge 免费女声（`voice:1`）、豆包（`voice:3`，要火山引擎）、关掉（`voice:0`） |
| **换记忆 API** | 换 `private/sf-key.txt` 里的 key 重跑 `--only memory`；或后台换嵌入模型；不要就 `memory:0` |
| **换对话模型** | 后台「服务提供商」里加 OpenAI 兼容的提供商，默认模型和**看图模型都要切** |
| **换人设** | 后台「人格」里改或新建；表情包和语音描述原本是给大肥鱼写的，想配套要一起换 |
| **表情包** | 后台 `meme_manager` 插件里加/删/调频率；群里发图也有开关 |
| **看视频** | 后台视频插件开关；云上没有本机识别，听声音走硅基流动 |
| **白名单/群** | `owner-qq.txt`、`group.txt`，跑 `whitelist`；群回复要不要 @ 用 `group-reply` |
| **主动聊天/群插话** | 对应插件的频率；群里插话概率**别超过 0.02** |

## 六、花多少钱

| 项 | 怎么收 | 备注 |
| --- | --- | --- |
| 云服务器 | 月租 | 看续费价 |
| DeepSeek | 按 token | 群聊比私聊费 |
| Breeze 在线版 | 按字扣积分 | 每天可领额度，够日常聊 |
| 硅基流动 | 记忆嵌入 + 语音转文字 | 很便宜，5 块钱能用很久 |

我第一个月总共花了几十块，大头是服务器月租。

## 七、风险与边界（这段别跳过）

### 7.1 第三方登小号 = 违反 QQ 用户协议

NapCat、SnowLuma 这类程序都是「第三方客户端」。用小号有被限制、甚至封号的概率。**绝对不要用大号。**

### 7.2 云服务器更容易被踢

机房的 IP 段是 QQ 风控的重点。原作者实测过：一台两小时被踢两次，另一台扫码当场弹「账号存在安全风险」，得在手机 QQ 上恢复。

想更稳的话，方案是搬回家里常开的 Windows，用 SnowLuma 挂在桌面 QQ 上——但要接受「电脑得一直开着」。

### 7.3 官方机器人是另一条路

如果你要的是「合规、不被封」，可以走 QQ 开放平台的官方机器人。代价是能力受限：基本只能被动回复，群里要先 @ 它，主动私聊、发空间、改签名这些都没有。**「像人的小号」和「合规的机器人」，只能二选一。**

### 7.4 群聊要想清楚

拉她进群，群友的消息也会发给 DeepSeek 处理，花的是你的余额；群里插话太多还容易被风控。所以默认建议是先不进群。

## 八、我踩过的坑

1. **后台密码必须含大写字母**。`openssl rand -hex` 生成的全是小写 + 数字，AstrBot 直接拒。
2. **`docker compose run` 会吞标准输入**。用 `bash -s` 连续跑多条时，每条后面加 `</dev/null`。
3. **`ssh-keygen -N ""` 在 PowerShell 里不可靠**，生成完要验。
4. **`cmd_config.json` 带 BOM**，Python 读要用 `utf-8-sig`。
5. **端口不写 `127.0.0.1:` 会暴露到公网**，而且绕过防火墙。
6. **二维码过期很快**，开着网页后台比来回换图省事。
7. **硅基流动余额是 0 会 402**，记忆和视频听声音都会挂——先充最少的额度。

## 九、参考与致谢

- Skill / 配置包：[`zexuanw958-svg/dafeiyu-config-pack`](https://github.com/zexuanw958-svg/dafeiyu-config-pack)（MIT）
- 原始教程：泽轩「大肥鱼」系列（视频/专栏），以及配套的飞书文档
- [AstrBot](https://github.com/Soulter/AstrBot) · [NapCat](https://github.com/NapNeko/NapCatQQ) · [BreezeBlue](https://breezeblue.ai/) · [DeepSeek 开放平台](https://platform.deepseek.com/) · [硅基流动](https://cloud.siliconflow.cn/)

装这套东西，真正花时间的不是敲命令，而是**搞清楚自己想要什么**：本机还是云上、要不要语音、记忆放哪、要不要进群。Skill 把这些选择变成了几个问题，剩下的它去做。

如果你也想养一只，按第一节把 Skill 装上，剩下的它会带着你走。
