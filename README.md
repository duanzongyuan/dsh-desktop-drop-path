# dsh-desktop-drop-path

> **English** | [中文](./README.zh-CN.md)

Drag a file into the DSH composer to **auto-fill its absolute path**.

> **Desktop only.** This plugin resolves a file's real absolute path through the
> DSH Desktop Electron preload bridge (`window.__DSH_DESKTOP_FILE_PATH__`). In
> the plain web UI (dsh web in a browser) that bridge does not exist, so the
> plugin installs nothing and stays inert.

## What it does

Drop a **non-image** file (`.pdf`, `.md`, `.txt`, `.json`, code, …) onto the
composer input box. Instead of uploading it, the plugin inserts the file's
**full absolute path** into the input, so you can send it to the agent and it
can read the file straight from disk.

- Single file → one line with the path.
- Multiple files → one path per line.
- **Image** drops are untouched and keep using the built-in image attachment rail.

## Install (from GitHub)

```bash
pnpm dsh plugin --profile <profile-name> add git+https://github.com/duanzongyuan/dsh-desktop-drop-path.git
```

Replace `<profile-name>` with your DSH profile (e.g. `desktop`, `web`), and
`duanzongyuan` with your GitHub username.

After installing, restart DSH Desktop.

## Why a path instead of an upload?

DeepSeek Harness reads files from your disk (the workspace / any absolute path).
Its message-attachment protocol is image-only, so there is no "upload a
non-image file" channel. This plugin bridges that gap the natural way: it hands
the agent the file's real path so the agent can read it itself.

## Notes / caveats

- **Desktop only.** Requires the DSH Desktop app. In a plain browser it does
  nothing (it deliberately does not insert a misleading filename).
- **Coupling.** Clearing the built-in drop hint overlay relies on the
  `@deepseek-ai/dsh-client-ui-attachment` plugin's `window`-level `dragend`
  reset. If that internal plugin changes, overlay dismissal may need a tweak.
- Non-image drops are consumed in the capture phase; the built-in image handler
  does not reject them.

## License

[MIT](./LICENSE)
