# AI 聊天导出

[英文版](README.md) | [日文版](README.ja.md)

这是一个书签脚本，用来直接在浏览器中保存 Claude、ChatGPT、Grok、Google AI Studio 等站点里的对话。

## 这个工具的用途

很长的 AI 对话通常不容易完整保存。无限滚动、折叠内容、复制遗漏，都会让保存结果不完整。

这个工具的目标是尽量稳定地收集对话，并导出成便于本地保存和整理的格式。

- 一次抓取较长的 AI 对话
- 让用户发言和模型回复保持清晰
- 导出为 Markdown 或纯文本
- 保存前先看质量检查，判断是否可能有遗漏

## 主要功能

- 以书签脚本方式运行，不需要安装浏览器扩展
- 内置 Claude、ChatGPT、Grok、Google AI Studio 等站点适配
- 自动向上和向下滚动，尽量拿到完整对话
- 自动点击 `Show more`、`阅读全文` 一类展开按钮
- 支持 `Markdown` 和 `纯文本` 两种导出格式
- 保存前显示质量检查
- 支持保存到文件或复制到剪贴板
- 在浏览器里记住模式和导出格式

## 推荐文件

- `ai-chat-export.chrome.bookmarklet.oneliner.js`
  - 适合 Chrome / Chromium 的单文件版本
- `ai-chat-export.firefox.bookmarklet.oneliner.js`
  - 适合 Firefox 的更小单文件版本
  - 结果界面更精简，更容易满足 Firefox 的书签长度限制

## 使用效果

### 添加书签

![书签设置界面](assets/01-bookmark-setup.png)

把文件内容粘贴到 Chrome 或其他 Chromium 浏览器的书签 URL 栏里即可。

### 运行设置

![运行设置对话框](assets/02-config-dialog.png)

开始前可以选择模式和保存格式。

### 导出结果

![导出结果对话框](assets/03-export-result.png)

即使是很长的对话，也可以保存成可读性较好的 Markdown。

## 最快使用方法

1. Chrome / Chromium 使用 `ai-chat-export.chrome.bookmarklet.oneliner.js`，Firefox 使用 `ai-chat-export.firefox.bookmarklet.oneliner.js`
2. 复制整个文件内容，粘贴到浏览器书签的 URL 栏
3. 打开支持的网站对话页面并运行书签脚本
4. 在对话框中选择运行模式和保存格式
5. 查看质量检查后再保存

## 适合哪些场景

- 以后还想用 Markdown 重新阅读的对话
- 想快速分享为纯文本的对话
- 手动复制时容易漏掉内容或出现重复的长对话

## 输出格式

- `Markdown`
  - 适合保存为普通 `.md` 文件
- `纯文本`
  - 尽量去掉 Markdown 语法的轻量格式

纯文本支持带对话头部或只导出正文。

## 运行模式

- `Fast`
  - 适合较短的对话
- `Normal`
  - 默认模式，适合大多数情况
- `Careful`
  - 适合较长的对话，会更努力把内容加载完整

## 质量检查

工具会在保存前显示 `PASS` / `WARN` / `FAIL`。如果较长的对话出现 `WARN` 或 `FAIL`，通常建议先用 `Careful` 再运行一次。

## 支持站点

- `chatgpt.com` / `chat.openai.com`
- `claude.ai`
- Grok 相关域名和 `x.com/i/grok`
- `aistudio.google.com`
- 部分 `gemini` / `deepseek` 相关域名

## 仓库结构

- `ai-chat-export.chrome.bookmarklet.oneliner.js`
  - 面向 Chrome / Chromium 的 ASCII 单文件版本
- `ai-chat-export.firefox.bookmarklet.oneliner.js`
  - 面向 Firefox 的 ASCII 更小单文件版本
- `src/ai-chat-export.js`
  - 可读源码

## 详细文档

- [docs/index.md](docs/index.md)
- [docs/index.ja.md](docs/index.ja.md)
- [docs/index.zh-CN.md](docs/index.zh-CN.md)

## 开发说明

重新生成单文件脚本：

```bash
bash scripts/generate_oneline_bookmarklet.sh
```

同步 `docs/` 资源：

```bash
bash scripts/sync_docs_assets.sh
```

## 许可证

Apache License 2.0
