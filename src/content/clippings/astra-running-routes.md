---
title: "Astra 用 OSM 画出 5K 环线，压缩对话后代码找不回来"
description: "Simon 让 ChatGPT Work + GPT-6 Astra 用 OSM 规划从家出发的 5K/10K 环线，27 分钟交出地图和 GPX；真正扎眼的是 compaction 之后脚本取不回来。"
url: "https://simonwillison.net/2026/Sep/12/astra-running-routes"
source: "Simon Willison"
pubDate: 2026-09-12
edition: "2026-09-13"
editionType: daily
tags: ["应用技巧", "OpenAI", "ChatGPT Work", "GPT-6 Astra"]
author: "Simon Willison"
---

### 结论

Simon Willison 用 **ChatGPT Work + GPT-6 Astra（Max）** 做了一件很具体的事：报出住址，要求用 **OSM（OpenStreetMap，开放街道地图）** 数据，规划从家出发再回家的 5K / 10K 跑步环线。Agent 跑了 **27 分钟**，交了嵌入式地图、可下载的 **GPX**（跑步手表 / App 用的轨迹格式）和 **GeoJSON**。路线对了；他更在意的是反面：ChatGPT 界面 **看不到它跑过的代码**，等他想要 Python 副本时，对话已经被 **compaction（压缩：把旧上下文摘要掉以腾出窗口）**，代码找不回来。他的判断：**不透明是反功能**；任何用 compaction 的 LLM 系统，都该保留压缩前原文，并让 Agent 工具还能读到。

### 要点

- **提示很短，约束很硬。** 原文几乎就一句：住址 + 5K/10K + 从家成环 + 用 OSM。没有让它「随便推荐几条好看的路」，所以交付物能对上验收：距离、成环、数据源。

- **它自己拼了一条地理流水线。** 事后追问时，Astra 说：用 **Nominatim**（OSM 的地理编码服务，把地址变成经纬度）定位住址；用 **Overpass**（按条件下载 OSM 道路、步道的查询接口）拉附近路网；再在本地算环线。这三步是 OSM 生态的常规组合，不是「模型凭印象画一条线」。

- **交付物是能用的文件，不只是一张图。** 除了嵌进对话的可视化，还有 GPX 和 GeoJSON。GPX 给手表 / 跑步 App，GeoJSON 给地图库。路线名叫 **El Granada harbor loop**，约 **5.1 km**，沿街道和 Coastal Trail 绕港口一圈。

- **可视化走 visualize skill，还受 CSP 白名单限制。** 它写了 `/workspace/el-granada-5k-share.html` 嵌进 ChatGPT。几何数据塞在页面里的 JSON，用 **D3** 从 jsDelivr 画图。**CSP（Content Security Policy，内容安全策略）** 只放行 `cdnjs.cloudflare.com`、`esm.sh`、`cdn.jsdelivr.net`、`unpkg.com` 以及 Google / Bunny 字体；别的 CDN 会静默失败。Simon 把这份 HTML 另存成了 [Gist](https://gist.github.com/simonw/ea652573c8ff5378b218cb10c8c5a480)。

- **压缩会吃掉你还没拷走的过程。** UI 本来就不展示它跑过的代码；再 compaction 一次，连「事后问要一份脚本」都失败。Simon 认为：用 compaction 的系统必须**保留压缩前文本**，并让后续工具调用还能读到——否则 27 分钟的地理计算只剩一张图，复现不了。

### 怎么做

面向会用 ChatGPT Work、也想让 Agent 做「带真实地理数据」任务的工程师：

1. **提示写成约束，不要写成愿望。** 一次写清：起点（住址或坐标）、必须成环、目标距离、数据源（OSM）。「帮我规划跑步路线」太软，模型容易用训练记忆补路，而不是去拉当地路网。

2. **第一轮就索要中间产物，不要等对话变长。** 提示里写：Overpass 查询、算环线的脚本、GPX / GeoJSON 立刻另存。Simon 是路线出来之后才问「你怎么做的」——界面本来就不展示代码，再被 compaction，脚本就没了。

3. **自己搭同类流水线时，按三步拆开验收。** Nominatim 只负责「地址 → 坐标」；Overpass 只负责「这块范围的路和步道」；环线在本地算。每步单独看输出：坐标对不对、路网空不空、环是不是真闭合、长度是不是 5K/10K。不要把三步糊进一个黑盒 Prompt。

4. **做可视化时按平台 CSP 选 CDN。** Work 的 visualize skill 只放行少数源。自己嵌地图时同样：D3 / 字体走白名单；路线几何内嵌，不要依赖临时外链。需要留下可复现工件时，像 Simon 那样把 HTML 拷到 Gist 或仓库。

5. **如果你在做带 compaction 的 Agent：压缩前文本必须可取回。** 实现上至少两件事：压缩前原文落盘；后续工具（包括「给我刚才的脚本」）能读到原文，而不是只读摘要。用户晚一问就不该等于证据销毁。

### 关键图表

![El Granada harbor loop 5.1 km：从港口出发沿街道和 Coastal Trail 成环](https://static.simonwillison.net/static/2026/5k-route.webp)
*Astra 交出来的 5.1 km 环线：El Granada harbor loop，沿 Carmel / Paloma / Coastal Trail 回到起点（Simon 原文截图）*
