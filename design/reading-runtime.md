# Reading runtime

入口是 web/main.tsx → app/OpenReader.tsx。React 管理选书、页码、播放阶段、暂停与自动播放。书库从同源 /library/books.json 读取；没有书库时展示导入提示和原创猫咪。

阶段为 story → invitation → waiting → response → ready。每次播放使用 generation token；翻页/重播取消旧播放器，旧 onended 不得推进新页面。上一页与下一页独立于当前阶段。自动播放等待交流 5 秒，然后回应，间隔 1.5 秒继续下一页；取消或翻页会清理定时器。

既有音轨使用每页明确的 audioTracks URL，保留原有从零开始的文件编号。可选新书包采用从一开始的通用命名；两种情况不会混用或重命名已有 WAV。

2D 白猫通过 SVG rig 眨眼、呼吸和口型；3D Mimi 用 Three.js 自有几何体。readingSession/reading 在阅读中禁用鼠标跟随。猫咪组件不以页码作为 React key，背景通过 ReadingSceneLayer 预加载和淡入更换。舞台高度固定，星星放顶部。界面用同一系统字体栈。

星星计数保存在浏览器 localStorage，完成时累加。没有云端账号同步；清除站点数据会清除本机进度。界面语言与正文分别处理，切换中英文不会重写脚本或语音。
