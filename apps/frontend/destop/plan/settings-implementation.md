# 设置功能实现说明

## 文档目的

该文档记录 `destop` 端当前设置系统的已实现能力、配置项含义、落盘方式与生效逻辑，便于后续维护与迭代。

## 配置存储

-   存储位置（文件）：`appDataDir/app-settings.json`
-   兼容旧数据：会兼容读取历史 localStorage 字段并规范化。
-   相关代码：
    -   `src/features/settings/app-settings-store.ts`
    -   `src/features/settings/useAppSettings.ts`

## 当前设置项

### 1. JSON 导入

-   `jsonImportFolderPaths: string[]`
    -   多目录选择与保存。
-   `jsonImportFilePaths: string[]`
    -   多文件选择与保存。

### 2. 编辑器

-   `uniqueIdSyncEnabled: boolean`
    -   是否启用神通/功法唯一 ID 联动。
-   `uniqueIdSyncTriggerLevels: number[]`
    -   联动触发等级列表（输入框逗号分隔，当前限制 0-5）。
-   `batchIdChangeKeepOriginal: boolean`
    -   批量改 ID 时是否保留原数据。
    -   `false`: 替换模式（旧 ID 记录会被替换掉）
    -   `true`: 保留模式（旧 ID 记录保留，同时新增新 ID 记录）

### 3. 自动保存

-   `autoSaveEnabled: boolean`
    -   是否启用自动保存。
-   `autoSaveIntervalSeconds: number`
    -   自动保存间隔（秒），最小 5，默认 60。

## 自动保存生效逻辑

-   自动保存在主编辑器中按间隔触发。
-   仅在“已打开项目 + 存在未保存改动”时执行。
-   有并发保护，避免重复提交保存。
-   相关代码：`src/App.tsx`

## 设置窗口交互

-   右下角按钮：
    -   `保存设置`：保存到内存与配置文件。
    -   `重置`：重置到默认值并写回配置文件。
-   状态栏会显示保存/重置结果和文件路径。
-   相关代码：`src/SettingsWindowApp.tsx`

## 与业务逻辑的连接

### 神通（Skill）

-   文件：`src/features/modules/skill/useSkillHandlers.ts`
-   联动逻辑读取：
    -   `uniqueIdSyncEnabled`
    -   `uniqueIdSyncTriggerLevels`
    -   `batchIdChangeKeepOriginal`

### 功法（StaticSkill）

-   文件：`src/features/modules/staticskill/useStaticSkillHandlers.ts`
-   联动逻辑读取：
    -   `uniqueIdSyncEnabled`
    -   `uniqueIdSyncTriggerLevels`
    -   `batchIdChangeKeepOriginal`

## 默认值

-   `autoSaveEnabled = true`
-   `autoSaveIntervalSeconds = 60`
-   `uniqueIdSyncEnabled = false`
-   `uniqueIdSyncTriggerLevels = [1]`
-   `batchIdChangeKeepOriginal = false`
-   `jsonImportFolderPaths = []`
-   `jsonImportFilePaths = []`
