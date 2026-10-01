---
title: "Cloudflare Auto Router：把模型选择交给网关，账单自己降"
description: "AI Gateway 公测 Auto Router：请求写成 cloudflare/auto，边缘分类器按任务难度选模型。内部知识工作评测成本约是 Sol 的 80%、Opus 的 35%；公测免费。"
url: "https://blog.cloudflare.com/auto-router"
source: "Cloudflare AI"
pubDate: 2026-09-30
edition: "2026-10-01"
editionType: daily
tags: ["应用技巧"]
author: "Ming Lu, Andreas Jansson, Harrison Harnisch"
---

### 结论

Cloudflare 在 **AI Gateway**（统一模型入口：请求先过网关，再转发到各家模型）上公测 **Auto Router**。把模型名写成 **`cloudflare/auto`**，网关会在边缘先判断「这是什么活、有多难」，再挑一个够用的模型——用户不用每次手选。他们用内部 OpenCode 对比只跑前沿模型（如 OpenAI Sol、Claude Opus），成本最高大约能少 **30%**。省钱的关键不是禁掉旗舰模型，而是**别为总结邮件这种活付 Opus 的价**。

### 要点

- **Auto Router 是组织级控制面，不是 IDE 里的那个 Router。** 本站写过 Cursor 按任务选模型。这里不同：公司里编码 Agent、非技术工作流、自建 Agent 的流量已经打进 AI Gateway，网关能看见每一条请求。预算和限额只能拦超支；路由器能在用户无感的情况下，把简单请求送到更便宜的模型。

- **先过滤候选，再分类，再打分。** 网关先丢掉不支持当前格式（比如带图但模型不看图）、没配密钥、触达限额、或上游不健康的模型。剩下的，把最近几轮对话交给跑在 **Workers AI**（Cloudflare 边缘 GPU 上的推理）上的多头分类器：14 类任务（编码、规划、调研、数据分析等），以及四个 1–5 分维度——**复杂度、歧义、利害、对前文依赖**。打分矩阵再叠上各模型的评测画像，公式可以记成：`效用 = 预期质量 − 自适应成本惩罚`。简单请求更看价格；难了就把成本惩罚放轻，强模型才排得上去。

- **内部知识工作评测：质量和 Sol 一个档，账单更低。** 97 道模拟办公题（邮件、日历、Slack、文件、差旅、财务），每题 3 次：`cloudflare/auto` 成功 **252/291（86.6%）**，总成本 **$2.10**；Claude Opus 5.5 是 **281/291（96.6%）/$5.91**；GPT-6 Sol 是 **245/291（84.2%）/$2.64**。按成功一次的成本算，Auto 大约是 Sol 的 **80%**、Opus 的 **35%**。官方也提醒：标价低的模型不一定最终更便宜——它可能吐更多 token 才做完。路由器优化的是**整段轨迹成本**，不是「每百万 token 谁最便宜」。

- **长会话要算缓存，不能每条请求都换模型。** Agent 调试时，**提示缓存**（同一模型复用已算过的上下文）往往比标价更影响账单。换模型等于丢掉缓存、整段上下文重写；多数模型也读不了另一家的推理 token。Auto Router 在同一轮（一次用户输入及其工具调用）里尽量钉住模型；跨轮才允许换，而且上下文越长，换模型的惩罚越大。文档要求带上 `cf-aig-session-id`，否则每条请求可能落到不同模型，缓存也复用不上。

- **公测免费；默认池是一组日常模型，可用请求头收窄。** 默认包括 Claude Fable / Opus / Sonnet 5、GPT-5.6 Luna / Sol / Terra、Grok 4.5。要用 Astra、GLM 等，得用 `cf-aig-allowed-models` 或 `cf-aig-allowed-providers` 显式放进池子。响应头 `cf-aig-routed-model` 和 `cf-aig-routing-reason` 能看出这次选了谁、为什么。后续还打算出只追质量、不算成本的 `cloudflare/auto-best`。

### 怎么做

面向已经有 Cloudflare 账号、或正在给团队统一出口的 junior：先把网关打通，再把模型名换成 `cloudflare/auto`。

1. **建一个 AI Gateway，配好各家密钥。** 没有网关，Auto Router 无处可挂。先让一条指定模型（例如 Luna）能从网关打通，再改自动路由——出问题才分得清是密钥、限额，还是路由器本身。

2. **请求里把模型改成 `cloudflare/auto`。** 走 [Unified API（OpenAI 兼容）](https://developers.cloudflare.com/ai-gateway/features/auto-router/)；Chat Completions 和 Responses 可用，WebSocket 还不行。公测期间路由器本身不收费。

```bash
curl -i -X POST \
  "https://gateway.ai.cloudflare.com/v1/$CLOUDFLARE_ACCOUNT_ID/$CLOUDFLARE_GATEWAY_ID/compat/chat/completions" \
  --header "cf-aig-authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{
    "model": "cloudflare/auto",
    "messages": [{"role": "user", "content": "用三句话总结这封邮件"}]
  }'
```

3. **看响应头，确认它真的在路由。** `cf-aig-routed-model` 是实际模型（如 `openai/gpt-5.6-luna`）；`cf-aig-routing-reason` 常见 `cost_optimal_within_pool`（质量/成本最优）。若总是 `forced_by_candidate_pool`，说明池里只剩一个模型，该查密钥和限额。

4. **多轮对话、编码 Agent 必须带会话头。** 每次请求加 `cf-aig-session-id`，让同一轮钉住模型、吃到提示缓存。OpenCode 一类客户端会自己加。要自己收窄池子：`cf-aig-allowed-providers: openai,anthropic`，或 `cf-aig-allowed-models: anthropic/*`（`*` 不能跨 `/`，不要只写一个 `*`）。安全组仍要 Opus 时，把旗舰留在池里，让路由器在高利害请求上升级，而不是在网关里一刀切掉。

5. **用 OpenCode 时当自定义模型接入。** 配好 `CLOUDFLARE_ACCOUNT_ID` / `GATEWAY_ID` / `API_TOKEN`，按[文档](https://developers.cloudflare.com/ai-gateway/features/auto-router/)加 `opencode.json`，模型选 Cloudflare Auto。需要看每次选了谁，可装 `@cloudflare/aig-opencode-plugin`（OpenCode ≥ 1.18.29），用 `/aig-show` 打印路由头。

6. **先拿真实杂活看账单，再决定要不要当默认。** 官方数字来自内部办公评测和 OpenCode：编码可以接近前沿，但 Opus 在那套题上成功率仍更高。从「总结、检索、短改」这类流量试一周，核对 `cf-aig-routed-model` 分布和 Gateway 账单；确认简单请求确实落到 Luna / Sonnet / Grok，再把组织默认模型改成 `cloudflare/auto`。

### 关键图表

![Auto Router：分类任务与难度，再按质量减价格给模型打分](https://blog.cloudflare.com/_emdash/api/media/file/01M3QZK8CSR7YG8VYE7QWJ3TY2.png)
*Cloudflare 原文：最近对话进分类器（14 类任务 + 四个难度维），对照模型档案打分后交给排名第一的供应商*
