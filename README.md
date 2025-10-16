# 儿童前后鼻音学习助手

一个帮助儿童学习和区分前鼻音与后鼻音的网页应用，包含对比听读、分类游戏、辨音挑战、词汇表与错题本等互动功能。项目为纯前端静态站点（HTML/CSS/JavaScript），可直接部署到 GitHub Pages。

## 功能概览
- 对比听读：播放前/后鼻音发音，对比学习。
- 分类游戏：拖拽单词到前鼻音或后鼻音篮子，即时反馈。
- 分类卡片点击朗读：在分类游戏中，点击词池或篮子中的词卡，立即朗读对应汉字；朗读前会取消未完成的语音以避免重叠。
- 辨音挑战：播放语音并选择前/后鼻音，统计分数与题数。
- 词汇表：前后鼻音词汇列表，支持动态生成。
- 错题本：记录错题次数与最近错题时间，支持排序与移除。
- 进度保存：在浏览器本地存储保存学习进度与错题数据。

## 交互说明
- 分类游戏：点击词卡朗读汉字；拖拽状态下不触发朗读；放入篮子后仍可点击朗读。
- 对比听读：点击播放按钮朗读前/后鼻音；支持标记为错题与打开错题本。
- 辨音挑战：点击“播放词语”进行朗读，选择前/后鼻音作答并即时反馈。

## 技术栈
- 纯前端：`index.html`、`script.js`
- 样式：Tailwind CSS（CDN 引入）
- 图标：Font Awesome（CDN 引入）
- 本地预览：`python3 -m http.server`（可选）

## 快速开始（本地预览）
1. 在项目根目录启动本地静态服务器：
   - macOS/Linux：`python3 -m http.server 8000`
   - Windows（已安装 Python）：`py -m http.server 8000`
2. 打开浏览器访问：`http://localhost:8000/` 或 `http://localhost:8000/index.html`

## 部署到 GitHub Pages
1. 在 GitHub 创建新仓库（公开或私有）。
2. 在本地初始化并推送：
   - `git init`
   - `git add .`
   - `git commit -m "Initial commit: nasal learning app"`
   - `git branch -M main`
   - `git remote add origin https://github.com/<你的用户名>/<仓库名>.git`
   - `git push -u origin main`
3. 打开仓库的 `Settings` → `Pages`：
   - Source 选择 `Deploy from a branch`
   - Branch 选择 `main`
   - Folder 选择 `/ (root)`
4. 保存后等待几分钟，完成部署。页面地址通常为：`https://<你的用户名>.github.io/<仓库名>/`

## 目录结构
```
/               # 项目根目录
├── index.html  # 入口页面（静态）
├── script.js   # 主要交互逻辑、事件绑定、数据处理
├── 98组前后鼻音词汇表 - Sheet1.csv  # 词表数据（可选，解析后生成词对）
├── Gemini_Generated_Image_*.png     # 图片资源（示意图标）
├── README.md   # 项目说明文档（本文件）
├── LICENSE     # 开源许可证（Apache License 2.0）
└── .gitignore  # Git 忽略配置
```

## 许可证
本项目采用 `Apache License 2.0` 开源许可证。详见本仓库中的 `LICENSE` 文件。

## 免责声明（Disclaimer）
Disclaimer: This project may include code generated with the assistance of AI tools.
The author makes no representations or warranties regarding the originality,
accuracy, or non-infringement of third-party rights.
Use of this software is at your own risk.

声明：本项目可能包含由 AI 工具辅助生成的代码。作者不对其原创性、准确性或不侵犯第三方权利作任何保证。使用本软件产生的风险由您自行承担。

## 致谢
- Tailwind CSS
- Font Awesome
- 开源社区与所有贡献者