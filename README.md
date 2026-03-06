# NextEditor Monorepo

这是一个基于 `pnpm workspace` 的 Monorepo，当前主要可用应用为桌面端 `Next编辑器`（Tauri + React）。

## 目录说明

-   `apps/frontend/destop`：桌面端编辑器（主入口）
-   `doc/tauri-react-editor.md`：开发日志与变更记录

## 环境要求

-   Node.js 18+
-   pnpm 8+
-   Rust 工具链（Tauri 构建需要）
-   Windows（当前主要目标平台）

## 安装依赖

在仓库根目录执行：

```bash
pnpm install
```

## 启动桌面端（开发）

```bash
pnpm -C apps/frontend/destop tauri:dev
```

仅前端调试：

```bash
pnpm -C apps/frontend/destop dev
```

## 打包

```bash
pnpm -C apps/frontend/destop tauri:build
```

## 使用流程（Next编辑器）

1. 打开应用后，点击顶部“文件”。
2. 选择“打开项目”并选择你的项目目录。
3. 左侧选择模块（项目配置、天赋、词缀、Buff、Item、神通、功法）。
4. 在中间表格选择数据，右侧表单编辑。
5. 完成后点击“文件 -> 保存项目”统一落盘。

## 元数据与自定义配置

编辑器会自动加载以下元数据来源：

-   内置：`editorMeta/*.json`
-   扩展：`config/*.json`

打包后也支持从 `exe` 同级目录加载：

-   `<exe目录>/config/*.json`

例如可放：

-   `<exe目录>/config/AttackType.json`

JSON 必须合法（不能有尾逗号）。示例：

```json
[
    {
        "Id": 28,
        "Desc": "心"
    }
]
```

## Seid 保存规则（当前）

-   天赋/Buff/Item：Seid 标识字段为 `id`
-   Skill/StaticSkill：Seid 标识字段为 `skillid`
-   保存时会合并旧文件同条目，未修改字段会保留，避免自定义字段丢失

## 常见问题

1. `tauri.conf.json` 解析失败（expected value at line 1 column 1）

-   通常是文件编码/BOM问题，保存为 UTF-8（建议无 BOM）。

2. 枚举显示“未定义”

-   先检查 JSON 是否合法；
-   再检查文件名与路径是否正确（如 `config/AttackType.json`）。
