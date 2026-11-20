# Book production and review

本次只运行 import_existing_library.py，按选择文件复制已完成书籍。check_existing_library.py 检查原文字段、邀请、回应及素材/音轨哈希。它不对已批准内容重写、重画或重配音。

通用离线工具供后续书籍使用：init_book.py 生成待核对的证据框架；regenerate_page.py 以原页图片作为输入，创作 Agent 同时写译文、互动和视觉计划。视觉 Agent 使用独立系统提示，根据原图和书脚本中的计划画透明平涂 SVG。script-only 保留原视觉，visual-only 保留原脚本；both 才同时改。

内部回路先做确定性安全/结构检查，再用原图与渲染图交给 critic。明确 material error 才 blocking，合理替代、措辞和配色偏好为 suggestion。最多 3 次；超限保留原接受版本，记录候选和原因。文字锁由程序保留，不交给模型自由改写。

评测工具左边原页、脚本、视觉，右边脚本 1–7 分、视觉二选一、评论，一个保存并下一页。评分依脚本/视觉分别绑定 revision hash。review_loop.py 只把脚本 <4 或视觉不通过放进重做队列；通过维度、未评审和可选建议不被当作失败。

语音是最后一步。build_package_manifest.py 确定性读取已接受的文案，不再通过 LLM 润色。render_package_audio.py 绑定清单与声音配置哈希，使用单书进程锁，原子写入 WAV，支持同一配置续跑。可选 CosyVoice 环境由贡献者另行安装，不随仓库分发。
