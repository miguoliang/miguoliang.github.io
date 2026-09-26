---
title: "LFM2.5-VL-DSpark：视觉语言模型也能投机解码，端侧 decode 最高 3.13×"
description: "Liquid AI 给 LFM2.5-VL-3B 配了约 280M 的 DSpark 草稿模型。decode 最高 3.13×，端到端最高 2.62×；输出不变，但看图和 prefill 仍占墙钟时间。"
url: "https://huggingface.co/blog/LiquidAI/lfm2-5-vl-dspark"
source: "Hugging Face Blog"
pubDate: 2026-09-24
edition: "2026-09-26"
editionType: daily
tags: ["应用技巧", "行业趋势"]
author: "Yuri Khrustalev, vivianamarquez / Liquid AI"
---

### 结论

Liquid AI 在 Hugging Face 发了 [LFM2.5-VL-DSpark](https://huggingface.co/blog/LiquidAI/lfm2-5-vl-dspark)：给 3B 视觉语言模型 **LFM2.5-VL-3B** 配了一个实验性 **DSpark 草稿模型（draft model）**。**投机解码（speculative decoding）** 是：小模型先猜接下来几个 token，大模型再一次性验收。草稿大约 **280M 参数**，只比 3B 目标模型多 **8.9%** 体量；decode 最高 **3.13×**（Apple M5 Max + MLX），端到端最高 **2.62×**。目标模型逐 token 验收，贪婪解码下输出和单跑目标模型一样。

### 要点

- **VLM 也能走同一套投机解码。** 视觉语言模型（VLM）会先把图像切成 patch，再和文字一起送进语言模型。DSpark 抽的是目标模型若干层的 **hidden state**（隐藏状态向量）。图和字投影到同一维度之后，草稿模型看到的只是向量，不再区分模态。推理算法和他们刚发的文本版 LFM2.5-DSpark 相同。

- **草稿很小：4 层注意力 + Markov 头，训练 block size 9。** 消融后他们定了 4 层、训练时一次猜 9 个 token。参数拆开大约是：解码栈 193.0M、hidden-state 投影 21.0M、Markov 头 65.5M，合计 **279.5M**。推理时按硬件用 block size **8 或 9**（Apple silicon 用 8，H100 上 SGLang 用 9）。

- **加速发生在 decode，不在「看图」。** 按 MMSpec 六类任务（通用 VQA、文字 VQA、图像描述、图表问答、复杂推理、多轮对话）：M5 Max + MLX 的 decode 为 2.30×–3.13×、端到端 1.56×–2.62×；M3 Ultra + llama.cpp 为 1.57×–2.14× / 1.30×–1.77×；H100 + SGLang 为 2.04×–2.66× / 1.64×–2.27×。每次验收大约收下 3.2–4.5 个草稿 token。数字全是 16-bit，量化加速不在这次范围。

- **端到端跑不赢 decode，是 Amdahl 定律。** VLM 先过视觉编码器，再让语言模型消化几百个视觉 token，这整段叫 **prefill**（生成第一个 token 之前的计算）。投机解码只加快后面逐 token 的 **decode**。边缘设备算力弱，prefill 占墙钟时间的比例更大，所以 decode 快了两三倍，整次请求可能只快一倍出头。

- **温度升高会掉接受率，从而掉吞吐。** 温度为 0 时双方更常猜中同一个 top token。升温后概率摊开，草稿和目标更容易意见不合，白猜的次数变多。匹配采样设置下，输出分布仍等于目标模型本身——变慢，不变味。并发升高时 decode 会从内存瓶颈转向算力瓶颈，DSpark 仍有吞吐优势，但差距会收窄。

- **第一天就能接到现有推理栈。** llama.cpp、MLX-VLM、SGLang 都有 LFM 兼容的 DSpark 集成。权重在 Hugging Face，Safetensors 和 GGUF 都有。草稿的 embedding / LM head 绑在目标模型上，必须和对应的 LFM2.5-VL-3B 配对，不要拿文本家族的 2.6B 草稿去顶。

### 怎么做

面向已经在本机或单卡上跑 LFM2.5-VL-3B、想先把生成阶段加快的工程师：

1. **先确认你卡在 decode，而不是看图。** 看一次请求的 time-to-first-token。若大部分时间花在视觉编码和 prefill，挂上 DSpark 也救不了「第一张图出来很慢」。输出很长、多轮对话时，decode 占比高，收益才明显。

2. **按硬件选栈，并配成对的草稿。** GPU 用 [SGLang](https://github.com/sgl-project/sglang)（文中对应 [PR #40651](https://github.com/sgl-project/sglang/pull/40651)，模型卡写 v0.5.19+）；Apple silicon 用 [MLX-VLM](https://github.com/Blaizzy/mlx-vlm)（[PR #2280](https://github.com/Blaizzy/mlx-vlm/pull/2280)，模型卡写 v0.7.2+）；本机 GGUF 用 [llama.cpp](https://github.com/ggml-org/llama.cpp)（[PR #29339](https://github.com/ggml-org/llama.cpp/pull/29339)）。目标是 [`LiquidAI/LFM2.5-VL-3B`](https://huggingface.co/LiquidAI/LFM2.5-VL-3B)，草稿是 [`LiquidAI/LFM2.5-VL-3B-DSpark`](https://huggingface.co/LiquidAI/LFM2.5-VL-3B-DSpark)；GGUF 则配 [`LFM2.5-VL-3B-GGUF`](https://huggingface.co/LiquidAI/LFM2.5-VL-3B-GGUF) 和 [`LFM2.5-VL-3B-DSpark-GGUF`](https://huggingface.co/LiquidAI/LFM2.5-VL-3B-DSpark-GGUF)。

3. **SGLang**（H100 上他们用 block size 9）：

```bash
python -m sglang.launch_server \
  --model-path LiquidAI/LFM2.5-VL-3B \
  --speculative-algorithm DSPARK \
  --speculative-draft-model-path LiquidAI/LFM2.5-VL-3B-DSpark \
  --speculative-draft-attention-backend flashinfer \
  --speculative-dspark-block-size 9 \
  --disable-radix-cache
```

然后打 `http://localhost:30000/v1` 的 OpenAI 兼容接口。对比基线：去掉三条 `--speculative-*` 即可。

4. **MLX-VLM**（Apple silicon 用 block size 8）：

```bash
mlx_vlm.server --model LiquidAI/LFM2.5-VL-3B --draft-model LiquidAI/LFM2.5-VL-3B-DSpark
```

模型卡上的单次生成示例还要加 `--draft-block-size 8 --temperature 0`：当前 MLX-VLM 的 DSpark 走贪婪采样。

5. **llama.cpp**：博客给了本地路径示例（`-m` / `--mmproj` / `-md`）。官方 GGUF 卡写成从 Hub 拉成对权重，Apple silicon 把 `--spec-draft-n-max` 设为 8：

```bash
llama-server -hf LiquidAI/LFM2.5-VL-3B-GGUF:F16 \
  -hfd LiquidAI/LFM2.5-VL-3B-DSpark-GGUF:F16 \
  --spec-type draft-dspark --spec-draft-n-max 8 --spec-draft-n-min 0 \
  -ngl 99 -ngld 99 -fa on
```

6. **用 timings 看接受率，不要只看「好像快了」。** 贪婪解码下输出应和单跑目标模型一致。响应里的 `draft_n` / `draft_n_accepted`（或 llama.cpp 的 timing）告诉你每轮验收收了几个草稿 token。升温、换任务后再对这个数，再谈吞吐。这次发布的测速都是 16-bit。

### 关键图表

![DSpark 给视觉语言模型做投机解码：目标模型的 hidden state 注入草稿模型，一次平行猜一块 token](https://cdn-uploads.huggingface.co/production/uploads/644249b08443bce4c9890a0f/P7UX63U74cbjMWDapPjFm.png)
*Liquid AI / Hugging Face 原文 Figure 1：图和字先投影到同一套 hidden state，草稿模型不再区分模态，推理算法与文本 DSpark 相同*
