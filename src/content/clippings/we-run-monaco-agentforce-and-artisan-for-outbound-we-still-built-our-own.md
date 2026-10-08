---
title: "SaaStr：90% 外呼仍买厂商，只给头部客户自建「AI ABM」写可核对的方案"
description: "Jason Lemkin：Monaco / Artisan / Agentforce 跑放量；10K 用未进 Salesforce 的一方数据，给少量头部客户写对方能核对的定制赞助方案。续约定制 deck 从约 5 份到 20–30 份。"
url: "https://www.saastr.com/we-run-monaco-agentforce-and-artisan-for-outbound-we-still-built-our-own-ai-abm-tool-for-our-top-accounts"
source: "SaaStr"
pubDate: 2026-10-07
edition: "2026-10-08"
editionType: daily
tags: ["应用技巧", "SaaS"]
author: "Jason Lemkin"
---

### 结论

SaaStr 创始人 **Jason Lemkin** 写的是他们自己怎么做赞助销售外呼，不是再发一篇「AI SDR 替代销售」的口号。SaaStr AI 已经在用多家现成工具：Monaco 跑冷外呼（当天约到 Anthropic 对的买家），Artisan 跑暖外呼并贡献了他们说的数百万成交，Agentforce 做赢回（打开率 72%），Qualified 上的入站 Agent 过去一年关了 **$2M+**。内部 AI 营销/收入副总裁 **10K** 用这些工具比任何同事都勤。他们打算继续买。真正新造的，是 10K 里一层很薄的 **「AI ABM」**（account-based marketing，针对少数重要客户做一对一触达）：用**从未同步进 Salesforce 的一方数据**写定制赞助方案，只给一小批头部客户。放量那 **90%** 仍走厂商。Lemkin 的判断：**量层继续租；只有你自己有、对方还能当场核对的事实，才值得自建。**

### 要点

- **外呼的基础设施不要自己造。** 放量外呼要解决的是投递进收件箱、序列、回复处理、约会议、名单卫生和保护域名。Monaco、Artisan、Agentforce、Qualified 在这些问题上砸了多年工程和成千上万客户。SaaStr 有 **45 万**联系人库，把投递基础设施交给 Agent 重做，是在浪费它和人的时间。只要是放量动作，就由厂商跑。

- **厂商通常只能看见 CRM 里的一小块。** 典型 AI SDR 接到 CRM，读到联系人、客户，也许还有活动记录。SaaStr 对一家公司的了解至少散在六套系统里：Salesforce（合同、赞助史、负责销售、LTV）、Bizzabo（谁来过 SaaStr AI Annual、来了几次、胸牌扫描、实际线索数）、Marketing Cloud（团队里谁订了 Newsletter、打开和点击了什么）、WordPress（他们写过哪些提到这家公司的文章）、播客档案（20VC x SaaStr 或 The Agents 里出现过几次）、Momentum 和 Qualified（通话和聊天）。没有一家外呼厂商会为单一客户把这六套全接上。Salesforce 还宣布要用 Flex Credits 给 Agent 的 API 调用计费；10K 自己每天已经打大约 **3.5 万**次 Salesforce API。对每个潜客做深读，厂商成本会越来越高。他们够用的邮件，厂商仍然写得好。

- **自建层写的是对方能核对的事实，不是「贵司这样的公司」。** 10K 的 Prospecting 页有参会查询和门票跟进；给新赞助商主要用 **Pitch Generator**。输入公司名，它拉 Salesforce 历史、参会和 Newsletter，写出定制方案，里面可以包括：他们团队谁来过 Annual、来了几次；哪些高管订了并在读 Newsletter；以前是否赞助过、什么级别、当时 ROI；博客和播客里写过、说过他们什么。厂商常见写法是「像你们这样的公司赞助 SaaStr，是为了触达 B2B 高管」。10K 的版本能写出去年他们来了多少人、哪位领导在读 Newsletter、上次赞助的线索长什么样。每一条都关于这家公司，对方可以去对。

- **同一套路已经在续约侧验证过。** Amelia 在 10K 上大约半天做出续约 Agent：Salesforce 侧（合同、历史、LTV、打开、Qualified 聊天、Momentum 通话）加上从未进 Salesforce 的数据（WordPress、社交、播客档案、Bizzabo 线索数），再经 [Gamma](https://gamma.app/) API 出定制 deck。上 Agent 之前，真正定制 deck 大约只给 **5** 家钻石赞助商，其余是模板跟进；现在能发出 **20 到 30** 份。银牌赞助商支票最小、历史上续约率最低，回复率反而高于钻石。Lemkin 的解释：对小公司，**$25K** 赞助比 Google Cloud 的 **$300K** 更难拍板，定制 deck 等于告诉对方「我们盯你们结果的认真程度，和盯钻石一样」。现在把同一做法用到新客户。

- **人先批故事，再让 Agent 生成；第一封要短。** 续约上留了两条规则，探客也沿用。Agent 先提议叙事，人批准后再开工。有一家银牌续约，Agent 建议「你是银牌，升金牌」；对方活动前刚出 stealth、后来长得很快，Amelia 改成三个选项（含媒体+内容档）。改故事只要几分钟，改已经做好的 deck 会久得多。第一封不带 deck，回复更好；对方回了什么，才决定方案里写什么。第一触达可以由 Agent 发，详细跟进由人发。

### 怎么做

面向正在给销售外呼上 AI、或已经买了 AI SDR、还想不要把独家客户数据浪费掉的 junior：不必复制 10K 这个名字，按同一组问题挡一遍。

1. **先买放量层。** 投递、序列、约会议、赢回、入站，继续用现成工具。不要因为「我们有 Agent」就重建 45 万级名单的投递栈。

2. **列出厂商看不见、对方却能核对的字段。** 参会次数、Newsletter 打开、你写过他们的文章、上次赞助的线索、通话记录。如果厂商接 CRM 已经覆盖大半，就不要自建。只有这些字段构成方案主体、而供应商根本没有它们时，才进入薄层。

3. **只给命名客户做，不要给全库做。** SaaStr 的自建工具用在一小批头部客户；其余 90% 仍走厂商。全库深读一方数据，成本和 API 账单都会先爆。

4. **生成前先批故事。** 让 Agent 先交出叙事（升舱、三档套餐、还是只续约），人改完再出邮件或 deck。先改故事，再改成品。

5. **第一封短，深的放跟进。** 用回复内容决定方案里写什么。抽几条真实发出去的方案：有没有写对方能核对的数字，有没有仍在写「像你们这样的公司」。

### 关键图表

![10K 的 Pitch Generator：Salesforce 历史、参会和 Newsletter 写进 ElevenLabs 的定制赞助方案](https://www.saastr.com/wp-content/uploads/2026/10/Screenshot-2026-09-28-at-9.07.21-AM-scaled.png)
*SaaStr 原文截图：10K 给 ElevenLabs 拉 Salesforce 历史、活动出席和 Newsletter，写出对方能核对的定制赞助方案*
