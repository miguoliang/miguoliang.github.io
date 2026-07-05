---
name: ai-clip-authoring
description: >-
  Author and edit AI 网摘 clippings for miguoliang-site (Astro). Covers content
  scope, pyramid-style Chinese writing for junior engineers, single-diagram
  rules, mermaid/source images, frontmatter schema, and build/link validation.
  Use when adding or editing clippings, 网摘, 摘抄, clip pages, or AI article
  summaries on this site.
---

# AI 网摘内容规范（miguoliang-site）

## 站点定位

- **品牌**：AI 网摘 · 应用技巧 · 行业趋势
- **收录范围**：AI **应用技巧**、**行业趋势**（产品/工程/商业观察）
- **不收录**：学术论文、纯理论、无实践指向的研究
- **语言**：**仅中文**。不要双语对照，不要 `## 原文` 英文栏
- **来源链接**：frontmatter `url` + 页面/卡片上显示 **「来源」**（不是「原文」）

## 内容结构（金字塔 + Junior 可读）

正文**不要**用 `## 导读` / `## 摘要` 作总标题。直接从下面四层开始（均为 `###`）：

```markdown
### 结论
[2–3 句：先给答案，说明为什么重要]

### 要点
- **判断句。** 展开说明：术语是什么、常见误区、简短例子
- …（3–5 条，每条「加粗结论 + 解释」）

### 怎么做
[分步写清做什么、为什么、注意什么；面向 junior engineer]

### 关键图表
[每篇尽量一张图；图注说明图在论证什么]
```

可选：`## 正文` —— **仅当**有导读未覆盖的补充材料时才加；否则省略（页面不渲染空正文区）。

### 叙述原则

| 要 | 不要 |
|----|------|
| 结论先行，论据支撑 | 同一意思在表、要点、正文里重复三遍 |
| 解释术语（diff、Linter、增强型 LLM…） | 极简短语堆砌，junior 读不懂 |
| 一张图说清就不放第二张 | 流程图 + 时序图画同一件事 |
| 可执行的「怎么做」 | 车轱辘话、空话 |

### 配图规则

1. **原文有关键图** → 保留外链（优先 CDN 直链），一张或少量真正关键的即可
2. **原文无关键图** → 从正文提炼 **一张** Mermaid（flowchart / sequence / activity），必须 make sense
3. Mermaid 写法：正文里用 ` ```mermaid ` 代码块；构建链路由 `astro-mermaid` + `src/lib/markdown.ts` 的 `preprocessMermaid` 处理

## Frontmatter

路径：`src/content/clippings/<slug>.md`

```yaml
---
title: "文章标题"
description: "列表卡片用的一句话，说清价值"
url: "https://..."          # 必须可访问，构建会校验
source: "来源名"
pubDate: 2026-07-05
edition: "2026-07-05"       # 日刊 YYYY-MM-DD；周刊 YYYY-wNN
editionType: daily          # daily | weekly
tags: ["应用技巧", "..."]
author: "作者或机构"
---
```

## 技术要点（改代码时）

| 项 | 位置 |
|----|------|
| 集合 schema | `src/content/config.ts` → `clippings` |
| 正文解析 | `src/lib/clipping-body.ts` → `splitClippingBody()` |
| 渲染 | `ClipDigest.astro`（主内容）、`ClipArticle.astro`（仅有 `## 正文` 时） |
| 详情页 | `src/pages/clip/[...slug].astro` |
| 链接校验 | `scripts/check-clipping-links.mjs`；`npm run build` 会先跑校验 |
| 搜索 | Pagefind，`data-pagefind-body` 标记 |

## 新增一篇网摘的检查清单

```
- [ ] url 真实可访问（npm run check:links）
- [ ] 范围属于应用技巧或行业趋势，非学术论文
- [ ] 结构：结论 → 要点 → 怎么做 → 关键图表（无「导读」标题）
- [ ] 全文中文，无 ## 原文
- [ ] 关键图表 ≤ 1 张（原图或 Mermaid 二选一为主，不重复）
- [ ] 面向 junior：术语有解释，步骤可跟做
- [ ] description 可用于首页/日刊卡片
- [ ] npm run build 通过
```

## 不要破坏的存量

- `public/apps/good-family/privacy-policy.html`（和谐家庭隐私政策，独立 URL，勿删改除非用户要求）

## 示例

完整范文见 [examples.md](examples.md)。

## 每日自动发现（白名单）

不用手找源时，用仓库内置发现流程。

### 白名单配置

`config/clip-sources.json`

- `sources[]`：每个源含 `name`、`rss` 或 `listingUrl`+`urlPrefix`、`tags`、`enabled`
- `excludeUrlPatterns` / `excludeTitlePatterns`：过滤论文、arxiv 等
- `lookbackDays`：只捞最近 N 天
- 改白名单后无需改代码；`enabled: false` 可临时关闭某源

### 本地发现

```bash
npm run discover:clips              # 终端摘要
node scripts/discover-clips.mjs --markdown   # Issue 正文格式
```

### GitHub Actions（已配置）

工作流 `.github/workflows/discover-clips.yml` 每天 **09:00 UTC+8** 跑发现脚本。有新候选且没有未关闭的 `clip-candidate` Issue 时，自动开 Issue 列出链接。

**在 App 里摘抄**：打开当日 Issue，说：

> 按 ai-clip-authoring skill，把 Issue 里第 1 篇写成今日日刊

Agent 读 skill + 抓原文 + 写 `src/content/clippings/<slug>.md` + `npm run build`。

### 可选：Cursor Automation

在 Cursor App 建每日定时 Automation（cron `0 9 * * *` 北京时间需在编辑器选每天 9:00）：

1. 检出 `miguoliang/miguoliang.github.io` main
2. 读 `.cursor/skills/ai-clip-authoring/SKILL.md`
3. 跑 `npm run discover:clips:json`，选**未收录**且最贴合「应用技巧/行业趋势」的一篇
4. 撰写网摘、校验链接、`npm run build`
5. 开 PR（标题 `clip: <slug>`），不要直接推 main

若发现脚本失败，检查 `config/clip-sources.json` 里对应源的 RSS/列表页是否仍有效。
