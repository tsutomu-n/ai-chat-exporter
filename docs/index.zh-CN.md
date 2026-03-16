# AI 聊天导出使用指南

[英文版指南](./index.md) | [日文版指南](./index.ja.md)

## 先从这些文件开始

- `./ai-chat-export.chrome.ja.bookmarklet.oneliner.js`
  - 适合 Chrome / Chromium 的日文版
- `./ai-chat-export.chrome.en.bookmarklet.oneliner.js`
  - 适合 Chrome / Chromium 的英文版
- `./ai-chat-export.chrome.zh-CN.bookmarklet.oneliner.js`
  - 适合 Chrome / Chromium 的简体中文版
- `./ai-chat-export.firefox.ja.bookmarklet.oneliner.js`
  - 适合 Firefox 的日文版
- `./ai-chat-export.firefox.en.bookmarklet.oneliner.js`
  - 适合 Firefox 的英文版
- `./ai-chat-export.firefox.zh-CN.bookmarklet.oneliner.js`
  - 适合 Firefox 的简体中文版

这个公开仓库主要提供这 6 个书签脚本文件。当前发布的 bookmarklet 使用更精简的结果界面，不包含可读源码 UI 中那种完整的保存预览。每个文件的语言都是固定的，Firefox 版会进一步压缩，以满足 Firefox 的书签长度限制。

## 基本用法

1. 打开与你的浏览器和语言匹配的书签脚本文件
2. 复制整个文件内容，粘贴到书签的 URL 栏
3. 在支持的对话页面运行书签脚本
4. 选择运行模式和输出格式
5. 查看质量状态后保存到文件或复制到剪贴板

## 运行模式

- `Fast`
  - 适合较短的对话，会更早停止
- `Normal`
  - 默认模式，适合日常使用
- `Careful`
  - 适合较长的对话，会滚动更多并尝试展开更多隐藏内容

如果对话很长，或者质量状态显示 `WARN` / `FAIL`，建议先用 `Careful` 再运行一次。

## 输出格式

- `Markdown`
  - 适合保存为普通 `.md` 文件的可读格式
- `纯文本`
  - 去掉大部分 Markdown 语法的轻量格式

`纯文本` 可以选择带对话头部，或只导出正文。

## 质量状态

- `PASS`
  - 没有发现明显问题
- `WARN`
  - 可能有内容缺失，或者与上次结果差异较大，建议先试 `Careful`
- `FAIL`
  - 建议在保存前重新运行

质量状态会结合抽取数量和与上次保存结果的比较来判断。

## 保存方式

- `Save file`
  - 直接保存为本地文件
- `Copy to clipboard`
  - 适合需要马上粘贴的情况

如果浏览器阻止写入剪贴板，工具会显示手动复制区域。

## `docs/` 目录包含什么

- `ai-chat-export.chrome.ja.bookmarklet.oneliner.js`
- `ai-chat-export.chrome.en.bookmarklet.oneliner.js`
- `ai-chat-export.chrome.zh-CN.bookmarklet.oneliner.js`
- `ai-chat-export.firefox.ja.bookmarklet.oneliner.js`
- `ai-chat-export.firefox.en.bookmarklet.oneliner.js`
- `ai-chat-export.firefox.zh-CN.bookmarklet.oneliner.js`
- `index.md`
- `index.ja.md`
- `index.zh-CN.md`

这个 `docs/` 目录只放公开发布用的书签脚本和使用指南。

## 源码与发布文件

- `src/ai-chat-export.js`
  - 可读源码
- `ai-chat-export.chrome.ja.bookmarklet.oneliner.js` / `ai-chat-export.chrome.en.bookmarklet.oneliner.js` / `ai-chat-export.chrome.zh-CN.bookmarklet.oneliner.js`
  - 面向 Chrome / Chromium 的发布版书签脚本
- `ai-chat-export.firefox.ja.bookmarklet.oneliner.js` / `ai-chat-export.firefox.en.bookmarklet.oneliner.js` / `ai-chat-export.firefox.zh-CN.bookmarklet.oneliner.js`
  - 面向 Firefox 的发布版书签脚本

发布文件通过 `scripts/generate_oneline_bookmarklet.sh` 重新生成。
