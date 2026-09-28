---
title: "GitHub Copilot app：用 /create-canvas 按工作流生成你和 Agent 共用的界面"
description: "Canvas 是你和 Copilot 共享的看板、清单或表单。用白话写清工作流、你能点什么、Agent 能改什么，右侧面板就会长出一块可一起改的界面。"
url: "https://github.blog/ai-and-ml/github-copilot/github-copilot-app-for-beginners-how-to-build-custom-workflows-with-canvases"
source: "GitHub Blog (AI & ML)"
pubDate: 2026-09-25
edition: "2026-09-28"
editionType: daily
tags: ["应用技巧", "GitHub Copilot"]
author: "Kayla Cinnamon"
---

### 结论

多数工具给你固定屏幕，要你把工作塞进去。GitHub Copilot app 的 **canvas**（也叫 canvas extension，画布扩展）反过来：用白话说清你怎么干活，Agent 就在右侧面板生成一块你和它**共用**的界面——看板、Issue 分诊板、发布清单、仪表盘、表单，甚至电子表格都可以。Kayla Cinnamon 在 [Beginners 系列](https://github.blog/ai-and-ml/github-copilot/github-copilot-app-for-beginners-how-to-build-custom-workflows-with-canvases) 里演示：会话中调用 `/create-canvas`，不必手写文件或摆布局；界面是**双向的**，你点控件、Agent 改同一块共享状态，不必先发命令再干等。

### 要点

- **Canvas 是一块活的工作面，不是聊天记录里的静态图。** 你和 Agent 共享同一套界面：人用按钮、卡片、筛选、字段做改动；Agent 干活时也能往上写。可以把它理解成一块实时共用的白板，只是这块白板长成了你的工作流，而不是通用画板。

- **先定流程，再长界面。** 常见误区是打开工具后在固定菜单里找「有没有我要的视图」。Canvas 没有固定布局清单：你能描述的工作流，多半就能变成一块 canvas。第一版只是起点，可以继续让 Agent 加列、加筛选、拉进未完成的 pull request，或把整块改成当天 checklist。

- **`/create-canvas` 的提示词要写全三件事。** 只说「做个看板」往往得到空壳。原文要求覆盖：这块界面支撑哪条工作流；你在上面要能做什么；Agent 要能做什么。三件事齐了，一次描述才会变成能用的自定义工具。

- **双向靠的是共享状态，不是再同步一次。** 你点按钮、改字段、挪卡片，状态立刻变，Agent 能直接看到，不必另走发送步骤。反过来，你可以让 Agent 调用 canvas **自己的能力**（和你能点的是同一套动作）去加一条发布说明或移动卡片，然后看着右侧面板更新。这是一起转向，不是「发指令 → 等长回复」。

- **生成后会存成扩展，下次还能打开。** 可以跟项目走、给团队共享，也可以存成只给你自己用的个人扩展。不知道从哪开手时，社区在 [Awesome Copilot](https://github.com/github/awesome-copilot) 里放了现成的发布说明、看板、Issue 分诊等 canvas：先装一个接近的，再让 Agent 按你的流程改——和打磨自己生成的那块是同一套路。

### 怎么做

面向已经能打开 GitHub Copilot app、开得了 Agent 会话的 junior：

1. **开一条会话，输入 `/create-canvas`。** 技能名后面紧跟白话描述。动笔前列三个问题（原文带走的检查清单）：我要看见什么信息？我希望自己能直接改什么？Agent 应该能更新或执行什么？

2. **把三件事写进同一段提示。** 原文可直接改着用的例子：

   `/create-canvas Create a release notes canvas for tracking new feature work completed across GitHub Copilot app sessions. Include controls for reviewing and organizing entries and allow the agent to add and update them.`

   中文同样有效，关键是「追踪什么 + 人怎么整理 + Agent 怎么增改」。Agent 会生成界面并在**右侧面板**打开，你不用自己写文件或拖布局。

3. **把第一版当草稿，用对话继续改。** 例如：加一列、加筛选、把未完成的 PR 拉进来、整块变成当天清单。改的是同一块 canvas，不是另开一个聊天主题当说明书。

4. **选定共享范围再保存。** 要团队一起用，就跟仓库保存（官方目录是 `.github/extensions`）；只要自己用，存成个人扩展（`~/.copilot/extensions`）。保存后它是可再用的扩展，不必每天从零生成。

5. **在界面上一起干活。** 你直接点控件改状态；同时可以请 Agent 用 canvas 自己的能力去加条目、挪卡片。两边改的是同一块板，用来检查进度、纠正方向，而不是只在聊天里口头同步。

6. **从小处开始，或先装社区成品。** 打开会话，给手头正在做的事做一块简单看板或清单。若不想从零描述，到 Awesome Copilot 装一个接近的 canvas，再用同一种「描述 → 让 Agent 改界面」的方式定制。

### 关键图表

![GitHub Copilot app for Beginners: Build custom AI surfaces](https://github.blog/wp-content/uploads/2026/09/Screenshot-2026-09-23-at-3.59.20-PM.png)
*GitHub 原文封面：Copilot app for Beginners 这一课的主题是 Build custom AI surfaces——先定工作流，再让你和 Agent 共用的界面围着它长出来*
