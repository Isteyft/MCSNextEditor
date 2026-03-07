# Desktop 设置与删除可靠性修复说明

更新日期：2026-03-07
范围：`apps/frontend/destop`

## 1. 主窗口分辨率设置

### 目标

-   提供固定分辨率下拉选项。
-   保存后可立即应用到主窗口。
-   下次启动仍按保存值打开。

### 当前下拉选项

-   `800x600`
-   `1280x968`
-   `1440x1080`
-   `1920x1080`

### 关键实现

-   设置模型新增字段：`mainWindowWidth`、`mainWindowHeight`。
-   设置窗口保存后通过事件广播最新设置给主窗口。
-   主窗口监听事件后：
    -   同步本窗口存储；
    -   立即应用窗口尺寸。
-   启动时也会按设置值应用一次分辨率。

### 关键文件

-   `src/components/settings/SettingsForm.tsx`
-   `src/features/settings/app-settings-store.ts`
-   `src/features/settings/useAppSettings.ts`
-   `src/features/settings/settings-events.ts`
-   `src/SettingsWindowApp.tsx`
-   `src/App.tsx`

## 2. 主窗口关闭时联动关闭设置窗口

### 目标

-   关闭主窗口后，设置窗口也自动关闭，避免孤儿窗口。

### 实现

-   主窗口注册关闭事件（`onCloseRequested`）。
-   在关闭回调中主动关闭 `settings-window`（若存在）。

### 关键文件

-   `src/features/settings/settings-window.ts`
-   `src/App.tsx`

## 3. 删除后“看似删除但又回来”的修复

### 问题根因

-   旧逻辑保存时只写当前内存数据，不清理磁盘上的旧文件/旧 seid 文件内容。
-   重新加载时会再次扫到旧文件，导致“删除后复活”。

### 修复策略

-   新增后端文件删除命令：`delete_file_payload`。
-   保存阶段增加“清理多余文件”逻辑：
    -   Buff/Item/Skill 主文件目录中，不在当前数据集内的 json 文件会删除。
    -   各模块 Seid 目录中，不再需要的 seid json 文件会删除。
-   Seid 文件写入从“合并旧数据”改为“按当前状态全量覆盖”，防止旧行残留。

### 影响模块

-   Buff
-   Item
-   Skill
-   Talent Seid
-   StaticSkill Seid

### 关键文件

-   `src-tauri/src/lib.rs`
-   `src/services/project-api.ts`
-   `src/features/project-save/useProjectSave.ts`
-   `src/components/buff/buff-domain.ts`
-   `src/components/item/item-domain.ts`
-   `src/components/skill/skill-domain.ts`
-   `src/components/tianfu/talent-domain.ts`
-   `src/components/staticskill/staticskill-domain.ts`

## 4. 权限与生效要求

### Tauri 窗口尺寸权限

-   已在能力文件补充：`core:window:allow-set-size`。
-   若未重启 tauri 进程，该权限不会生效。

### 需要重启的场景

-   修改了 `src-tauri/capabilities/default.json` 或 `src-tauri/src/lib.rs` 后，需要重启：
    -   停止 `pnpm tauri dev`
    -   重新执行 `pnpm tauri dev`

## 5. 建议验证清单

1. 分辨率：在设置窗口切换到 `800x600` 后保存，主窗口立即变化。
2. 分辨率持久化：关闭并重启应用后，主窗口仍为保存值。
3. 联动关闭：关闭主窗口时，设置窗口同时关闭。
4. 删除可靠性：删除 Buff/Item/Skill 条目后保存，重启或重载不应复活。
5. Seid 清理：删除 seid 关联后保存，对应 seid 文件内容不应保留旧 owner 行。

## 6. Project Open Loading Progress (blocking)

### Goal

-   Show a modal with progress while opening a project.
-   Block main window interaction until all project data is fully loaded.

### Implementation

-   Added loading state in `App.tsx`:
    -   `projectLoading.open`
    -   `projectLoading.progress`
    -   `projectLoading.message`
-   Added blocking overlay modal in `App.tsx`:
    -   Title: project loading
    -   Progress bar + percentage
    -   No close action during loading
-   Added progress callback in `useProjectLifecycle.ts`:
    -   `onProjectLoadingChange?: ({ open, progress, message }) => void`
-   Updated `reloadProject` load flow:
    -   step-by-step progress updates for meta/enum loading
    -   folder snapshot preload changed to sequential progress reporting
    -   modal closes only after all steps complete (in `finally`)

### Key Files

-   `src/features/project-shell/useProjectLifecycle.ts`
-   `src/App.tsx`
-   `src/styles.css`

## 7. Loading Modal UI Tuning

### Changes

-   Centered loading title in modal.
-   Reduced extra vertical spacing around the title.

### Key Files

-   `src/styles.css`

## 8. Tauri Window Destroy Permission

### Problem

-   Runtime error: `window.destroy not allowed` with required permission `core:window:allow-destroy`.

### Fix

-   Added `core:window:allow-destroy` to Tauri capability permissions.

### Key Files

-   `src-tauri/capabilities/default.json`

### Note

-   After capability changes, fully restart dev process:
    -   stop `pnpm tauri dev`
    -   run `pnpm tauri dev` again

## 9. JSON Import Modal Size Adjustment

### Changes

-   JSON import modal width adjusted to around `500px`.
-   JSON textarea changed to fixed height with scroll:
    -   `height: 220px`
    -   `resize: none`
    -   `overflow: auto`

### Key Files

-   `src/components/workspace/InfoPanel.tsx`
-   `src/styles.css`
