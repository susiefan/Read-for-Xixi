# Read for Xixi · 和 Mimi 一起读

把已有绘本、脚本、动画场景和配音接成亲子共读体验的开源工具包。保留原书文字，提供自然中文邀请、简短回应和可逐页评审的视觉素材。

An open shared-reading toolkit: animated reading companions, image-grounded authoring rules, revision-aware evaluation, local library import and portable book packages.

**在线体验：[storyforxixi.susiefan.com](https://storyforxixi.susiefan.com/)**

我想减轻家长反复朗读、跨语言讲述和临场想互动问题的负担，让普通纸质书也有可参与的共读体验。角色提供陪伴，邀请把注意力带回实体书。在我对 5 位 2–4 岁儿童的早期观察中，孩子主要关注书本，角色似乎帮助维持参与；这是定性观察，不是效果验证。[问题、方案与研究依据](docs/why-read-for-xixi.md)。

三个内置伙伴的插画、矢量动画和 3D 造型由我原创，并在这里以 MIT 许可开源，方便大家使用、修改与分享。[角色介绍和自定义指南](docs/custom-companions.md)。

## 把自己的书页照片变成共读体验

安装 [setup-picture-book skill](skills/setup-picture-book)，或复制[完整家长工作流 prompt](prompts/photo-book-workflow.md)，提供书页照片文件夹。助手先询问孩子称呼、年龄和伙伴偏好，然后生成脚本与透明视觉素材，打开评测 WebApp。你给脚本 1–7 分、视觉通过/不通过并留言；修订通过后才开始最终配音并安装到本地阅读器。

可选的评测贡献会先显示脱敏后的实际文件，**经家长明确同意**才提交 GitHub PR；拒绝不影响制作和使用。维护者已授权公开的 [207 条历史评分与评语](evals/contributions)已包含在仓库，并用于整理 [LLM judge 评审标准](prompts/interaction-judge.md)。[完整操作指南](docs/photo-book-workflow.md)。

## 按孩子喜好制作伙伴

设置 → **导入伙伴**，选择一个 `.avatar.json` 文件。默认可直接选择已有[原创白猫](app/WhiteCatArtwork.tsx)，也可以把[白猫复用与自定义 prompt](prompts/reading-avatar.md)交给助手，或安装 [create-reading-avatar skill](skills/create-reading-avatar)。角色保存在当前浏览器，支持最多六个；现有故事和声音继续使用。

```bash
pnpm avatar:validate my-companion.avatar.json --preview preview.svg
```

## 运行 / Quick start

需要 Node.js 22.12+、pnpm 11.25.0、Python 3.11+。

```bash
git clone https://github.com/susiefan/Read-for-Xixi.git
cd Read-for-Xixi
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install --frozen-lockfile
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pnpm dev
```

终端显示本机地址，通常为 http://127.0.0.1:5173。仓库不包含绘本正文、扫描、配音或书籍专属素材。未导入时会显示导入提示；原创猫咪可以独立展示。**不需要 API key，也不会自动生成新书或声音。**

## 导入已有书库

本次选择现有的《波西和皮普：圣诞树》和《波西和皮普：最心爱的玩具》。每本 13 页、39 条音轨。选择元数据保存在 [examples/library-selection.json](examples/library-selection.json)。完整书包只保留在本地，公开仓库只包含代码和导入工具。

```bash
python scripts/import_existing_library.py /path/to/your/storyspark-app
python scripts/check_existing_library.py
```

输入目录应含 public/local-private/books.json、public/audio、所引用的场景素材，以及 data/local/script-evals 的既有逐页证据。扫描 PDF 默认从该目录旁边的书页文件夹读取，也可用 `--source-dir /path/to/pdfs` 指定。脚本会验证原文、复用已有互动和配音，复制已存在的素材，并把输出写入 **Git 忽略的 public/library/ 和 data/local/**。生成过程不调用模型、不创作新脚本、不改变音频。

导入工具可通过修改选择文件接入其他已完成的本地书籍。尚未制作的书可使用 [通用制作接口](docs/authoring.md)，但导入和运行现有书不需要重新制作。

## 阅读体验

- 默认中文界面，可切换英文；书名与简介有独立界面翻译，正文不被界面切换改写。
- 按钮翻页、重听、暂停、自动播放。每页讲述后必须有一个邀请，家长可点击「让 Mimi 回应」。
- 设置提供原创 3D Mimi、原创动画白猫和原版 2D Mimi，以及三种眼镜。还可导入按孩子偏好制作的动物伙伴。2D 使用 SVG 动画，并非 Cubism 模型。
- 阅读中不跟随鼠标；换页时猫咪不重新挂载，背景淡入。故事星在顶部累计，存于当前浏览器。
- 当前版本不使用麦克风、摄像头、语音控制、儿童录音或遥测。已有配音通过浏览器播放。

## 评测与进度看板

```bash
python evals/webapp/serve.py
```

- http://127.0.0.1:4327/ ：左侧原图、脚本、SVG 合成；右侧脚本 1–7 分、视觉通过/不通过和评语，共用「保存并下一页」。
- http://127.0.0.1:4327/open-source ：需求、待办、验证证据、用户待办和历史，可手动或自动刷新。
- 评分绑定内容哈希。脚本 4 分通过；通过维度保留，只重做失败维度。未评审保持 pending。
- SQLite 和独立 Markdown 反馈只存本地。私人历史评分默认留在本地；仅经明确授权的脱敏贡献集公开，不虚构人评或儿童研究结果。

```bash
python scripts/review_loop.py
```

生成定向重做计划。机器 critic 最多三次，只有明确错误才阻断，措辞或配色偏好作为建议。详见 [评测说明](docs/evaluation.md)。

## 格式、验证和贡献

[书包 Schema](schemas/book-package.schema.json) · [制作接口](docs/authoring.md) · [系统设计](design/README.md) · [运行与部署](docs/deployment.md)

```bash
pnpm test
python -m unittest discover -s tests -v
pnpm build
pnpm check:release
```

代码、原创猫咪和工具遵循 MIT；第三方依赖保留各自许可。原书和相关改编内容不因代码开源而获得再分发授权。见 [素材范围](ATTRIBUTION.md)、[贡献指南](CONTRIBUTING.md)、[安全说明](SECURITY.md)。

欢迎贡献：其他本地书库格式的导入器、语言适配、无障碍改进、原创场景部件及有明确来源的回归用例。100 条评测基准和 Bloom/H5P 互操作留在后续看板中，当前尚未完成。
