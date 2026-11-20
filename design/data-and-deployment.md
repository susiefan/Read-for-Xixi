# Data and publication boundaries

| Location | Purpose | Published |
|---|---|---|
| app/, web/, scripts/, prompts/, schemas/ | General code, original companions, reusable tools | Yes |
| examples/library-selection.json | Selected IDs and UI metadata | Yes |
| data/open-source-release.json | Requirements, tasks, validation status | Yes |
| public/library/ | Imported book text, scans, SVGs, audio | No, ignored |
| data/local/ | Source PDFs, reviews, receipts, private drafts | No, ignored |
| .env*, model weights, family recordings | Runtime secrets or private inputs | No |

运行时是静态 Vite 构建，可以部署 dist/；含本地书的构建同样带有书籍内容，不能当作通用开源包上传。公开代码的 Release 不包含完整书包。现有家庭网站通过 Sites 独立发布，自定义伙伴导入会同步到该体验站；书库仍不进入公开 GitHub 源码包。

评测工具单独运行于本机 127.0.0.1，Host/Origin 检查防止跨站写入，SVG 路由发送受限 CSP。它不是已加认证的公网服务。公开网站只托管静态阅读器，不应暴露本地评分写接口。

书包格式以 JSON Schema 版本化。导出带 SHA-256 清单，导入检查路径逃逸、重复成员、符号链接、数量/大小上限和哈希。新数据格式应先补兼容测试，再更新 schemaVersion。

自定义头像的数据契约是 reading-avatar v1。浏览器解析 JSON、校验路径和形状属性，再用 React 构造 SVG，不执行导入代码。最多保存六个，按 ID 更新，使用 localStorage 持久化；删除浏览器数据会删除本机导入。导入不改写书籍或配音。
