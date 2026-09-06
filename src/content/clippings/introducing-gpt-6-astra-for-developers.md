---
title: "Astra 开发者视频：电脑操作与 3D 更细，红围巾鹈鹕成风格指纹"
description: "Simon 点评 OpenAI 官方开发者视频：Astra 跟提示更准、3D 更细；1 分 59 秒的红围巾鹈鹕可当视觉风格探针。"
url: "https://simonwillison.net/2026/Sep/5/introducing-gpt-6-astra-for-developers"
source: "Simon Willison"
pubDate: 2026-09-05
edition: "2026-09-06"
editionType: daily
tags: ["应用技巧", "OpenAI", "GPT-6 Astra", "3D"]
author: "Simon Willison"
---

### 结论

OpenAI 放出面向开发者的 **GPT-6 Astra** 介绍视频后，Simon Willison 只截了一帧：**1 分 59 秒出现一只系红围巾、骑单车的鹈鹕**。这不是玩笑配图——官方旁白刚说完 Astra「更跟提示、输出更复杂，尤其擅长建 3D」，画面立刻露出他这几天反复测到的同一套视觉习惯。对工程师，这条短评的价值是：**把官方 demo 当对照样本，把「红围巾鹈鹕」当风格指纹**，去验证电脑操作、3D 生成和长任务中途纠偏，而不是再读一遍发布稿分数。

### 要点

- **官方卖点是「少手把手、一次就能交差」。** 视频里 OpenAI 把 Astra 说成「有经验的协作者」：任务可以更大、定义更模糊，编码、写作、设计都常能首轮交出能用的结果。这和「换模型名就全面变强」不是一回事——你要看的是**模糊需求下少返工**，不是榜单第一。

- **电脑使用（computer use）= 模型像人一样看屏幕、点软件。** 演示里先拍照，再让 Codex 打开绘画软件 **Krita**，按梵高风格作画并加上金门大桥。Astra 靠**连续截图**判断界面状态，应用可以挂在后台，人不用盯着每一步点击。它比「直接吐一张图」难：模型必须记住目标画面，同时操作菜单、画笔和图层。同类能力也适用于申请 API Key 填表、给移动应用做 QA。

- **3D 被单独点名为强项。** 官方把若干旧模型做过的 demo、游戏、工具按不同推理强度重做，结论是：Astra **更注意细节、更理解提示、能搭更复杂的输出**；花园、船坞、动物、城市、戴森球都举过例。Simon 截下的鹈鹕，正是「动物 + 3D/精细渲染」这条线的现场证据。

- **红围巾是风格指纹，不是随机彩蛋。** 同一天他用编码代理驱动本机 **Blender**（通过 Python API 出 `.blend` 和渲染图），提示从「鹈鹕骑车」加到「加背景和花样」再到「再好很多」——成品仍是帽子 + 珊瑚/红色围巾。前一天的 SVG 对比网格里，Astra 也稳定走这套造型。**风格指纹**的意思是：固定提示下，模型会反复长出同一套视觉习惯；评测时把它记下来，比只看「像不像鹈鹕」更有用。

- **长任务配套了异步工具调用和中途转向。** **异步工具调用（async tool calling）**：某个工具还在跑时，模型可以继续做任务的其他部分，结果回来再接上。**转向（steering）**：回复还在生成时，你追加新指令或改方向，不必取消已启动的工具、也不必整段重来。视频说这两项进了 **Responses API**（OpenAI 较新的、适合带工具的对话接口），ChatGPT / Codex 里也能感到类似体验。Astra 已在 ChatGPT、Codex 和 API 开放。

### 怎么做

1. **把官方视频当对照样本，不要当广告片滑过去。** 打开 [Introducing GPT-6 Astra for developers](https://www.youtube.com/watch?v=bOC3DisEOfg)，在电脑操作段和 **1:59** 附近暂停。记下：界面控件有没有点错、画面是否跟上提示、3D/插画细节是否比你现用模型密。这些帧就是你自己评测时的「官方参考答案」。

2. **电脑操作任务交给「已安装的 GUI」，而不是空口要像素。** 学视频的结构：一张参考图 + 一个具体软件（Krita、浏览器、内部后台）+ 一句可验收的目标。提示里写清「用截图确认状态、应用可在后台」。你要验收的是**步骤有没有走丢**，不只是最终图好不好看。

3. **用固定鹈鹕提示做 3D / 视觉探针。** 本机装好 [Blender](https://www.blender.org)，对编码代理说清可执行文件路径，例如：`Use the already installed /Applications/Blender to render a scene of a pelican riding a bicycle`（Windows/Linux 换成你的安装路径）。再追加两轮短指令：`add a background and a lot of flair`、`make it a whole lot better`。保存渲染图、`.blend` 和脚本（Simon 的成品走的是 Blender Python API）。看三件事：车和鸟的结构对不对、有没有「红围巾/帽子」这类指纹、迭代是真改结构还是只加装饰。

4. **长任务用转向纠偏，避免取消重来。** 若你走 API，优先试 Responses API 的异步工具调用：先派一个会跑一会儿的工具，同时让模型继续规划；中途用 steering 补约束（「篮子改成空的」「不要戴围巾」）。对比「取消整段、改提示重跑」省了多少时间和钱。ChatGPT / Codex 里同样可以在生成中途改口，观察它是否接住新上下文。

5. **把风格指纹写进评测表。** 同一提示、同一输出格式，至少留一列「反复出现的造型习惯」。Astra 这边目前很稳的是**骑车鹈鹕 + 红/珊瑚色围巾**。你的业务探针也应固定一句提示，连续跑几天，避免把「模型脾气」误判成「这次提示写得好」。

### 关键图表

![OpenAI 开发者视频 1 分 59 秒：系红围巾骑单车的鹈鹕](https://static.simonwillison.net/static/2026-09-05/astra-video-pelican.webp)

*官方 demo 里的鹈鹕与 Simon 用 Blender / SVG 网格测到的造型一致——红围巾是可复现的风格指纹，不是一次性彩蛋（图源：Simon Willison）*
