#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const candidate = JSON.parse(readFileSync(join(process.cwd(), 'data/daily-candidate.json'), 'utf8'));

const prompt = `你是 miguoliang.com「AI 网摘」的自动编辑。请在本仓库完成今日网摘，使用 Cursor 模型能力，不要调用外部 Claude/OpenAI API。

## 必读
1. 阅读并严格遵守 \`.cursor/skills/ai-clip-authoring/SKILL.md\`
2. 候选文章见 \`data/daily-candidate.json\`

## 今日候选
- 标题：${candidate.title}
- 来源：${candidate.source}
- URL：${candidate.url}
- 建议标签：${(candidate.tags ?? []).join(', ')}
- 日刊 edition：${candidate.edition}

## 任务（只做这些）
1. 打开候选 URL，理解原文（应用技巧或行业趋势，不要写成学术论文）
2. 新建 \`src/content/clippings/<slug>.md\`（slug 从 URL 推导，避免与已有文件冲突）
3. 按 skill 写完整中文网摘：### 结论 → ### 要点 → ### 怎么做 → ### 关键图表（每篇尽量一张图）
4. frontmatter 的 url 必须是：${candidate.url}
5. 运行 \`npm run check:links\` 确保链接有效

## 禁止
- 不要创建 git commit / push（CI 会处理）
- 不要改无关文件
- 不要双语、不要 ## 导读 / ## 原文
- 不要啰嗦重复

完成后用一句话说明写入了哪个文件。`;

process.stdout.write(prompt);
