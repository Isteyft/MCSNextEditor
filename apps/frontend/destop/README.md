# Next编辑器（Desktop）

Next编辑器是一个基于 `Tauri + React + Vite` 的本地 Mod 数据编辑器，面向 Next 模组数据（天赋、Buff、Item、神通、功法等）。

## 功能概览

-   自定义标题栏，支持窗口拖拽、最小化、最大化/还原、关闭
-   文件菜单：新建项目、打开项目、保存项目
-   三栏编辑布局：
    -   左侧：项目与模块树
    -   中间：数据表格
    -   右侧：结构化表单编辑
-   模块支持：
    -   项目配置（`Config/modConfig.json`）
    -   天赋（CreateAvatar）
    -   词缀（Affix）
    -   Buff
    -   Item
    -   神通（Skill）
    -   功法（StaticSkill）

## 数据与 Seid 保存规则

-   全部编辑先写入内存缓存，点击“保存项目”统一落盘
-   Seid 标识字段：
    -   天赋/Buff/Item：`id`
    -   Skill/StaticSkill：`skillid`
-   Seid 文件仅写入“标识字段 + 业务值字段”
-   保存 Seid 时会读取旧文件并合并同条目，未修改字段保留，避免自定义字段丢失

## 元数据加载机制

支持两层来源，并自动合并：

1. `editorMeta/*.json`（内置）
2. `config/*.json`（扩展）

说明：可通过 `config/AttackType.json` 等文件扩展或覆盖同ID枚举。

## 快捷键

-   `Ctrl/Cmd + C`：复制选中行（应用内）
-   `Ctrl/Cmd + V`：粘贴（支持冲突重命名逻辑）
-   `Delete`：删除选中行

## 目录

-   前端：`apps/frontend/destop/src`
-   Tauri：`apps/frontend/destop/src-tauri`
-   开发日志：`doc/tauri-react-editor.md`

## 开发运行

```bash
pnpm -C apps/frontend/destop tauri:dev
```

仅前端调试：

```bash
pnpm -C apps/frontend/destop dev
```

类型检查：

```bash
pnpm -C apps/frontend/destop typecheck
```

## 打包

```bash
pnpm -C apps/frontend/destop tauri:build
```
