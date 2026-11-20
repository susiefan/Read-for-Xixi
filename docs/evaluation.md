# 逐页评测和重做

评测工具绑定 127.0.0.1，默认端口 4327。原始书页、脚本和 SVG 合成放在左边，评分和文字反馈放在右边。脚本 1–7 分，4 分通过；视觉通过或不通过。只有一个「保存并下一页」。视觉预选通过只是减少点击，不会自动创建评分。

每条评分绑定内容哈希。改动视觉不会使原脚本分数失效；脚本改动不会借用旧的脚本评分。旧评分和评语仍保存在 SQLite，反馈归档写到 data/local/script-eval-feedback/；review_loop.py 另写一份 data/local/eval-feedback/ 时间戳 Markdown。

`python scripts/review_loop.py` 读取真实已保存的评分，产出 data/local/revision-plan.json：

- 低于 4 分 → 只重做脚本。
- 视觉不通过 → 只重做视觉。
- 两项都失败 → 两项都重做。
- 已通过的评论 → 可选改进建议，不进入强制重做队列。
- 未评审 → pending，不伪装成失败或通过。

`regenerate_page.py --dimension script|visual|both` 每次最多尝试 3 次。结构错误、明显剧透、失去书页依据等才是 blocking。配色偏好或另一种合理说法是 suggestion。达到上限仍失败时保留当前接受版本，候选和原因写入本地报告。重做之后重新 prepare_examples.py，再评新的版本。

注意：import_existing_library.py 复制所选书的已有评测版本。试验脚本时先复制旧目录为 v2-round 并改名 v2.json，或在独立本地目录中保存新版本；不要把旧人评复制给新稿。

## 回归验证的范围

公开测试验证原文锁、书包完整性、安全导入、反馈维度隔离和合理建议不阻断。它们是合成的结构测试，不是新的演示绘本，也不是历史真人评分。现有两本书的实际检查通过 check_existing_library.py 在本地运行。

不要把机器结构检查称为真人评分、儿童测试或疗效证据。100 条带来源的评测基准尚未完成。
