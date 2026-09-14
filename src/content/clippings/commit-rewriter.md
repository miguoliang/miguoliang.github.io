---
title: "commit-rewriter 0.1：先备份分支，再改掉 Agent 留下的提交说明"
description: "Simon 为 Datasette 安全发布做了网页工具：uvx 打开仓库改提交说明；提交前先打时间戳分支，再从第一条改动重写到最新。"
url: "https://simonwillison.net/2026/Sep/14/commit-rewriter"
source: "Simon Willison"
pubDate: 2026-09-14
edition: "2026-09-14"
editionType: daily
tags: ["应用技巧", "Git", "AI 辅助编程"]
author: "Simon Willison"
---

### 结论

Simon Willison 发布了 **commit-rewriter 0.1**：一个用来改提交说明（commit message）的 Python 网页工具。他整理 [Datasette 安全发布](https://datasette.io/blog/2026/september-security-releases/) 的历史时发现，Agent 写下的说明夹着套话，还引用了**私有仓库的 issue 编号**，公开出去不合适。用法是 `uvx commit-rewriter path/to/repo`；你点提交后，工具先打一条带时间戳的备份分支，再从你改过的**第一条**提交重写到最新。

### 要点

- **公开仓库前，提交说明也是发布物。** Agent 常把内部 ticket、半成品推理、私有 issue ID 写进 message。代码可以合并，历史一旦推到公开远程，这些字就会跟着走。Simon 的触发场景很具体：Datasette 安全发布要给人看，原始提交不适合原样公开。

- **一行 `uvx` 就能打开，不必先装进虚拟环境。** `uvx` 来自 `uv` 生态，类似 Node 的 `npx`：临时拉 Python 包并执行 CLI。已在仓库目录里可以省略路径；否则写成 `uvx commit-rewriter path/to/repo`。

- **界面按提交卡片改，还能搜、看 diff。** 原文截图里：顶部是仓库路径、当前分支和哈希；工具栏有待改数量、Discard drafts、Rewrite commit messages，以及按说明 / 作者 / 哈希搜索、「只看已改」；左侧 Navigate commits 列最近说明，主栏每张卡片带哈希、作者、时间、可编辑文本，并可展开完整格式化 diff。改字之前先对一下 diff，避免改错提交。

- **改旧说明会换掉后面所有哈希，所以必须先备份。** Git 里一条提交的哈希由内容（含 message）和父提交算出来。你改中间某条的说明，它的哈希变了，后面每条的「父节点」也得重写。工具因此：**从你改过的第一条一直重写到最新**；动手前先把当前仓库状态存进带时间戳的分支，回退有路。

### 怎么做

面向刚把 Agent 提交推进公开仓库、或要发安全补丁的工程师：

1. **先扫一遍哪些说明不能公开。** 私有 issue 号、内部代号、Agent 的长篇推理、「fix stuff」这类空话，都该改。只改说明、不改文件内容时，仍然是在**改写历史**——已推过的分支不要在别人正在用的时候硬推。

2. **在仓库里启动工具。** `uvx commit-rewriter`；若当前目录不是那个仓库，补上路径。浏览器里打开本地网页即可，不用自己配虚拟环境。

3. **按卡片改，用搜索收窄范围。** 不确定改的是不是那次提交时，展开「View full formatted diff」。改完可勾 Edited only 复查。还不想动历史，用 Discard drafts 丢掉草稿。

4. **点 Rewrite 之前，默认会有一条时间戳备份分支。** 提交编辑后：先记下这条备份分支名，再让它从第一条被改的提交重写到 HEAD。回退就是回到那条分支，而不是在 reflog 里碰运气。

5. **只在「还没人基于这些提交继续干活」时重写并推送。** 安全发布、尚未公开的整理分支适合这么做。共享的 `main` 上别人已经拉走过的历史，改 message 等于强迫所有人变基。那种情况更适合 `git notes` 或发布说明，而不是重写。

### 关键图表

![commit-rewriter 网页：左侧浏览提交，主栏编辑说明，顶部可搜索并一键重写](https://static.simonwillison.net/static/2026/commit-rewriter.webp)
*Simon 原文截图：本地网页列出提交、直接改 message；Rewrite 前先留时间戳分支，再从第一条改动重写到最新*
