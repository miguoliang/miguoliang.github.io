---
title: "Mermaid 转终端 Unicode 框图（grok-mermaid）"
description: "Simon Willison 把 Grok CLI 里的 Rust Mermaid 渲染器编译成 WebAssembly，浏览器里实时把流程图变成可复制的终端框线字符。"
url: "https://simonwillison.net/2026/Jul/16/grok-mermaid"
source: "Simon Willison"
pubDate: 2026-07-16
edition: "2026-07-16"
editionType: daily
tags: ["应用技巧", "Mermaid", "WebAssembly", "Grok"]
author: "Simon Willison"
---

### 结论

xAI 开源的 Grok CLI 里藏了一个用 Rust 写的 Mermaid **终端渲染器**（`mermaid.rs`），能把流程图等画成 Unicode 框线字符，而不是 SVG。Simon Willison 把它编译成约 163 KB 的 WebAssembly，做成在线工具 [grok-mermaid](https://tools.simonwillison.net/grok-mermaid)：**在浏览器里编辑 Mermaid 源码，立刻得到可粘贴进 README、Slack 或终端的 ASCII/Unicode 框图**，布局逻辑完全在 Rust 里，没有 JavaScript 重实现。

### 要点

- **Mermaid 通常走 SVG/Canvas。** 你在文档、Notion 或本站点里看到的 Mermaid 多是矢量图。Grok CLI 走的是另一条路：用 `┌─┐│` 这类字符拼出「终端风格」的框图，适合纯文本环境（issue 评论、日志、SSH 会话）。

- **源码来自 grok-build，不是从零写。** 模块位于 `crates/codegen/xai-grok-markdown/src/mermaid.rs`，自述为「自包含的 Mermaid 终端渲染器」。Simon 在逛 Grok CLI 代码库时发现它，觉得值得搬到浏览器里试一把。

- **WebAssembly 的意义是「同一套渲染器，两个运行时」。** 终端里怎么排版，浏览器里就怎么排版——WASM 直接调用 Rust 导出的 `wasm_render_html()`，返回带 CSS class 的 HTML 片段（边框、节点、边标签分色），前端只负责展示和复制。

- **支持的图类型有边界。** 流程图、时序图、状态图、类图、ER 图能正常渲染；饼图等未支持类型会**降级**为带边框的源码列表，不会静默画错。

- **宽度是硬约束。** 渲染器不会为了塞进窄屏而重排布局；若框图比 `Max width` 更宽，就换用源码 fallback。手机窄屏开「Fit output panel」时，复杂图更容易触发这一行为——桌面或调大列宽更稳。

### 怎么做

1. **打开工具** [tools.simonwillison.net/grok-mermaid](https://tools.simonwillison.net/grok-mermaid)，顶部有 Flowchart、Sequence 等示例按钮，可一键载入对照。

2. **在文本框里写或粘贴 Mermaid 源码**（与 [mermaid.js.org](https://mermaid.js.org/) 语法相同），编辑后自动重渲染。

3. **按需设 Max width**：`Fit output panel` 按输出区宽度算列数；固定 80/100/120/160 列适合对齐终端或固定版式文档；`Unlimited` 看完整大图。

4. **Copy as text** 复制纯文本框图；**Copy link to this diagram** 把当前源码编码进 URL，方便分享可还原的链接。

5. **想自建或改 UI**：Simon 用 Claude Code for web（Fable 5）提需求，改动在 [simonw/tools PR #293](https://github.com/simonw/tools/pull/293)；WASM 由 `grok-mermaid/` 目录下的构建脚本从 grok-build 的 `mermaid.rs` 编译，Apache 2.0 许可。若你也在做「读开源 CLI → 抽小组件 → WASM 上云」类实验，可直接 fork 该目录当模板。

### 关键图表

![grok-mermaid：左侧 Mermaid 源码，右侧 Unicode 框线渲染，含宽度与复制控件](https://static.simonwillison.net/static/2026/grok-mermaid-wasm.png)

*同一套 Rust 渲染器：终端与浏览器输出一致——适合需要纯文本框图的 README、聊天与日志场景*
