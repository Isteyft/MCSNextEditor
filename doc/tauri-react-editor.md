# Next编辑器（Tauri + React）开发日志

## 项目定位

用于编辑 Next Mod 数据的桌面工具，当前采用 `Tauri + React + Vite`。

## 应用信息

-   应用名：`Next编辑器`
-   Tauri Product Name：`Next编辑器`
-   图标：`apps/frontend/destop/src-tauri/icons/icon.ico`
-   主要入口：`apps/frontend/destop/src/App.tsx`

## 目录结构（前端）

-   `apps/frontend/destop/src/components/project`
-   `apps/frontend/destop/src/components/topbar`
-   `apps/frontend/destop/src/components/workspace`
-   `apps/frontend/destop/src/components/tianfu`
-   `apps/frontend/destop/src/components/buff`
-   `apps/frontend/destop/src/components/item`
-   `apps/frontend/destop/src/components/skill`
-   `apps/frontend/destop/src/components/staticskill`
-   `apps/frontend/destop/src/services`
-   `apps/frontend/destop/src/types`

## 关键能力状态

-   顶部自定义标题栏、窗口拖拽、最小化/最大化/关闭
-   文件菜单：新建项目、打开项目、保存项目
-   三栏布局：左侧模块树 / 中间表格 / 右侧表单
-   模块：项目配置、天赋、词缀、Buff、Item、神通、功法
-   表格支持：搜索、多选、复制粘贴、删除、批量改ID
-   Seid 编辑器：按元数据渲染属性、支持特殊抽屉选择

## 元数据加载规则

-   内置元数据来源：`editorMeta/*.json`
-   扩展元数据来源：`config/*.json`
-   枚举读取支持多文件合并（同ID后者覆盖前者）
-   可通过 `./config/AttackType.json` 等文件扩展/覆盖选项

## 保存策略（当前）

-   先缓存，点击“保存项目”统一落盘
-   Seid 文件保存规则：
    -   天赋/Buff/Item 使用标识字段 `id`
    -   Skill/StaticSkill 使用标识字段 `skillid`
    -   只写标识字段 + 业务值字段（value/target等）
-   Seid 保存会先读取旧文件并按同条目合并：
    -   未修改字段保留旧值
    -   不会因编辑器未显示字段而清空自定义值

## 最近修改日志

### 2026-03-06

-   修复批量改ID逻辑：输入起始值 `40` 且选中15条时，结果为 `40-54`（不再拼接为 `401-4015`）。
-   统一 Seid 标识符：
    -   Skill/StaticSkill 改为 `skillid`。
    -   其他模块保持 `id`。
-   Seid 持久化增强：
    -   过滤多余字段，避免写入无关字段。
    -   保存时合并旧行数据，保留未修改字段。
-   Seid 编辑体验优化：
    -   按字段类型展示默认值：`Int/Float/Number=0`、`String=''`、`IntArray=[]`。
-   元数据扩展增强：
    -   `config/*.json` 参与枚举候选路径。
    -   同名枚举支持多文件合并。
-   菜单显示修复：
    -   顶部下拉菜单和右键菜单增加边界修正与最大高度滚动，底部不再显示不全。
-   删除行为调整：
    -   删除目录改为直接删除，不再弹系统确认框。
-   新增唯一ID联动规则：
    -   在神通/功法表单中，当当前条目 `Skill_Lv = 1` 且修改 `Skill_ID` 时，
        同旧 `Skill_ID` 的整组条目会同步更新为新 `Skill_ID`。

## 运行

```bash
pnpm -C apps/frontend/destop tauri:dev
```

## 类型检查

```bash
pnpm -C apps/frontend/destop typecheck
```
