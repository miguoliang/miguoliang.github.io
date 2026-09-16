---
title: "Gemini Live audio：零库浏览器里试 Gemini 3.8 语音对话"
description: "Simon 用 GPT-6 Astra Extra High 对照文档写出网页工具：选模型与音色，经 WebSocket 直连 Gemini 3.8 Live，说话时可打断。"
url: "https://simonwillison.net/2026/Sep/15/gemini-live"
source: "Simon Willison"
pubDate: 2026-09-15
edition: "2026-09-16"
editionType: daily
tags: ["应用技巧", "Gemini", "WebSocket", "语音"]
author: "Simon Willison"
---

### 结论

Google 当天发布了 **Gemini 3.8 Live** 和 **Gemini 3.8 Live Extended Thinking**：两个 **speech-to-speech**（语音进、语音出）模型，形态接近 OpenAI 的 [GPT-Live](https://openai.com/index/introducing-gpt-live/) 家族。Simon Willison 把文档交给 **GPT-6 Astra Extra High**，让它写出网页工具 [Gemini Live audio](https://tools.simonwillison.net/gemini-live)：选模型、选音色预设、可选 system prompt，然后在浏览器里开语音会话，**模型还在说时也能打断**。实现**不引任何库**——直连 Google 的 `BidiGenerateContent` WebSocket，采集和播放都走浏览器自带的 Web Audio **`AudioContext`**。

### 要点

- **这是原生语音对话，不是「先转写再合成」。** speech-to-speech 的意思是：麦克风音频进模型，模型直接回音频。传统做法往往是 ASR（语音转文字）→ LLM 写回复 → TTS（文字转语音）三级串联；Live 把这条链路收进同一个会话，延迟更低，也才能自然地**打断（barge-in）**——你一插话，当前播放停掉。

- **两个模型分工不同。** 工具里默认是 `gemini-3.8-live`（快、适合闲聊）；另一个是 `gemini-3.8-live-extended-thinking`（复杂问题可以边说边在后台继续推理）。Simon 原文把它们和 GPT-Live 放在同一形状：都是「浏览器/客户端对着一条实时通道说话」，而不是普通的一次性 `generateContent` HTTP 调用。公告见 [Google 发布稿](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-live-gemini-3-8-live-extended-thinking/)。

- **Astra Extra High 对着文档就能交出可点的 demo。** 他没有自己手写协议，而是把发布稿和 Live API 文档丢给 GPT-6 Astra Extra High，得到单文件 HTML（[Gist 记录](https://gist.github.com/simonw/067b7430c5b1f743af9419b0184c38ef)、源码在 [gemini-live.html](https://github.com/simonw/tools/blob/main/gemini-live.html)）。对 junior 的启发是：新 API 的最短路径常常是「文档 + 旗舰模型 + 单页原型」，而不是先搭一整套 SDK 脚手架。

- **零库 = 浏览器直连 Google，密钥会经过你的页面。** 连接地址是 `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=...`。**WebSocket** 是一条长连接：同一条通道上双向推 JSON（setup、音频块、转写、打断）。因为没有后端代理，Gemini API Key 在浏览器里使用——适合自己试用，不适合把 Key 嵌进公开站点给陌生人用。

- **打断既可以用嘴，也可以打字。** 截图里他先问加州褐鹈鹕，模型说到一半被标成 Interrupted，他改口「说点别的」；底部提示写明：发送文字消息会打断当前回复。戴耳机是为了减少扬声器回灌麦克风造成的回声。

### 怎么做

面向想先听一听、再决定要不要自己接 Live API 的工程师：

1. **准备一把 Gemini API Key。** 打开 [Google AI Studio](https://aistudio.google.com/apikey) 创建。这把 Key 会作为 WebSocket URL 的查询参数发给 Google，不要提交到仓库，也不要分享带 Key 的链接。

2. **打开** [tools.simonwillison.net/gemini-live](https://tools.simonwillison.net/gemini-live)。填 Key；选 `gemini-3.8-live` 或 Extended Thinking；音色预设有 Puck / Kore 等；需要人设时展开 Instructions，写入 system prompt。可选勾选「把 Key 记在本机浏览器」。

3. **点 Start session，允许麦克风。** 戴耳机。状态变成 Listening 后直接说话；中间想改口，开口或在「Or type a message…」里打字发送即可打断。结束用 End session；转写可 Download transcript。

4. **要自己接协议，从官方 WebSocket 教程起步。** Simon 指向 [Get started with Gemini Live API using WebSockets](https://ai.google.dev/gemini-api/docs/live-api/get-started-websocket)。流程是：连上 `BidiGenerateContent` → 第一条消息发 `setup`（模型、`responseModalities: ["AUDIO"]`）→ 之后用 `realtimeInput` 推 PCM 音频（16 kHz、16-bit）或文字 → 从 `serverContent` 里取回音频和转写。采集/播放用 `AudioContext`，不必先装 `@google/genai`。

5. **公开产品不要把长期 Key 放进前端。** 这个工具是试用页。正式服务应把密钥留在服务端，或按文档改用短时 **ephemeral token**；浏览器页只负责麦克风和播放。

### 关键图表

![Gemini Live audio 网页：会话中可打断，转写里褐鹈鹕回答被标为 Interrupted](https://static.simonwillison.net/static/2026/gemini-live-tool.webp)
*Simon 原文截图：Start / End / Mute、麦克风电平和转写；模型说到一半被打断后改口问「说点别的事实」*
