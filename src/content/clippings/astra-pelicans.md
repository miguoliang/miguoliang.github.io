---
title: "鹈鹕骑单车对比图：Astra 各档推理比 Sol 全系更划算"
description: "Simon Willison 用 SVG 鹈鹕网格实测 GPT-6 Astra 与 Sol/Terra/Luna：画质跨档碾压，低价档已胜过 Sol max，且 token 更省。"
url: "https://simonwillison.net/2026/Sep/4/astra-pelicans"
source: "Simon Willison"
pubDate: 2026-09-04
edition: "2026-09-05"
editionType: daily
tags: ["应用技巧", "OpenAI", "模型选型", "推理档位"]
author: "Simon Willison"
---

### 结论

Simon Willison 拿到 **GPT-6 Astra** 后，用同一提示让各模型生成「鹈鹕骑单车」的 **SVG**，并按 **low / medium / high / xhigh / max** 推理档位排成对比网格，同时对照 **GPT-5.6 Sol、Terra、Luna**。结果不只是好玩：**Astra 从低档到高档的画质全面优于 Sol 任意档位**；按单次任务成本算，**Astra low（约 9.55 美分）已好过 Sol 全系**。选模型时别只看标价倍数，还要看**实际消耗 token 数**和**低档是否够用**。

### 要点

- **推理档位（reasoning level）** 是 OpenAI 部分模型上的参数，控制模型在生成前「多想几步」。Astra 不支持 `reasoning=none`，最低从 low 起；对比时应在**同一提示、同一输出格式**下扫齐各档，否则容易把「模型差异」和「提示差异」混在一起。

- **画质差距肉眼可见，且低档 Astra 已领先上一代旗舰。** Sol 最好的 xhigh 鹈鹕仍像抽象几何块；Astra 从 low 到 xhigh 每一张都更清晰。max 档细节最好，但非 max 档偶发「鹈鹕两条腿没分在画面两侧」——说明**最高档不是唯一解**，要看任务容错。

- **标价贵一倍，账单未必贵一倍。** Astra API 约 **$10/M 输入、$50/M 输出**，Sol 约 **$5/$30**，名义价约 2×；但同任务下 Astra **各档输出 token 明显更少**，拉平实际价差。算成本要用「美元/次成功任务」，不能只用百万 token 牌价。

- **输入 token 数暴露模型族谱线索。** 同一提示下 Astra 与 Luna 均约 **16** 个输入 token，Sol 与 Terra 约 **26**。Simon 推测 Astra 与 Luna 在 tokenizer 或提示处理上可能更近——你做**多模型路由**时，若发现某两家行为像，可合并评测样本，少做重复实验。

- **10 美分预算的选型结论很直白。** 花约 10 美分，Astra low 的 SVG 质量胜过任意 Sol 档位；继续加钱上 Sol max 仍不如 Astra 入门档。对「要可读图形 / 结构化输出」类任务，**先试 Astra low，再按需升档**，比默认绑死旧旗舰更合理。

### 怎么做

1. **定一个可目视判定的探针任务。** 复制 Simon 的思路：选一个**输出格式固定、好坏一眼能分**的用例（SVG、简单 UI 草图、Mermaid 等），写死提示词，禁止模型自由发挥无关细节。

2. **扫齐推理档位并留档。** 对 Astra 依次调 `low → medium → high → xhigh → max`（若 API 支持），Sol/Terra/Luna 用可比档位；保存**原图、token 用量、美元成本**三列，方便和团队对齐。

3. **用网格而不是单张截图汇报。** 把同提示、多模型、多档位排成一张表（行=模型，列=档位），评审时先问「低档是否已达标」，再决定要不要为 max 买单。

4. **算总账时乘上 token，不是只乘牌价。** 记录每次 `input_tokens`、`output_tokens`，用官方价目表算单次成本；若 Astra 少吐 30% token，2× 牌价可能只变成 1.3× 实付。

5. **生产路由先 low 后升档。** 图形/结构化生成类任务：默认 **Astra low**；出现明显结构错误（如构图缺元素）再升到 high/max。编码 Agent 仍按你业务 benchmark 测，但别假设「新旗舰必须全程 max」。

### 关键图表

![GPT-6 Astra 与 GPT-5.6 Sol/Terra/Luna 各推理档位的鹈鹕 SVG 对比网格](https://static.simonwillison.net/static/2026/astra-grid-3.webp)

*同一提示下的跨模型、跨档位画质与成本对照——低档 Astra 已全面胜过 Sol 任意档（图源：Simon Willison）*
