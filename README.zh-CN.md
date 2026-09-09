# dsh-desktop-drop-path

把文件拖进 DSH 输入框，**自动填入该文件的绝对路径**。

> **仅限桌面版（Desktop only）。** 本插件通过 DSH Desktop 的 Electron preload 桥
> （`window.__DSH_DESKTOP_FILE_PATH__`）解析文件真实的绝对路径。在纯网页版
> （浏览器里的 dsh web）没有这个桥，因此插件**不安装任何处理**、保持惰性——它
> 故意**不会**插入一个误导性的文件名来代替真实路径。

## 它能做什么

把一个**非图片**文件（`.pdf`、`.md`、`.txt`、`.json`、代码文件……）拖到输入框上。
它不会"上传"这个文件，而是把文件的**完整绝对路径**填进输入框——你把它发给 agent，
agent 就能直接从磁盘读取这个文件。

- 单文件 → 一行路径。
- 多文件 → 每个路径一行。
- **图片**拖拽不受影响，仍走内置的图片附件轨。

## 安装（从 GitHub 直装）

```bash
pnpm dsh plugin --profile <profile-name> add git+https://github.com/duanzongyuan/dsh-desktop-drop-path.git
```

把 `<profile-name>` 换成你的 DSH profile（如 `desktop`、`web`）。

安装后请重启 DSH Desktop。

## 为什么填路径而不是上传？

DeepSeek Harness 是从磁盘（工作区 / 任意绝对路径）读取文件的，它的消息附件协议
**只支持图片**，所以没有"上传非图片文件"的通道。这个插件用一个更自然的方式补上缺口：
把文件的真实路径交给 agent，让 agent 自己去读。

## 说明 / 注意事项

- **仅限桌面版。** 需要 DSH Desktop 应用；纯浏览器里它不生效（并且有意不插入误导性的文件名）。
- **耦合点。** 关闭内置拖放提示遮罩依赖
  `@deepseek-ai/dsh-client-ui-attachment` 插件的 `window` 级 `dragend` 复位逻辑。
  如果那个内置插件改动，遮罩关闭可能需要微调。
- 非图片的拖拽在 capture 阶段被消费，内置图片处理器不会去拒绝它。

## License

[MIT](./LICENSE)

[English](./README.md)
