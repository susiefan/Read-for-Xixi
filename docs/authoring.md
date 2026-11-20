# 通用制作接口（本次无需运行）

本次直接导入现有两本书，不运行脚本创作、图像生成或配音。以下是供贡献者处理自己有权使用的书籍的可选接口。

# 从有授权的书到可播放书包

## 先建立原文证据

```bash
python scripts/init_book.py my-book.pdf data/local/my-book \
  --id my-book --title 'My Book' --source-url 'https://example.org/book' \
  --license CC-BY-4.0 --license-url 'https://creativecommons.org/licenses/by/4.0/' \
  --creator 'Original creator' --pages 1,5,6,7
```

这一步不调用 API。PDF 文本提取是暂定证据；对照图片检查 source.json 的 printedEvidence 和 visibleEvidence，修正页序与字形，尤其注意隐藏的排版文本。原文保留在 story，中文译文另存 narration.zh-CN。不可用改写原文来让互动显得更好。

## 图片优先创作与 SVG 生成

把 OPENAI_API_KEY 只放在服务端环境中，`--model` 和 `--visual-model` 使用你账号实际有权限的视觉模型名称；不硬编码假定存在的模型。运行会产生 API 费用。示例播放和评测不需要此步骤。

```bash
python scripts/regenerate_page.py data/local/my-book p01 \
  --dimension both --model YOUR_MODEL --visual-model YOUR_VISUAL_MODEL
```

1. 创作 Agent 接收**这一页原始图片**、已核对原文、前页连续性、适龄规则和指定评语，同时产出中文共读译文、邀请、回应和视觉计划。视觉计划直接放在书的脚本文件，不另写 brief。
2. 独立视觉 Agent 接收原图、脚本中的视觉计划和 Mimi 风格参考，产出透明平涂 SVG。允许选择当页有趣细节、表情、颜色、数量、礼貌或交友，不强制每次只问主角。明显有趣的线索优先。
3. SVG 先通过结构检查，再把原图和渲染图一起送内部 critic。最多三次；只修明确问题。script-only 保留已经通过的 SVG 和视觉计划；visual-only 保留原脚本。
4. 已有与计划匹配的视觉不必重画；脚本单独润色使用 `--dimension script`。选择 `both` 表示明确请求同时重画。
5. 保存逐页评测。收到反馈先看定向重做计划，不整本推倒重写。

系统提示分别在 prompts/authoring.md、prompts/visual-assets.md、prompts/voice.md。原有生产规则 v42 保存在创作提示中，包括首级线索、自然中文、不重复、不剧透、真实拟声、动作参与和当页情绪消化。在线生成不会自动变更这些全局提示；把可复用的人评规律写成新的提示版本并运行回归用例。

## 最后生成声音

先完成文字和视觉的内部编辑核对，再准备 audio-manifest.json。声音步骤不调用 LLM 重写文字；它确定性地锁定所有轨道。

```bash
python scripts/build_package_manifest.py data/local/my-book
python scripts/render_package_audio.py data/local/my-book \
  --lab /path/to/tts-lab --python /path/to/tts-lab/cosy-env/bin/python
```

本地 lab 目录需要 CosyVoice/ 源码和 pretrained_models/Fun-CosyVoice3-0.5B/；按 [官方说明](https://github.com/QwenAudio/CosyVoice) 安装其独立环境。首次运行上游引擎可能尝试下载文本前端；离线部署应事先预热缓存。引擎初始化不是跨平台一键安装，本仓库不分发权重。Linux/macOS 的单书文件锁避免重复任务；语音渲染器目前不支持 Windows，Windows 用户可播放已有音频或在 WSL 中渲染。

文字清单和声音配置共同形成哈希。已完成的 WAV 可续跑；文字或配置变了则拒绝把旧语音当新语音，须保留旧书包并创建新版本。STORYSPARK_TTS_THREADS 可调 CPU 线程数，默认 2。每本书独立输出，可按机器资源并行渲染。

## 验证和交付

```bash
python scripts/book_package.py validate data/local/my-book --require-audio
python scripts/book_package.py export data/local/my-book my-book.xixi.zip
```

书包包括原 PDF、原文证据、脚本（含视觉计划）、透明 SVG、语音和 SHA-256 清单。导入检查路径、文件数、总大小、符号链接、清单完整性和哈希。完整书包保存在 data/local/，不要放入 Git 追踪目录。当前阅读器的自动接入由 import_existing_library.py 负责，输入为已完成制作的本地书库。
