# Read for Xixi system design

本次候选版本将通用工具与本地书库分开。公开仓库包含阅读器、原创猫咪、导入工具、Schema、提示、评测服务与发布看板。用户选择现有《圣诞树》《最心爱的玩具》作为本地演示，不新建书，不把完整书包上传 GitHub。

```mermaid
flowchart LR
  L[既有本地书库\n已批准脚本、SVG、配音] --> I[导入与一致性检查]
  I --> P[忽略的本地阅读资源]
  I --> E[忽略的本地逐页证据]
  P --> R[静态阅读器\n按钮、自动播放、重听]
  E --> V[评测工具\n脚本 1–7、视觉通过/不通过]
  V --> F[本地 SQLite + Markdown 反馈]
  F --> T[仅失败维度的修订计划]
  T --> A[可选离线创作与 SVG Agent]
  A --> V
  A --> S[最后生成配音]
  D[版本化任务 JSON] --> B[需求与发布看板]
```

- [阅读运行时](reading-runtime.md)
- [制作和评审](book-production.md)
- [数据、隐私和发布边界](data-and-deployment.md)

本地复制既有书不会调用模型。付费 API 仅由显式运行离线 regenerate_page.py 发起，密钥只从服务端环境读取。机器检查不等于儿童测试或学习效果证据。
