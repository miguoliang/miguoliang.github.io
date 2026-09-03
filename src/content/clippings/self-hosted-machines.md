---
title: "在你管理的机器上运行云 Agent"
description: "Cursor 云 Agent 可把工具执行放到你内网的 Self-Hosted Machines：推理在云端，命令在本地跑，Worker 主动出站连接，无需开入站防火墙。"
url: "https://cursor.com/blog/self-hosted-machines"
source: "Cursor"
pubDate: 2026-09-02
edition: "2026-09-03"
editionType: daily
tags: ["应用技巧", "Cursor"]
author: "Jack Pertschuk"
---

### 结论

Cursor 云 Agent 现在可以把**工具执行**放到你自管的机器池（Self-Hosted Machines）里，而推理、规划和 Agent 循环仍在 Cursor 云端。你管基础设施和网络边界，仍从桌面、网页、Slack、GitHub 等入口启动 Agent。适合需要直连内网 Git、私有服务、GPU/Mac 构建，或现有 OS/流水线难以打成 Cloud Agent build 的团队。

### 要点

- **默认不变，按需切换。** Cursor 托管 VM 仍是默认：每台会话独占 VM，有隔离、密钥脱敏、出口控制和签名提交。只有满足内网访问、定制硬件或特殊构建环境等条件时，才值得上 Self-Hosted。

- **只搬执行层，不搬大脑。** 自管机器持有代码副本、改文件、跑 shell；云端负责推理与规划，把 tool call 下发给 Worker，结果回传做下一轮推理。工具输出可能含代码，会话记录也可能由 Cursor 处理存储——合规评审时要算进数据流。

- **Worker 主动连出，无需入站。** 在机器上装 Cursor CLI，执行 `agent worker start`，建立长期出站 HTTPS。Cursor **不会**主动连进你的内网，对防火墙友好。

- **两种接入形态。** **My Machines**：单台笔记本或 VM，适合个人。**Pools**：命名 Worker 队列，供团队/企业共享；有请求就扩容、空闲后缩容，不必常驻固定台数。

- **池可按需伸缩，还能休眠。** Controller 盯队列，用你的 spawn 脚本拉起机器；空闲可设超时释放，也可用**休眠**：快照后停机，跟进任务在重连窗口内可秒级恢复工作区，否则换新机。

- **不必自建沙箱。** 可与 AWS Lambda、Cloudflare、Coder、Daytona、E2B、Modal、Namespace、Vercel 等集成，在已有沙箱里起 Worker。Linux Worker 现已支持 **computer use**（装 Chrome/Chromium 后可点页面、截图），Mac 仍适合 iOS/macOS 构建。

### 怎么做

1. **先判断要不要自托管。** 问自己：Agent 是否必须在内网访问源码仓、内部 API 或私有依赖？是否需要 GPU、真 Mac 或 K8s 等 Cursor 托管 VM 给不了的资源？现有环境是否很难固化成 [Cloud Agent build](https://cursor.com/docs/cloud-agent/builds)？三条里有一条为「是」，再往下看。

2. **单机试水：My Machines。** 在一台可信机器上安装 Cursor CLI，登录账号后运行 `agent worker start`，保持进程常驻。从 Cursor 发起云 Agent 任务，确认能 clone、build、test。

3. **团队落地：建 Pool。** 按 [官方文档](https://cursor.com/docs/cloud-agent/self-hosted) 创建命名池，编写 spawn 脚本（对接你选的沙箱或 VM 编排），让 Controller 在队列积压时自动起 Worker。配置 idle timeout 与是否保留工作区。

4. **选好沙箱伙伴。** 若已在用某家沙箱，优先走其 Cursor 集成（如 Lambda MicroVM 快照启停、Vercel Sandbox 按任务隔离），避免从零写隔离层。

5. **安全与合规自检。** 明确哪些代码/日志会出内网到 Cursor 云端；限制 Worker 能访问的网络与密钥范围；需要 UI 验证时安装 computer use 依赖，并在 Cursor 里可直接观看或接管桌面。

6. **验证后再扩面。** Cursor 内部已有超六成合并 PR 来自云 Agent——自托管是把同一套能力搬进你的环境，先小池跑通一条真实仓库流水线，再扩大并发。

### 关键图表

![Cursor Agent 循环在云端，工具执行在你内网的 Worker 上](https://ptht05hbb1ssoooe.public.blob.vercel-storage.com/assets/blog/cursor-agent-loop-light-GMamDuzZU5LzYrpQOhRxRwBvrbhRFg.png)

*推理与规划留在 Cursor 云；Worker 出站连接，在内网执行读写文件、跑命令，结果回传驱动下一轮推理*
